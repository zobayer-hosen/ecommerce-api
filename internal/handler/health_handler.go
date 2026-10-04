package handler

import (
	"ecommerce-api/internal/database"
	"ecommerce-api/internal/pkg/apperror"
	"ecommerce-api/internal/pkg/response"

	"github.com/gin-gonic/gin"
)

type HealthHandler struct {
	db *database.DB
}

func NewHealthHandler(db *database.DB) *HealthHandler {
	return &HealthHandler{db: db}
}

func (h *HealthHandler) HealthCheck(c *gin.Context) {
	if err := h.db.SQL.Ping(); err != nil {
		HandleError(c, apperror.New(503, "SERVICE_UNAVAILABLE", "Database connection unhealthy"))
		return
	}

	response.Success(c, "Service is healthy", gin.H{
		"status":   "UP",
		"database": "connected",
	})
}
