package dto

type AddToCartRequest struct {
	ProductID int64 `json:"product_id" binding:"required,gt=0"`
	Quantity  int   `json:"quantity" binding:"required,gt=0"`
}

type UpdateCartItemRequest struct {
	Quantity int `json:"quantity" binding:"required,gt=0"`
}

type CartItemResponse struct {
	ID          int64   `json:"id"`
	ProductID   int64   `json:"product_id"`
	ProductName string  `json:"product_name"`
	SKU         string  `json:"sku"`
	Price       int64   `json:"price"`
	Quantity    int     `json:"quantity"`
	LineTotal   int64   `json:"line_total"`
	ImageURL    *string `json:"image_url,omitempty"`
}

type CartResponse struct {
	ID            int64              `json:"id"`
	UserID        int64              `json:"user_id"`
	Items         []CartItemResponse `json:"items"`
	ItemCount     int                `json:"item_count"`
	TotalQuantity int                `json:"total_quantity"`
	Subtotal      int64              `json:"subtotal"`
	Currency      string             `json:"currency"`
}
