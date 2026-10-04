package handler

import (
	"ecommerce-api/internal/pkg/response"
	"ecommerce-api/internal/service"

	"github.com/gin-gonic/gin"
)

type DashboardHandler struct {
	dashboardService service.DashboardService
}

func NewDashboardHandler(dashboardService service.DashboardService) *DashboardHandler {
	return &DashboardHandler{dashboardService: dashboardService}
}

func (h *DashboardHandler) GetDashboard(c *gin.Context) {
	stats, err := h.dashboardService.GetDashboardStats(c.Request.Context())
	if err != nil {
		HandleError(c, err)
		return
	}

	response.Success(c, "Dashboard stats retrieved successfully", stats)
}
