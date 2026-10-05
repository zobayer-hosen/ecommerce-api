import { Category } from "./category";

export interface Product {
  id: number;
  category_id: number;
  name: string;
  slug: string;
  description?: string;
  sku: string;
  price: number;
  currency: string;
  stock_quantity: number;
  image_url?: string;
  status: "DRAFT" | "ACTIVE" | "ARCHIVED";
  created_at: string;
  category?: Category;
}

export interface ProductFilter {
  search?: string;
  category_id?: number;
  min_price?: number;
  max_price?: number;
  in_stock?: boolean;
  status?: string;
  sort?: string;
  page?: number;
  limit?: number;
}

export interface CreateProductRequest {
  category_id: number;
  name: string;
  description?: string;
  sku: string;
  price: number;
  stock_quantity: number;
  image_url?: string;
  status?: "DRAFT" | "ACTIVE" | "ARCHIVED";
}

export interface UpdateProductRequest {
  category_id?: number;
  name?: string;
  description?: string;
  sku?: string;
  price?: number;
  stock_quantity?: number;
  image_url?: string;
  status?: "DRAFT" | "ACTIVE" | "ARCHIVED";
}

export interface AdjustStockRequest {
  adjustment: number;
  reason: "RESTOCK" | "ADJUSTMENT";
}
