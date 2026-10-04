package repository

import (
	"context"

	"ecommerce-api/internal/database"
	"ecommerce-api/internal/models"

	"gorm.io/gorm"
	"gorm.io/gorm/clause"
)

type CartRepository interface {
	FindOrCreateByUserID(ctx context.Context, userID int64) (*models.Cart, error)
	FindWithItems(ctx context.Context, userID int64) (*models.Cart, error)
	FindItemByID(ctx context.Context, cartID, itemID int64) (*models.CartItem, error)
	FindItemByProduct(ctx context.Context, cartID, productID int64) (*models.CartItem, error)
	AddItem(ctx context.Context, item *models.CartItem) error
	UpdateItem(ctx context.Context, item *models.CartItem) error
	RemoveItem(ctx context.Context, cartID, itemID int64) error
	ClearCart(ctx context.Context, cartID int64) error
}

type cartRepository struct {
	db *gorm.DB
}

func NewCartRepository(db *gorm.DB) CartRepository {
	return &cartRepository{db: db}
}

func (r *cartRepository) getDB(ctx context.Context) *gorm.DB {
	return database.GetDB(ctx, r.db)
}

func (r *cartRepository) FindOrCreateByUserID(ctx context.Context, userID int64) (*models.Cart, error) {
	var cart models.Cart
	err := r.getDB(ctx).Where("user_id = ?", userID).First(&cart).Error
	if err == nil {
		return &cart, nil
	}
	if err != gorm.ErrRecordNotFound {
		return nil, err
	}

	cart = models.Cart{UserID: userID}
	err = r.getDB(ctx).Clauses(clause.OnConflict{
		Columns:   []clause.Column{{Name: "user_id"}},
		DoNothing: true,
	}).Create(&cart).Error
	if err != nil {
		return nil, err
	}

	// Refetch to ensure we have the ID in case of concurrent insert
	err = r.getDB(ctx).Where("user_id = ?", userID).First(&cart).Error
	if err != nil {
		return nil, err
	}

	return &cart, nil
}

func (r *cartRepository) FindWithItems(ctx context.Context, userID int64) (*models.Cart, error) {
	cart, err := r.FindOrCreateByUserID(ctx, userID)
	if err != nil {
		return nil, err
	}

	var items []models.CartItem
	err = r.getDB(ctx).
		Where("cart_id = ?", cart.ID).
		Preload("Product", func(db *gorm.DB) *gorm.DB {
			return db.Unscoped()
		}).
		Order("id ASC").
		Find(&items).Error
	if err != nil {
		return nil, err
	}

	cart.Items = items
	return cart, nil
}

func (r *cartRepository) FindItemByID(ctx context.Context, cartID, itemID int64) (*models.CartItem, error) {
	var item models.CartItem
	err := r.getDB(ctx).
		Where("cart_id = ? AND id = ?", cartID, itemID).
		Preload("Product").
		First(&item).Error
	if err != nil {
		return nil, err
	}
	return &item, nil
}

func (r *cartRepository) FindItemByProduct(ctx context.Context, cartID, productID int64) (*models.CartItem, error) {
	var item models.CartItem
	err := r.getDB(ctx).
		Where("cart_id = ? AND product_id = ?", cartID, productID).
		First(&item).Error
	if err != nil {
		return nil, err
	}
	return &item, nil
}

func (r *cartRepository) AddItem(ctx context.Context, item *models.CartItem) error {
	return r.getDB(ctx).Create(item).Error
}

func (r *cartRepository) UpdateItem(ctx context.Context, item *models.CartItem) error {
	return r.getDB(ctx).Save(item).Error
}

func (r *cartRepository) RemoveItem(ctx context.Context, cartID, itemID int64) error {
	return r.getDB(ctx).Where("cart_id = ? AND id = ?", cartID, itemID).Delete(&models.CartItem{}).Error
}

func (r *cartRepository) ClearCart(ctx context.Context, cartID int64) error {
	return r.getDB(ctx).Where("cart_id = ?", cartID).Delete(&models.CartItem{}).Error
}
