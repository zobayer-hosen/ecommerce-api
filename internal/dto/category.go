package dto

import "time"

type CreateCategoryRequest struct {
	Name        string  `json:"name" binding:"required,min=2,max=100"`
	Description *string `json:"description" binding:"omitempty,max=1000"`
}

type UpdateCategoryRequest struct {
	Name        *string `json:"name" binding:"omitempty,min=2,max=100"`
	Description *string `json:"description" binding:"omitempty,max=1000"`
}

type CategoryResponse struct {
	ID           int64     `json:"id"`
	Name         string    `json:"name"`
	Slug         string    `json:"slug"`
	Description  *string   `json:"description,omitempty"`
	ProductCount int64     `json:"product_count"`
	CreatedAt    time.Time `json:"created_at"`
}
