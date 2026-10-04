package handler

import (
	"strconv"

	"ecommerce-api/internal/dto"
	"ecommerce-api/internal/pkg/apperror"
	"ecommerce-api/internal/pkg/pagination"
	"ecommerce-api/internal/pkg/response"
	"ecommerce-api/internal/service"

	"github.com/gin-gonic/gin"
)

type ProductHandler struct {
	productService   service.ProductService
	inventoryService service.InventoryService
}

func NewProductHandler(productService service.ProductService, inventoryService service.InventoryService) *ProductHandler {
	return &ProductHandler{
		productService:   productService,
		inventoryService: inventoryService,
	}
}

func (h *ProductHandler) List(c *gin.Context) {
	params := pagination.FromContext(c)

	filter := dto.ProductFilter{
		Search: c.Query("search"),
		Sort:   c.Query("sort"),
		Status: c.Query("status"),
		Page:   params.Page,
		Limit:  params.Limit,
	}

	if catIDStr := c.Query("category_id"); catIDStr != "" {
		if catID, err := strconv.ParseInt(catIDStr, 10, 64); err == nil {
			filter.CategoryID = &catID
		}
	}

	if minPriceStr := c.Query("min_price"); minPriceStr != "" {
		if minPrice, err := strconv.ParseInt(minPriceStr, 10, 64); err == nil {
			filter.MinPrice = &minPrice
		}
	}

	if maxPriceStr := c.Query("max_price"); maxPriceStr != "" {
		if maxPrice, err := strconv.ParseInt(maxPriceStr, 10, 64); err == nil {
			filter.MaxPrice = &maxPrice
		}
	}

	if inStockStr := c.Query("in_stock"); inStockStr != "" {
		inStock := inStockStr == "true" || inStockStr == "1"
		filter.InStock = &inStock
	}

	isAdmin := IsAdmin(c)

	products, total, err := h.productService.List(c.Request.Context(), filter, isAdmin)
	if err != nil {
		HandleError(c, err)
		return
	}

	meta := pagination.BuildMeta(params, total)
	response.List(c, "Products retrieved successfully", products, meta)
}

func (h *ProductHandler) GetByIDOrSlug(c *gin.Context) {
	idOrSlug := c.Param("idOrSlug")
	if idOrSlug == "" {
		HandleError(c, apperror.ErrBadRequest)
		return
	}

	isAdmin := IsAdmin(c)

	product, err := h.productService.GetByIDOrSlug(c.Request.Context(), idOrSlug, isAdmin)
	if err != nil {
		HandleError(c, err)
		return
	}

	response.Success(c, "Product retrieved successfully", product)
}

func (h *ProductHandler) Create(c *gin.Context) {
	var req dto.CreateProductRequest
	if !BindJSON(c, &req) {
		return
	}

	product, err := h.productService.Create(c.Request.Context(), req)
	if err != nil {
		HandleError(c, err)
		return
	}

	response.Created(c, "Product created successfully", product)
}

func (h *ProductHandler) Update(c *gin.Context) {
	id, ok := ParseInt64Param(c, "id")
	if !ok {
		return
	}

	var req dto.UpdateProductRequest
	if !BindJSON(c, &req) {
		return
	}

	product, err := h.productService.Update(c.Request.Context(), id, req)
	if err != nil {
		HandleError(c, err)
		return
	}

	response.Success(c, "Product updated successfully", product)
}

func (h *ProductHandler) Delete(c *gin.Context) {
	id, ok := ParseInt64Param(c, "id")
	if !ok {
		return
	}

	if err := h.productService.Delete(c.Request.Context(), id); err != nil {
		HandleError(c, err)
		return
	}

	response.NoContent(c)
}

func (h *ProductHandler) AdjustStock(c *gin.Context) {
	id, ok := ParseInt64Param(c, "id")
	if !ok {
		return
	}

	adminID, _ := GetUserID(c)

	var req dto.AdjustStockRequest
	if !BindJSON(c, &req) {
		return
	}

	product, err := h.inventoryService.AdjustStock(c.Request.Context(), adminID, id, req)
	if err != nil {
		HandleError(c, err)
		return
	}

	response.Success(c, "Stock adjusted successfully", product)
}

func (h *ProductHandler) ListLowStock(c *gin.Context) {
	params := pagination.FromContext(c)
	threshold := 5
	if threshStr := c.Query("threshold"); threshStr != "" {
		if val, err := strconv.Atoi(threshStr); err == nil && val > 0 {
			threshold = val
		}
	}

	products, total, err := h.inventoryService.ListLowStock(c.Request.Context(), threshold, params.Page, params.Limit)
	if err != nil {
		HandleError(c, err)
		return
	}

	meta := pagination.BuildMeta(params, total)
	response.List(c, "Low stock products retrieved successfully", products, meta)
}
