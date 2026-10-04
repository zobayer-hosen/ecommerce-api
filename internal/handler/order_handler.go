package handler

import (
	"strconv"
	"time"

	"ecommerce-api/internal/dto"
	"ecommerce-api/internal/pkg/apperror"
	"ecommerce-api/internal/pkg/pagination"
	"ecommerce-api/internal/pkg/response"
	"ecommerce-api/internal/service"

	"github.com/gin-gonic/gin"
)

type OrderHandler struct {
	orderService service.OrderService
}

func NewOrderHandler(orderService service.OrderService) *OrderHandler {
	return &OrderHandler{orderService: orderService}
}

func (h *OrderHandler) Checkout(c *gin.Context) {
	userID, ok := GetUserID(c)
	if !ok {
		HandleError(c, apperror.ErrUnauthorized)
		return
	}

	var req dto.CheckoutRequest
	if !BindJSON(c, &req) {
		return
	}

	idempotencyKey := c.GetHeader("Idempotency-Key")

	order, err := h.orderService.Checkout(c.Request.Context(), userID, idempotencyKey, req)
	if err != nil {
		HandleError(c, err)
		return
	}

	response.Created(c, "Order placed successfully", order)
}

func (h *OrderHandler) ListMyOrders(c *gin.Context) {
	userID, ok := GetUserID(c)
	if !ok {
		HandleError(c, apperror.ErrUnauthorized)
		return
	}

	params := pagination.FromContext(c)
	status := c.Query("status")

	orders, total, err := h.orderService.ListMyOrders(c.Request.Context(), userID, params.Page, params.Limit, status)
	if err != nil {
		HandleError(c, err)
		return
	}

	meta := pagination.BuildMeta(params, total)
	response.List(c, "Orders retrieved successfully", orders, meta)
}

func (h *OrderHandler) GetMyOrderDetail(c *gin.Context) {
	userID, ok := GetUserID(c)
	if !ok {
		HandleError(c, apperror.ErrUnauthorized)
		return
	}

	orderID, ok := ParseInt64Param(c, "id")
	if !ok {
		return
	}

	order, err := h.orderService.GetMyOrderDetail(c.Request.Context(), userID, orderID)
	if err != nil {
		HandleError(c, err)
		return
	}

	response.Success(c, "Order retrieved successfully", order)
}

func (h *OrderHandler) CancelMyOrder(c *gin.Context) {
	userID, ok := GetUserID(c)
	if !ok {
		HandleError(c, apperror.ErrUnauthorized)
		return
	}

	orderID, ok := ParseInt64Param(c, "id")
	if !ok {
		return
	}

	order, err := h.orderService.CancelMyOrder(c.Request.Context(), userID, orderID)
	if err != nil {
		HandleError(c, err)
		return
	}

	response.Success(c, "Order cancelled successfully", order)
}

func (h *OrderHandler) AdminListOrders(c *gin.Context) {
	params := pagination.FromContext(c)

	filter := dto.OrderFilter{
		Status: c.Query("status"),
		Page:   params.Page,
		Limit:  params.Limit,
	}

	if uidStr := c.Query("user_id"); uidStr != "" {
		if uid, err := strconv.ParseInt(uidStr, 10, 64); err == nil {
			filter.UserID = &uid
		}
	}

	if startDateStr := c.Query("start_date"); startDateStr != "" {
		if t, err := time.Parse(time.RFC3339, startDateStr); err == nil {
			filter.StartDate = &t
		}
	}

	if endDateStr := c.Query("end_date"); endDateStr != "" {
		if t, err := time.Parse(time.RFC3339, endDateStr); err == nil {
			filter.EndDate = &t
		}
	}

	orders, total, err := h.orderService.AdminListOrders(c.Request.Context(), filter)
	if err != nil {
		HandleError(c, err)
		return
	}

	meta := pagination.BuildMeta(params, total)
	response.List(c, "Orders retrieved successfully", orders, meta)
}

func (h *OrderHandler) AdminGetOrderDetail(c *gin.Context) {
	orderID, ok := ParseInt64Param(c, "id")
	if !ok {
		return
	}

	order, err := h.orderService.AdminGetOrderDetail(c.Request.Context(), orderID)
	if err != nil {
		HandleError(c, err)
		return
	}

	response.Success(c, "Order retrieved successfully", order)
}

func (h *OrderHandler) AdminUpdateStatus(c *gin.Context) {
	adminID, _ := GetUserID(c)

	orderID, ok := ParseInt64Param(c, "id")
	if !ok {
		return
	}

	var req dto.ChangeOrderStatusRequest
	if !BindJSON(c, &req) {
		return
	}

	order, err := h.orderService.AdminUpdateStatus(c.Request.Context(), adminID, orderID, req)
	if err != nil {
		HandleError(c, err)
		return
	}

	response.Success(c, "Order status updated successfully", order)
}
