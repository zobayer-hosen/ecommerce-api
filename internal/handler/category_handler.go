package handler

import (
	"ecommerce-api/internal/dto"
	"ecommerce-api/internal/pkg/response"
	"ecommerce-api/internal/service"

	"github.com/gin-gonic/gin"
)

type CategoryHandler struct {
	categoryService service.CategoryService
}

func NewCategoryHandler(categoryService service.CategoryService) *CategoryHandler {
	return &CategoryHandler{categoryService: categoryService}
}

func (h *CategoryHandler) List(c *gin.Context) {
	categories, err := h.categoryService.List(c.Request.Context())
	if err != nil {
		HandleError(c, err)
		return
	}

	response.Success(c, "Categories retrieved successfully", categories)
}

func (h *CategoryHandler) GetByID(c *gin.Context) {
	id, ok := ParseInt64Param(c, "id")
	if !ok {
		return
	}

	category, err := h.categoryService.GetByID(c.Request.Context(), id)
	if err != nil {
		HandleError(c, err)
		return
	}

	response.Success(c, "Category retrieved successfully", category)
}

func (h *CategoryHandler) Create(c *gin.Context) {
	var req dto.CreateCategoryRequest
	if !BindJSON(c, &req) {
		return
	}

	category, err := h.categoryService.Create(c.Request.Context(), req)
	if err != nil {
		HandleError(c, err)
		return
	}

	response.Created(c, "Category created successfully", category)
}

func (h *CategoryHandler) Update(c *gin.Context) {
	id, ok := ParseInt64Param(c, "id")
	if !ok {
		return
	}

	var req dto.UpdateCategoryRequest
	if !BindJSON(c, &req) {
		return
	}

	category, err := h.categoryService.Update(c.Request.Context(), id, req)
	if err != nil {
		HandleError(c, err)
		return
	}

	response.Success(c, "Category updated successfully", category)
}

func (h *CategoryHandler) Delete(c *gin.Context) {
	id, ok := ParseInt64Param(c, "id")
	if !ok {
		return
	}

	if err := h.categoryService.Delete(c.Request.Context(), id); err != nil {
		HandleError(c, err)
		return
	}

	response.NoContent(c)
}
