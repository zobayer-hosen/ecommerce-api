package handler

import (
	"errors"
	"fmt"
	"net/http"
	"strconv"
	"strings"

	"ecommerce-api/internal/middleware"
	"ecommerce-api/internal/pkg/apperror"
	"ecommerce-api/internal/pkg/response"

	"github.com/gin-gonic/gin"
	"github.com/go-playground/validator/v10"
)

// BindJSON binds JSON payload and handles validation errors according to Section 7 of PRD
func BindJSON(c *gin.Context, obj any) bool {
	if err := c.ShouldBindJSON(obj); err != nil {
		var ve validator.ValidationErrors
		if errors.As(err, &ve) {
			fieldErrors := make([]apperror.FieldError, len(ve))
			for i, fe := range ve {
				fieldErrors[i] = apperror.FieldError{
					Field:   toSnakeCase(fe.Field()),
					Message: formatValidationTag(fe),
				}
			}
			response.Error(c, apperror.NewWithDetails(
				http.StatusUnprocessableEntity,
				"VALIDATION_ERROR",
				"Validation failed",
				fieldErrors,
			))
			return false
		}

		response.Error(c, apperror.New(http.StatusBadRequest, "BAD_REQUEST", "Malformed JSON body"))
		return false
	}
	return true
}

func HandleError(c *gin.Context, err error) {
	if err == nil {
		return
	}

	if appErr, ok := err.(*apperror.AppError); ok {
		response.Error(c, appErr)
		return
	}

	response.Error(c, apperror.ErrInternal)
}

func GetUserID(c *gin.Context) (int64, bool) {
	val, exists := c.Get(middleware.ContextUserID)
	if !exists {
		return 0, false
	}
	id, ok := val.(int64)
	return id, ok
}

func GetRole(c *gin.Context) string {
	val, exists := c.Get(middleware.ContextRole)
	if !exists {
		return ""
	}
	role, _ := val.(string)
	return role
}

func IsAdmin(c *gin.Context) bool {
	return GetRole(c) == "ADMIN"
}

func ParseInt64Param(c *gin.Context, paramName string) (int64, bool) {
	str := c.Param(paramName)
	val, err := strconv.ParseInt(str, 10, 64)
	if err != nil {
		response.Error(c, apperror.New(http.StatusBadRequest, "BAD_REQUEST", fmt.Sprintf("Invalid path parameter: %s", paramName)))
		return 0, false
	}
	return val, true
}

func formatValidationTag(fe validator.FieldError) string {
	switch fe.Tag() {
	case "required":
		return "is required"
	case "email":
		return "must be a valid email address"
	case "min":
		return fmt.Sprintf("must be at least %s characters or value", fe.Param())
	case "max":
		return fmt.Sprintf("cannot exceed %s characters or value", fe.Param())
	case "gt":
		return fmt.Sprintf("must be greater than %s", fe.Param())
	case "gte":
		return fmt.Sprintf("must be greater than or equal to %s", fe.Param())
	case "oneof":
		return fmt.Sprintf("must be one of: %s", fe.Param())
	case "url":
		return "must be a valid URL"
	default:
		return fmt.Sprintf("failed validation on '%s'", fe.Tag())
	}
}

func toSnakeCase(str string) string {
	var b strings.Builder
	for i, r := range str {
		if i > 0 && r >= 'A' && r <= 'Z' {
			b.WriteRune('_')
		}
		b.WriteRune(r)
	}
	return strings.ToLower(b.String())
}
