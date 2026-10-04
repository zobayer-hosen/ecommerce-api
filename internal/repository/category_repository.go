package repository

import (
	"context"

	"ecommerce-api/internal/database"
	"ecommerce-api/internal/models"

	"gorm.io/gorm"
)

type CategoryWithProductCount struct {
	models.Category
	ProductCount int64 `json:"product_count"`
}

type CategoryRepository interface {
	Create(ctx context.Context, category *models.Category) error
	FindByID(ctx context.Context, id int64) (*models.Category, error)
	FindBySlug(ctx context.Context, slug string) (*models.Category, error)
	FindByName(ctx context.Context, name string) (*models.Category, error)
	Update(ctx context.Context, category *models.Category) error
	Delete(ctx context.Context, id int64) error
	ListWithProductCount(ctx context.Context) ([]CategoryWithProductCount, error)
	HasProducts(ctx context.Context, categoryID int64) (bool, error)
}

type categoryRepository struct {
	db *gorm.DB
}

func NewCategoryRepository(db *gorm.DB) CategoryRepository {
	return &categoryRepository{db: db}
}

func (r *categoryRepository) getDB(ctx context.Context) *gorm.DB {
	return database.GetDB(ctx, r.db)
}

func (r *categoryRepository) Create(ctx context.Context, category *models.Category) error {
	return r.getDB(ctx).Create(category).Error
}

func (r *categoryRepository) FindByID(ctx context.Context, id int64) (*models.Category, error) {
	var category models.Category
	err := r.getDB(ctx).First(&category, id).Error
	if err != nil {
		return nil, err
	}
	return &category, nil
}

func (r *categoryRepository) FindBySlug(ctx context.Context, slug string) (*models.Category, error) {
	var category models.Category
	err := r.getDB(ctx).Where("slug = ?", slug).First(&category).Error
	if err != nil {
		return nil, err
	}
	return &category, nil
}

func (r *categoryRepository) FindByName(ctx context.Context, name string) (*models.Category, error) {
	var category models.Category
	err := r.getDB(ctx).Where("name = ?", name).First(&category).Error
	if err != nil {
		return nil, err
	}
	return &category, nil
}

func (r *categoryRepository) Update(ctx context.Context, category *models.Category) error {
	return r.getDB(ctx).Save(category).Error
}

func (r *categoryRepository) Delete(ctx context.Context, id int64) error {
	return r.getDB(ctx).Delete(&models.Category{}, id).Error
}

func (r *categoryRepository) ListWithProductCount(ctx context.Context) ([]CategoryWithProductCount, error) {
	var results []CategoryWithProductCount
	err := r.getDB(ctx).Table("categories").
		Select("categories.*, COUNT(products.id) as product_count").
		Joins("LEFT JOIN products ON products.category_id = categories.id AND products.deleted_at IS NULL").
		Group("categories.id").
		Order("categories.name ASC").
		Scan(&results).Error
	if err != nil {
		return nil, err
	}
	return results, nil
}

func (r *categoryRepository) HasProducts(ctx context.Context, categoryID int64) (bool, error) {
	var count int64
	err := r.getDB(ctx).Model(&models.Product{}).
		Where("category_id = ? AND deleted_at IS NULL", categoryID).
		Count(&count).Error
	if err != nil {
		return false, err
	}
	return count > 0, nil
}
