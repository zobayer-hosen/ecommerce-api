package repository

import (
	"context"
	"fmt"
	"strconv"
	"strings"

	"ecommerce-api/internal/database"
	"ecommerce-api/internal/dto"
	"ecommerce-api/internal/models"

	"gorm.io/gorm"
)

type ProductRepository interface {
	Create(ctx context.Context, product *models.Product) error
	FindByID(ctx context.Context, id int64) (*models.Product, error)
	FindBySlug(ctx context.Context, slug string) (*models.Product, error)
	FindByIDOrSlug(ctx context.Context, idOrSlug string, activeOnly bool) (*models.Product, error)
	FindBySKU(ctx context.Context, sku string) (*models.Product, error)
	Update(ctx context.Context, product *models.Product) error
	SoftDelete(ctx context.Context, id int64) error
	List(ctx context.Context, filter dto.ProductFilter) ([]models.Product, int64, error)
	ListLowStock(ctx context.Context, threshold int, page, limit int) ([]models.Product, int64, error)
	CountLowStock(ctx context.Context, threshold int) (int64, error)
	DecrementStock(ctx context.Context, productID int64, quantity int) (bool, error)
	IncrementStock(ctx context.Context, productID int64, quantity int) error
}

type productRepository struct {
	db *gorm.DB
}

func NewProductRepository(db *gorm.DB) ProductRepository {
	return &productRepository{db: db}
}

func (r *productRepository) getDB(ctx context.Context) *gorm.DB {
	return database.GetDB(ctx, r.db)
}

func (r *productRepository) Create(ctx context.Context, product *models.Product) error {
	return r.getDB(ctx).Create(product).Error
}

func (r *productRepository) FindByID(ctx context.Context, id int64) (*models.Product, error) {
	var product models.Product
	err := r.getDB(ctx).Preload("Category").First(&product, id).Error
	if err != nil {
		return nil, err
	}
	return &product, nil
}

func (r *productRepository) FindBySlug(ctx context.Context, slug string) (*models.Product, error) {
	var product models.Product
	err := r.getDB(ctx).Preload("Category").Where("slug = ?", slug).First(&product).Error
	if err != nil {
		return nil, err
	}
	return &product, nil
}

func (r *productRepository) FindByIDOrSlug(ctx context.Context, idOrSlug string, activeOnly bool) (*models.Product, error) {
	var product models.Product
	query := r.getDB(ctx).Preload("Category")

	if activeOnly {
		query = query.Where("status = ?", models.ProductStatusActive)
	}

	if id, err := strconv.ParseInt(idOrSlug, 10, 64); err == nil {
		query = query.Where("id = ? OR slug = ?", id, idOrSlug)
	} else {
		query = query.Where("slug = ?", idOrSlug)
	}

	err := query.First(&product).Error
	if err != nil {
		return nil, err
	}
	return &product, nil
}

func (r *productRepository) FindBySKU(ctx context.Context, sku string) (*models.Product, error) {
	var product models.Product
	err := r.getDB(ctx).Where("sku = ?", sku).First(&product).Error
	if err != nil {
		return nil, err
	}
	return &product, nil
}

func (r *productRepository) Update(ctx context.Context, product *models.Product) error {
	return r.getDB(ctx).Save(product).Error
}

func (r *productRepository) SoftDelete(ctx context.Context, id int64) error {
	return r.getDB(ctx).Delete(&models.Product{}, id).Error
}

func (r *productRepository) List(ctx context.Context, filter dto.ProductFilter) ([]models.Product, int64, error) {
	var products []models.Product
	var total int64

	query := r.getDB(ctx).Model(&models.Product{}).Preload("Category")

	if filter.Status != "" {
		query = query.Where("status = ?", filter.Status)
	}

	if filter.CategoryID != nil && *filter.CategoryID > 0 {
		query = query.Where("category_id = ?", *filter.CategoryID)
	}

	if filter.MinPrice != nil {
		query = query.Where("price >= ?", *filter.MinPrice)
	}

	if filter.MaxPrice != nil {
		query = query.Where("price <= ?", *filter.MaxPrice)
	}

	if filter.InStock != nil && *filter.InStock {
		query = query.Where("stock_quantity > 0")
	}

	if filter.Search != "" {
		searchTerm := "%" + strings.ToLower(filter.Search) + "%"
		query = query.Where("LOWER(name) LIKE ? OR LOWER(description) LIKE ?", searchTerm, searchTerm)
	}

	if err := query.Count(&total).Error; err != nil {
		return nil, 0, err
	}

	// Safe sort order (NFR-5: allow-list)
	var orderClause string
	switch filter.Sort {
	case "price_asc":
		orderClause = "price ASC, id ASC"
	case "price_desc":
		orderClause = "price DESC, id ASC"
	case "name_asc":
		orderClause = "name ASC, id ASC"
	default:
		orderClause = "created_at DESC, id DESC"
	}

	limit := filter.Limit
	if limit <= 0 {
		limit = 20
	}
	page := filter.Page
	if page <= 0 {
		page = 1
	}
	offset := (page - 1) * limit

	err := query.Order(orderClause).Offset(offset).Limit(limit).Find(&products).Error
	if err != nil {
		return nil, 0, err
	}

	return products, total, nil
}

func (r *productRepository) ListLowStock(ctx context.Context, threshold int, page, limit int) ([]models.Product, int64, error) {
	var products []models.Product
	var total int64

	query := r.getDB(ctx).Model(&models.Product{}).
		Preload("Category").
		Where("stock_quantity <= ? AND status = ?", threshold, models.ProductStatusActive)

	if err := query.Count(&total).Error; err != nil {
		return nil, 0, err
	}

	offset := (page - 1) * limit
	err := query.Order("stock_quantity ASC, id ASC").Offset(offset).Limit(limit).Find(&products).Error
	if err != nil {
		return nil, 0, err
	}

	return products, total, nil
}

func (r *productRepository) CountLowStock(ctx context.Context, threshold int) (int64, error) {
	var count int64
	err := r.getDB(ctx).Model(&models.Product{}).
		Where("stock_quantity <= ? AND status = ?", threshold, models.ProductStatusActive).
		Count(&count).Error
	return count, err
}

// DecrementStock performs the conditional atomic update from Section 5.2 of the PRD:
// UPDATE products SET stock_quantity = stock_quantity - $qty WHERE id = $id AND stock_quantity >= $qty;
func (r *productRepository) DecrementStock(ctx context.Context, productID int64, quantity int) (bool, error) {
	res := r.getDB(ctx).Exec(
		"UPDATE products SET stock_quantity = stock_quantity - ?, updated_at = now() WHERE id = ? AND stock_quantity >= ?",
		quantity, productID, quantity,
	)
	if res.Error != nil {
		return false, res.Error
	}
	return res.RowsAffected > 0, nil
}

func (r *productRepository) IncrementStock(ctx context.Context, productID int64, quantity int) error {
	res := r.getDB(ctx).Exec(
		"UPDATE products SET stock_quantity = stock_quantity + ?, updated_at = now() WHERE id = ?",
		quantity, productID,
	)
	if res.Error != nil {
		return res.Error
	}
	if res.RowsAffected == 0 {
		return fmt.Errorf("product not found for stock increment: %d", productID)
	}
	return nil
}
