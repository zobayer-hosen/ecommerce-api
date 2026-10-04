package models

import (
	"time"
)

const (
	StockReasonOrder      = "ORDER"
	StockReasonCancel     = "CANCEL"
	StockReasonAdjustment = "ADJUSTMENT"
	StockReasonRestock    = "RESTOCK"
)

type StockMovement struct {
	ID        int64     `gorm:"primaryKey;autoIncrement" json:"id"`
	ProductID int64     `gorm:"not null;index:idx_stock_movement_product" json:"product_id"`
	Change    int       `gorm:"not null;check:change <> 0" json:"change"`
	Reason    string    `gorm:"size:20;not null" json:"reason"`
	OrderID   *int64    `gorm:"index" json:"order_id,omitempty"`
	CreatedBy *int64    `json:"created_by,omitempty"`
	CreatedAt time.Time `gorm:"not null;default:now();index:idx_stock_movement_product,sort:desc" json:"created_at"`

	Product *Product `gorm:"foreignKey:ProductID;constraint:OnDelete:RESTRICT" json:"product,omitempty"`
	Order   *Order   `gorm:"foreignKey:OrderID;constraint:OnDelete:SET NULL" json:"order,omitempty"`
	Creator *User    `gorm:"foreignKey:CreatedBy;constraint:OnDelete:SET NULL" json:"creator,omitempty"`
}

func (StockMovement) TableName() string {
	return "stock_movements"
}
