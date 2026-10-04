package models

import (
	"time"

	"gorm.io/gorm"
)

const (
	ProductStatusDraft    = "DRAFT"
	ProductStatusActive   = "ACTIVE"
	ProductStatusArchived = "ARCHIVED"
)

type Product struct {
	ID            int64          `gorm:"primaryKey;autoIncrement" json:"id"`
	CategoryID    int64          `gorm:"not null;index" json:"category_id"`
	Name          string         `gorm:"size:200;not null" json:"name"`
	Slug          string         `gorm:"size:220;not null;uniqueIndex" json:"slug"`
	Description   *string        `gorm:"type:text" json:"description,omitempty"`
	SKU           string         `gorm:"size:64;not null;uniqueIndex" json:"sku"`
	Price         int64          `gorm:"not null;check:price > 0" json:"price"`
	StockQuantity int            `gorm:"not null;default:0;check:stock_quantity >= 0" json:"stock_quantity"`
	ImageURL      *string        `gorm:"size:500" json:"image_url,omitempty"`
	Status        string         `gorm:"size:20;not null;default:'DRAFT'" json:"status"`
	CreatedAt     time.Time      `gorm:"not null;default:now()" json:"created_at"`
	UpdatedAt     time.Time      `gorm:"not null;default:now()" json:"updated_at"`
	DeletedAt     gorm.DeletedAt `gorm:"index" json:"-"`

	Category *Category `gorm:"foreignKey:CategoryID;constraint:OnDelete:RESTRICT" json:"category,omitempty"`
}

func (Product) TableName() string {
	return "products"
}
