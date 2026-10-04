package response

import (
	"net/http"

	"ecommerce-api/internal/pkg/apperror"

	"github.com/gin-gonic/gin"
)

type Meta struct {
	Page       int   `json:"page"`
	Limit      int   `json:"limit"`
	Total      int64 `json:"total"`
	TotalPages int   `json:"total_pages"`
}

type SuccessResponse struct {
	Success bool   `json:"success"`
	Message string `json:"message"`
	Data    any    `json:"data"`
}

type ListResponse struct {
	Success bool   `json:"success"`
	Message string `json:"message"`
	Data    any    `json:"data"`
	Meta    Meta   `json:"meta"`
}

type ErrorDetail struct {
	Code    string                `json:"code"`
	Details []apperror.FieldError `json:"details,omitempty"`
}

type ErrorResponse struct {
	Success   bool        `json:"success"`
	Message   string      `json:"message"`
	Error     ErrorDetail `json:"error"`
	RequestID string      `json:"request_id,omitempty"`
}

func JSON(c *gin.Context, status int, message string, data any) {
	c.JSON(status, SuccessResponse{
		Success: true,
		Message: message,
		Data:    data,
	})
}

func Success(c *gin.Context, message string, data any) {
	JSON(c, http.StatusOK, message, data)
}

func Created(c *gin.Context, message string, data any) {
	JSON(c, http.StatusCreated, message, data)
}

func NoContent(c *gin.Context) {
	c.Status(http.StatusNoContent)
}

func List(c *gin.Context, message string, data any, meta Meta) {
	c.JSON(http.StatusOK, ListResponse{
		Success: true,
		Message: message,
		Data:    data,
		Meta:    meta,
	})
}

func Error(c *gin.Context, err *apperror.AppError) {
	reqID, _ := c.Get("request_id")
	requestIDStr, _ := reqID.(string)

	c.JSON(err.HTTPStatus, ErrorResponse{
		Success: false,
		Message: err.Message,
		Error: ErrorDetail{
			Code:    err.Code,
			Details: err.Details,
		},
		RequestID: requestIDStr,
	})
}
