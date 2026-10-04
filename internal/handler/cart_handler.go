package handler

import (
	"ecommerce-api/internal/dto"
	"ecommerce-api/internal/pkg/apperror"
	"ecommerce-api/internal/pkg/response"
	"ecommerce-api/internal/service"

	"github.com/gin-gonic/gin"
)

type CartHandler struct {
	cartService service.CartService
}

func NewCartHandler(cartService service.CartService) *CartHandler {
	return &CartHandler{cartService: cartService}
}

func (h *CartHandler) GetCart(c *gin.Context) {
	userID, ok := GetUserID(c)
	if !ok {
		HandleError(c, apperror.ErrUnauthorized)
		return
	}

	cart, err := h.cartService.GetCart(c.Request.Context(), userID)
	if err != nil {
		HandleError(c, err)
		return
	}

	response.Success(c, "Cart retrieved successfully", cart)
}

func (h *CartHandler) AddItem(c *gin.Context) {
	userID, ok := GetUserID(c)
	if !ok {
		HandleError(c, apperror.ErrUnauthorized)
		return
	}

	var req dto.AddToCartRequest
	if !BindJSON(c, &req) {
		return
	}

	cart, err := h.cartService.AddItem(c.Request.Context(), userID, req)
	if err != nil {
		HandleError(c, err)
		return
	}

	response.Created(c, "Item added to cart", cart)
}

func (h *CartHandler) UpdateItem(c *gin.Context) {
	userID, ok := GetUserID(c)
	if !ok {
		HandleError(c, apperror.ErrUnauthorized)
		return
	}

	itemID, ok := ParseInt64Param(c, "itemId")
	if !ok {
		return
	}

	var req dto.UpdateCartItemRequest
	if !BindJSON(c, &req) {
		return
	}

	cart, err := h.cartService.UpdateItem(c.Request.Context(), userID, itemID, req)
	if err != nil {
		HandleError(c, err)
		return
	}

	response.Success(c, "Cart item updated", cart)
}

func (h *CartHandler) RemoveItem(c *gin.Context) {
	userID, ok := GetUserID(c)
	if !ok {
		HandleError(c, apperror.ErrUnauthorized)
		return
	}

	itemID, ok := ParseInt64Param(c, "itemId")
	if !ok {
		return
	}

	if err := h.cartService.RemoveItem(c.Request.Context(), userID, itemID); err != nil {
		HandleError(c, err)
		return
	}

	response.NoContent(c)
}

func (h *CartHandler) ClearCart(c *gin.Context) {
	userID, ok := GetUserID(c)
	if !ok {
		HandleError(c, apperror.ErrUnauthorized)
		return
	}

	if err := h.cartService.ClearCart(c.Request.Context(), userID); err != nil {
		HandleError(c, err)
		return
	}

	response.NoContent(c)
}
