package repository

import (
	"context"

	"ecommerce-api/internal/database"
	"ecommerce-api/internal/dto"
	"ecommerce-api/internal/models"

	"gorm.io/gorm"
)

type OrderRepository interface {
	Create(ctx context.Context, order *models.Order) error
	CreateItems(ctx context.Context, items []models.OrderItem) error
	CreateStatusHistory(ctx context.Context, history *models.OrderStatusHistory) error
	FindByID(ctx context.Context, id int64) (*models.Order, error)
	FindByOrderNumber(ctx context.Context, orderNumber string) (*models.Order, error)
	FindByIdempotencyKey(ctx context.Context, userID int64, key string) (*models.Order, error)
	List(ctx context.Context, filter dto.OrderFilter) ([]models.Order, int64, error)
	UpdateStatus(ctx context.Context, orderID int64, status string) error
}

type orderRepository struct {
	db *gorm.DB
}

func NewOrderRepository(db *gorm.DB) OrderRepository {
	return &orderRepository{db: db}
}

func (r *orderRepository) getDB(ctx context.Context) *gorm.DB {
	return database.GetDB(ctx, r.db)
}

func (r *orderRepository) Create(ctx context.Context, order *models.Order) error {
	return r.getDB(ctx).Create(order).Error
}

func (r *orderRepository) CreateItems(ctx context.Context, items []models.OrderItem) error {
	return r.getDB(ctx).Create(&items).Error
}

func (r *orderRepository) CreateStatusHistory(ctx context.Context, history *models.OrderStatusHistory) error {
	return r.getDB(ctx).Create(history).Error
}

func (r *orderRepository) FindByID(ctx context.Context, id int64) (*models.Order, error) {
	var order models.Order
	err := r.getDB(ctx).
		Preload("Items").
		Preload("StatusHistory", func(db *gorm.DB) *gorm.DB {
			return db.Order("created_at ASC")
		}).
		Preload("User").
		First(&order, id).Error
	if err != nil {
		return nil, err
	}
	return &order, nil
}

func (r *orderRepository) FindByOrderNumber(ctx context.Context, orderNumber string) (*models.Order, error) {
	var order models.Order
	err := r.getDB(ctx).
		Preload("Items").
		Preload("StatusHistory", func(db *gorm.DB) *gorm.DB {
			return db.Order("created_at ASC")
		}).
		Preload("User").
		Where("order_number = ?", orderNumber).
		First(&order).Error
	if err != nil {
		return nil, err
	}
	return &order, nil
}

func (r *orderRepository) FindByIdempotencyKey(ctx context.Context, userID int64, key string) (*models.Order, error) {
	var order models.Order
	err := r.getDB(ctx).
		Preload("Items").
		Preload("StatusHistory", func(db *gorm.DB) *gorm.DB {
			return db.Order("created_at ASC")
		}).
		Where("user_id = ? AND idempotency_key = ?", userID, key).
		First(&order).Error
	if err != nil {
		return nil, err
	}
	return &order, nil
}

func (r *orderRepository) List(ctx context.Context, filter dto.OrderFilter) ([]models.Order, int64, error) {
	var orders []models.Order
	var total int64

	query := r.getDB(ctx).Model(&models.Order{}).
		Preload("Items").
		Preload("User")

	if filter.UserID != nil {
		query = query.Where("user_id = ?", *filter.UserID)
	}

	if filter.Status != "" {
		query = query.Where("status = ?", filter.Status)
	}

	if filter.StartDate != nil {
		query = query.Where("created_at >= ?", *filter.StartDate)
	}

	if filter.EndDate != nil {
		query = query.Where("created_at <= ?", *filter.EndDate)
	}

	if err := query.Count(&total).Error; err != nil {
		return nil, 0, err
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

	err := query.Order("created_at DESC, id DESC").Offset(offset).Limit(limit).Find(&orders).Error
	if err != nil {
		return nil, 0, err
	}

	return orders, total, nil
}

func (r *orderRepository) UpdateStatus(ctx context.Context, orderID int64, status string) error {
	return r.getDB(ctx).Model(&models.Order{}).
		Where("id = ?", orderID).
		Updates(map[string]interface{}{
			"status":     status,
			"updated_at": gorm.Expr("now()"),
		}).Error
}
