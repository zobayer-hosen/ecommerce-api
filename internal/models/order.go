package models

import (
	"time"
)

const (
	OrderStatusPending    = "PENDING"
	OrderStatusConfirmed  = "CONFIRMED"
	OrderStatusProcessing = "PROCESSING"
	OrderStatusShipped    = "SHIPPED"
	OrderStatusDelivered  = "DELIVERED"
	OrderStatusCancelled  = "CANCELLED"
)

type Order struct {
	ID              int64     `gorm:"primaryKey;autoIncrement" json:"id"`
	OrderNumber     string    `gorm:"size:30;not null;uniqueIndex" json:"order_number"`
	UserID          int64     `gorm:"not null;index" json:"user_id"`
	Status          string    `gorm:"size:20;not null;default:'PENDING';index" json:"status"`
	Subtotal        int64     `gorm:"not null;check:subtotal >= 0" json:"subtotal"`
	ShippingFee     int64     `gorm:"not null;default:0" json:"shipping_fee"`
	TotalAmount     int64     `gorm:"not null" json:"total_amount"`
	Currency        string    `gorm:"type:char(3);not null;default:'BDT'" json:"currency"`
	ShippingAddress string    `gorm:"type:jsonb;not null" json:"shipping_address"`
	Note            *string   `gorm:"size:500" json:"note,omitempty"`
	IdempotencyKey  *string   `gorm:"size:64;uniqueIndex:idx_user_idempotency" json:"idempotency_key,omitempty"`
	PlacedAt        time.Time `gorm:"not null;default:now()" json:"placed_at"`
	CreatedAt       time.Time `gorm:"not null;default:now()" json:"created_at"`
	UpdatedAt       time.Time `gorm:"not null;default:now()" json:"updated_at"`

	User          *User                `gorm:"foreignKey:UserID;constraint:OnDelete:RESTRICT" json:"user,omitempty"`
	Items         []OrderItem          `gorm:"foreignKey:OrderID" json:"items,omitempty"`
	StatusHistory []OrderStatusHistory `gorm:"foreignKey:OrderID" json:"status_history,omitempty"`
}

func (Order) TableName() string {
	return "orders"
}

type OrderItem struct {
	ID          int64  `gorm:"primaryKey;autoIncrement" json:"id"`
	OrderID     int64  `gorm:"not null;uniqueIndex:idx_order_product" json:"order_id"`
	ProductID   int64  `gorm:"not null;uniqueIndex:idx_order_product;index" json:"product_id"`
	ProductName string `gorm:"size:200;not null" json:"product_name"`
	SKU         string `gorm:"size:64;not null" json:"sku"`
	UnitPrice   int64  `gorm:"not null;check:unit_price > 0" json:"unit_price"`
	Quantity    int    `gorm:"not null;check:quantity > 0" json:"quantity"`
	LineTotal   int64  `gorm:"not null;check:line_total = unit_price * quantity" json:"line_total"`

	Order   *Order   `gorm:"foreignKey:OrderID;constraint:OnDelete:CASCADE" json:"order,omitempty"`
	Product *Product `gorm:"foreignKey:ProductID;constraint:OnDelete:RESTRICT" json:"product,omitempty"`
}

func (OrderItem) TableName() string {
	return "order_items"
}

type OrderStatusHistory struct {
	ID         int64     `gorm:"primaryKey;autoIncrement" json:"id"`
	OrderID    int64     `gorm:"not null;index:idx_order_history" json:"order_id"`
	FromStatus *string   `gorm:"size:20" json:"from_status,omitempty"`
	ToStatus   string    `gorm:"size:20;not null" json:"to_status"`
	ChangedBy  *int64    `gorm:"index" json:"changed_by,omitempty"`
	Note       *string   `gorm:"size:500" json:"note,omitempty"`
	CreatedAt  time.Time `gorm:"not null;default:now();index:idx_order_history" json:"created_at"`

	Order   *Order `gorm:"foreignKey:OrderID;constraint:OnDelete:CASCADE" json:"order,omitempty"`
	Changed *User  `gorm:"foreignKey:ChangedBy;constraint:OnDelete:SET NULL" json:"changed_user,omitempty"`
}

func (OrderStatusHistory) TableName() string {
	return "order_status_history"
}
