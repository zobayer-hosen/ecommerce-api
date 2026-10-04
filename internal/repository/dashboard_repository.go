package repository

import (
	"context"
	"time"

	"ecommerce-api/internal/database"
	"ecommerce-api/internal/dto"
	"ecommerce-api/internal/models"

	"gorm.io/gorm"
)

type DashboardRepository interface {
	GetStats(ctx context.Context, lowStockThreshold int) (*dto.DashboardStatsResponse, error)
}

type dashboardRepository struct {
	db *gorm.DB
}

func NewDashboardRepository(db *gorm.DB) DashboardRepository {
	return &dashboardRepository{db: db}
}

func (r *dashboardRepository) getDB(ctx context.Context) *gorm.DB {
	return database.GetDB(ctx, r.db)
}

func (r *dashboardRepository) GetStats(ctx context.Context, lowStockThreshold int) (*dto.DashboardStatsResponse, error) {
	db := r.getDB(ctx)

	// 1. Total revenue (all orders except CANCELLED)
	var totalRevenue int64
	err := db.Model(&models.Order{}).
		Where("status <> ?", models.OrderStatusCancelled).
		Select("COALESCE(SUM(total_amount), 0)").
		Scan(&totalRevenue).Error
	if err != nil {
		return nil, err
	}

	// 2. Orders by status
	type statusCount struct {
		Status string
		Count  int64
	}
	var statusCounts []statusCount
	err = db.Model(&models.Order{}).
		Select("status, COUNT(*) as count").
		Group("status").
		Scan(&statusCounts).Error
	if err != nil {
		return nil, err
	}

	ordersByStatus := make(map[string]int64)
	for _, sc := range statusCounts {
		ordersByStatus[sc.Status] = sc.Count
	}

	// 3. Orders today
	now := time.Now()
	startOfToday := time.Date(now.Year(), now.Month(), now.Day(), 0, 0, 0, 0, now.Location())
	var ordersToday int64
	err = db.Model(&models.Order{}).
		Where("created_at >= ?", startOfToday).
		Count(&ordersToday).Error
	if err != nil {
		return nil, err
	}

	// 4. Orders last 30 days
	thirtyDaysAgo := now.AddDate(0, 0, -30)
	var ordersLast30Days int64
	err = db.Model(&models.Order{}).
		Where("created_at >= ?", thirtyDaysAgo).
		Count(&ordersLast30Days).Error
	if err != nil {
		return nil, err
	}

	// 5. Top 5 products by units sold (from non-cancelled orders)
	var topProducts []dto.TopProductDTO
	err = db.Table("order_items").
		Select("order_items.product_id, order_items.product_name as name, order_items.sku, SUM(order_items.quantity) as units_sold, SUM(order_items.line_total) as total_sales").
		Joins("JOIN orders ON orders.id = order_items.order_id").
		Where("orders.status <> ?", models.OrderStatusCancelled).
		Group("order_items.product_id, order_items.product_name, order_items.sku").
		Order("units_sold DESC").
		Limit(5).
		Scan(&topProducts).Error
	if err != nil {
		return nil, err
	}

	if topProducts == nil {
		topProducts = []dto.TopProductDTO{}
	}

	// 6. Low stock count
	var lowStockCount int64
	err = db.Model(&models.Product{}).
		Where("stock_quantity <= ? AND status = ? AND deleted_at IS NULL", lowStockThreshold, models.ProductStatusActive).
		Count(&lowStockCount).Error
	if err != nil {
		return nil, err
	}

	return &dto.DashboardStatsResponse{
		TotalRevenue:     totalRevenue,
		OrdersByStatus:   ordersByStatus,
		OrdersToday:      ordersToday,
		OrdersLast30Days: ordersLast30Days,
		TopProducts:      topProducts,
		LowStockCount:    lowStockCount,
	}, nil
}
