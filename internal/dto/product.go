package dto

import "time"

type CreateProductRequest struct {
	CategoryID    int64   `json:"category_id" binding:"required,gt=0"`
	Name          string  `json:"name" binding:"required,min=2,max=200"`
	Description   *string `json:"description" binding:"omitempty,max=5000"`
	SKU           string  `json:"sku" binding:"required,min=2,max=64"`
	Price         int64   `json:"price" binding:"required,gt=0"`
	StockQuantity int     `json:"stock_quantity" binding:"gte=0"`
	ImageURL      *string `json:"image_url" binding:"omitempty,url,max=500"`
	Status        string  `json:"status" binding:"omitempty,oneof=DRAFT ACTIVE ARCHIVED"`
}

type UpdateProductRequest struct {
	CategoryID    *int64  `json:"category_id" binding:"omitempty,gt=0"`
	Name          *string `json:"name" binding:"omitempty,min=2,max=200"`
	Description   *string `json:"description" binding:"omitempty,max=5000"`
	SKU           *string `json:"sku" binding:"omitempty,min=2,max=64"`
	Price         *int64  `json:"price" binding:"omitempty,gt=0"`
	StockQuantity *int    `json:"stock_quantity" binding:"omitempty,gte=0"`
	ImageURL      *string `json:"image_url" binding:"omitempty,url,max=500"`
	Status        *string `json:"status" binding:"omitempty,oneof=DRAFT ACTIVE ARCHIVED"`
}

type AdjustStockRequest struct {
	Adjustment int    `json:"adjustment" binding:"required,ne=0"`
	Reason     string `json:"reason" binding:"required,oneof=RESTOCK ADJUSTMENT"`
}

type ProductFilter struct {
	Search     string
	CategoryID *int64
	MinPrice   *int64
	MaxPrice   *int64
	InStock    *bool
	Status     string
	Sort       string
	Page       int
	Limit      int
}

type ProductResponse struct {
	ID            int64             `json:"id"`
	CategoryID    int64             `json:"category_id"`
	Name          string            `json:"name"`
	Slug          string            `json:"slug"`
	Description   *string           `json:"description,omitempty"`
	SKU           string            `json:"sku"`
	Price         int64             `json:"price"`
	Currency      string            `json:"currency"`
	StockQuantity int               `json:"stock_quantity"`
	ImageURL      *string           `json:"image_url,omitempty"`
	Status        string            `json:"status"`
	CreatedAt     time.Time         `json:"created_at"`
	Category      *CategoryResponse `json:"category,omitempty"`
}
