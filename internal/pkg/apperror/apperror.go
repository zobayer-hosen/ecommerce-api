package apperror

import (
	"fmt"
	"net/http"
)

type FieldError struct {
	Field   string `json:"field"`
	Message string `json:"message"`
}

type AppError struct {
	HTTPStatus int          `json:"-"`
	Code       string       `json:"code"`
	Message    string       `json:"message"`
	Details    []FieldError `json:"details,omitempty"`
}

func (e *AppError) Error() string {
	return fmt.Sprintf("[%s] %s", e.Code, e.Message)
}

func New(httpStatus int, code, message string) *AppError {
	return &AppError{
		HTTPStatus: httpStatus,
		Code:       code,
		Message:    message,
	}
}

func NewWithDetails(httpStatus int, code, message string, details []FieldError) *AppError {
	return &AppError{
		HTTPStatus: httpStatus,
		Code:       code,
		Message:    message,
		Details:    details,
	}
}

// Predefined errors matching the PRD specification
var (
	ErrBadRequest            = New(http.StatusBadRequest, "BAD_REQUEST", "Invalid request payload or parameters")
	ErrUnauthorized          = New(http.StatusUnauthorized, "UNAUTHORIZED", "Authentication required")
	ErrTokenExpired          = New(http.StatusUnauthorized, "TOKEN_EXPIRED", "Token has expired")
	ErrInvalidCredentials    = New(http.StatusUnauthorized, "INVALID_CREDENTIALS", "Invalid email or password")
	ErrForbidden             = New(http.StatusForbidden, "FORBIDDEN", "You do not have permission to perform this action")
	ErrUserInactive          = New(http.StatusForbidden, "USER_INACTIVE", "Your account is deactivated")
	ErrNotFound              = New(http.StatusNotFound, "NOT_FOUND", "Resource not found")
	ErrUserNotFound          = New(http.StatusNotFound, "USER_NOT_FOUND", "User not found")
	ErrProductNotFound       = New(http.StatusNotFound, "PRODUCT_NOT_FOUND", "Product not found")
	ErrCategoryNotFound      = New(http.StatusNotFound, "CATEGORY_NOT_FOUND", "Category not found")
	ErrOrderNotFound         = New(http.StatusNotFound, "ORDER_NOT_FOUND", "Order not found")
	ErrEmailAlreadyExists    = New(http.StatusConflict, "EMAIL_ALREADY_EXISTS", "Email is already registered")
	ErrSKUAlreadyExists      = New(http.StatusConflict, "SKU_ALREADY_EXISTS", "Product SKU already exists")
	ErrCategoryHasProducts   = New(http.StatusConflict, "CATEGORY_HAS_PRODUCTS", "Cannot delete category with associated products")
	ErrInvalidStatusTransition = New(http.StatusConflict, "INVALID_STATUS_TRANSITION", "Invalid order status transition")
	ErrInsufficientStock     = New(http.StatusConflict, "INSUFFICIENT_STOCK", "Insufficient stock for product")
	ErrValidationError       = New(http.StatusUnprocessableEntity, "VALIDATION_ERROR", "Validation failed")
	ErrCartEmpty             = New(http.StatusUnprocessableEntity, "CART_EMPTY", "Cannot checkout with an empty cart")
	ErrProductUnavailable    = New(http.StatusUnprocessableEntity, "PRODUCT_UNAVAILABLE", "One or more products are unavailable or inactive")
	ErrCartInsufficientStock = New(http.StatusUnprocessableEntity, "INSUFFICIENT_STOCK", "Requested quantity exceeds available stock")
	ErrInternal              = New(http.StatusInternalServerError, "INTERNAL_ERROR", "An unexpected internal error occurred")
)
