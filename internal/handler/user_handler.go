package handler

import (
	"ecommerce-api/internal/dto"
	"ecommerce-api/internal/pkg/apperror"
	"ecommerce-api/internal/pkg/pagination"
	"ecommerce-api/internal/pkg/response"
	"ecommerce-api/internal/service"

	"github.com/gin-gonic/gin"
)

type UserHandler struct {
	userService service.UserService
}

func NewUserHandler(userService service.UserService) *UserHandler {
	return &UserHandler{userService: userService}
}

func (h *UserHandler) GetProfile(c *gin.Context) {
	userID, ok := GetUserID(c)
	if !ok {
		HandleError(c, apperror.ErrUnauthorized)
		return
	}

	user, err := h.userService.GetProfile(c.Request.Context(), userID)
	if err != nil {
		HandleError(c, err)
		return
	}

	response.Success(c, "Profile retrieved successfully", user)
}

func (h *UserHandler) UpdateProfile(c *gin.Context) {
	userID, ok := GetUserID(c)
	if !ok {
		HandleError(c, apperror.ErrUnauthorized)
		return
	}

	var req dto.UpdateProfileRequest
	if !BindJSON(c, &req) {
		return
	}

	user, err := h.userService.UpdateProfile(c.Request.Context(), userID, req)
	if err != nil {
		HandleError(c, err)
		return
	}

	response.Success(c, "Profile updated successfully", user)
}

func (h *UserHandler) ChangePassword(c *gin.Context) {
	userID, ok := GetUserID(c)
	if !ok {
		HandleError(c, apperror.ErrUnauthorized)
		return
	}

	var req dto.ChangePasswordRequest
	if !BindJSON(c, &req) {
		return
	}

	if err := h.userService.ChangePassword(c.Request.Context(), userID, req); err != nil {
		HandleError(c, err)
		return
	}

	response.NoContent(c)
}

func (h *UserHandler) AdminListUsers(c *gin.Context) {
	params := pagination.FromContext(c)
	search := c.Query("search")

	users, total, err := h.userService.AdminListUsers(c.Request.Context(), params.Page, params.Limit, search)
	if err != nil {
		HandleError(c, err)
		return
	}

	meta := pagination.BuildMeta(params, total)
	response.List(c, "Users retrieved successfully", users, meta)
}

func (h *UserHandler) AdminUpdateUser(c *gin.Context) {
	targetUserID, ok := ParseInt64Param(c, "id")
	if !ok {
		return
	}

	var req dto.AdminUpdateUserRequest
	if !BindJSON(c, &req) {
		return
	}

	user, err := h.userService.AdminUpdateUser(c.Request.Context(), targetUserID, req)
	if err != nil {
		HandleError(c, err)
		return
	}

	response.Success(c, "User updated successfully", user)
}
