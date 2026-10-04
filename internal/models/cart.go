package models

import (
	"time"
)

type Cart struct {
	ID        int64      `gorm:"primaryKey;autoIncrement" json:"id"`
	UserID    int64      `gorm:"not null;uniqueIndex" json:"user_id"`
	CreatedAt time.Time  `gorm:"not null;default:now()" json:"created_at"`
	UpdatedAt time.Time  `gorm:"not null;default:now()" json:"updated_at"`
	Items     []CartItem `gorm:"foreignKey:CartID" json:"items,omitempty"`
}

func (Cart) TableName() string {
	return "carts"
}

type CartItem struct {
	ID        int64     `gorm:"primaryKey;autoIncrement" json:"id"`
	CartID    int64     `gorm:"not null;uniqueIndex:idx_cart_product" json:"cart_id"`
	ProductID int64     `gorm:"not null;uniqueIndex:idx_cart_product" json:"product_id"`
	Quantity  int       `gorm:"not null;check:quantity > 0" json:"quantity"`
	CreatedAt time.Time `gorm:"not null;default:now()" json:"created_at"`
	UpdatedAt time.Time `gorm:"not null;default:now()" json:"updated_at"`

	Cart    *Cart    `gorm:"foreignKey:CartID;constraint:OnDelete:CASCADE" json:"cart,omitempty"`
	Product *Product `gorm:"foreignKey:ProductID;constraint:OnDelete:CASCADE" json:"product,omitempty"`
}

func (CartItem) TableName() string {
	return "cart_items"
}
