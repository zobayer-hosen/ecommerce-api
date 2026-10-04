package repository

import (
	"context"

	"ecommerce-api/internal/database"
	"ecommerce-api/internal/models"

	"gorm.io/gorm"
)

type StockMovementRepository interface {
	Create(ctx context.Context, movement *models.StockMovement) error
	ListByProduct(ctx context.Context, productID int64, limit int) ([]models.StockMovement, error)
}

type stockMovementRepository struct {
	db *gorm.DB
}

func NewStockMovementRepository(db *gorm.DB) StockMovementRepository {
	return &stockMovementRepository{db: db}
}

func (r *stockMovementRepository) getDB(ctx context.Context) *gorm.DB {
	return database.GetDB(ctx, r.db)
}

func (r *stockMovementRepository) Create(ctx context.Context, movement *models.StockMovement) error {
	return r.getDB(ctx).Create(movement).Error
}

func (r *stockMovementRepository) ListByProduct(ctx context.Context, productID int64, limit int) ([]models.StockMovement, error) {
	var movements []models.StockMovement
	if limit <= 0 {
		limit = 50
	}
	err := r.getDB(ctx).
		Where("product_id = ?", productID).
		Order("created_at DESC").
		Limit(limit).
		Find(&movements).Error
	if err != nil {
		return nil, err
	}
	return movements, nil
}
