export interface TopProduct {
  product_id: number;
  name: string;
  sku: string;
  units_sold: number;
  total_sales: number;
}

export interface DashboardStats {
  total_revenue: number;
  orders_by_status: Record<string, number>;
  orders_today: number;
  orders_last_30_days: number;
  top_products: TopProduct[];
  low_stock_count: number;
}
