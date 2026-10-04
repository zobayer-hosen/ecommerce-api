package dto

type TopProductDTO struct {
	ProductID  int64  `json:"product_id"`
	Name       string `json:"name"`
	SKU        string `json:"sku"`
	UnitsSold  int64  `json:"units_sold"`
	TotalSales int64  `json:"total_sales"`
}

type DashboardStatsResponse struct {
	TotalRevenue      int64            `json:"total_revenue"`
	OrdersByStatus    map[string]int64 `json:"orders_by_status"`
	OrdersToday       int64            `json:"orders_today"`
	OrdersLast30Days  int64            `json:"orders_last_30_days"`
	TopProducts       []TopProductDTO  `json:"top_products"`
	LowStockCount     int64            `json:"low_stock_count"`
}
