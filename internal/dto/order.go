package dto

import "time"

type ShippingAddressDTO struct {
	FullName   string `json:"full_name" binding:"required,min=2,max=100"`
	Phone      string `json:"phone" binding:"required,min=5,max=20"`
	Line1      string `json:"line1" binding:"required,min=3,max=200"`
	City       string `json:"city" binding:"required,min=2,max=100"`
	PostalCode string `json:"postal_code" binding:"required,min=2,max=20"`
	Country    string `json:"country" binding:"required,min=2,max=10"`
}

type CheckoutRequest struct {
	ShippingAddress ShippingAddressDTO `json:"shipping_address" binding:"required"`
	Note            *string            `json:"note" binding:"omitempty,max=500"`
}

type ChangeOrderStatusRequest struct {
	Status string  `json:"status" binding:"required,oneof=CONFIRMED PROCESSING SHIPPED DELIVERED CANCELLED"`
	Note   *string `json:"note" binding:"omitempty,max=500"`
}

type OrderItemResponse struct {
	ID          int64  `json:"id"`
	ProductID   int64  `json:"product_id"`
	ProductName string `json:"product_name"`
	SKU         string `json:"sku"`
	UnitPrice   int64  `json:"unit_price"`
	Quantity    int    `json:"quantity"`
	LineTotal   int64  `json:"line_total"`
}

type OrderStatusHistoryResponse struct {
	ID         int64     `json:"id"`
	FromStatus *string   `json:"from_status,omitempty"`
	ToStatus   string    `json:"to_status"`
	ChangedBy  *int64    `json:"changed_by,omitempty"`
	Note       *string   `json:"note,omitempty"`
	CreatedAt  time.Time `json:"created_at"`
}

type OrderResponse struct {
	ID              int64                        `json:"id"`
	OrderNumber     string                       `json:"order_number"`
	UserID          int64                        `json:"user_id"`
	Status          string                       `json:"status"`
	Subtotal        int64                        `json:"subtotal"`
	ShippingFee     int64                        `json:"shipping_fee"`
	TotalAmount     int64                        `json:"total_amount"`
	Currency        string                       `json:"currency"`
	ShippingAddress ShippingAddressDTO           `json:"shipping_address"`
	Note            *string                      `json:"note,omitempty"`
	PlacedAt        time.Time                    `json:"placed_at"`
	CreatedAt       time.Time                    `json:"created_at"`
	Items           []OrderItemResponse          `json:"items,omitempty"`
	StatusHistory   []OrderStatusHistoryResponse `json:"status_history,omitempty"`
}

type OrderFilter struct {
	UserID    *int64
	Status    string
	StartDate *time.Time
	EndDate   *time.Time
	Page      int
	Limit     int
}
