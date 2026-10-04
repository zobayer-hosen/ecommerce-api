package models

import (
	"time"

	"gorm.io/gorm"
)

const (
	RoleCustomer = "CUSTOMER"
	RoleAdmin    = "ADMIN"
)

type User struct {
	ID           int64          `gorm:"primaryKey;autoIncrement" json:"id"`
	Name         string         `gorm:"size:100;not null" json:"name"`
	Email        string         `gorm:"size:255;not null;uniqueIndex" json:"email"`
	PasswordHash string         `gorm:"size:255;not null" json:"-"`
	Phone        *string        `gorm:"size:20" json:"phone,omitempty"`
	Role         string         `gorm:"size:20;not null;default:'CUSTOMER'" json:"role"`
	IsActive     bool           `gorm:"not null;default:true" json:"is_active"`
	CreatedAt    time.Time      `gorm:"not null;default:now()" json:"created_at"`
	UpdatedAt    time.Time      `gorm:"not null;default:now()" json:"updated_at"`
	DeletedAt    gorm.DeletedAt `gorm:"index" json:"-"`
}

func (User) TableName() string {
	return "users"
}
