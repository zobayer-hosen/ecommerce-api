package handler

import (
	"ecommerce-api/internal/dto"
	"ecommerce-api/internal/pkg/response"
	"ecommerce-api/internal/service"

	"github.com/gin-gonic/gin"
)

type AuthHandler struct {
	authService service.AuthService
}

func NewAuthHandler(authService service.AuthService) *AuthHandler {
	return &AuthHandler{authService: authService}
}

func (h *AuthHandler) Register(c *gin.Context) {
	var req dto.RegisterRequest
	if !BindJSON(c, &req) {
		return
	}

	user, err := h.authService.Register(c.Request.Context(), req)
	if err != nil {
		HandleError(c, err)
		return
	}

	response.Created(c, "Registration successful", user)
}

func (h *AuthHandler) Login(c *gin.Context) {
	var req dto.LoginRequest
	if !BindJSON(c, &req) {
		return
	}

	tokens, err := h.authService.Login(c.Request.Context(), req)
	if err != nil {
		HandleError(c, err)
		return
	}

	response.Success(c, "Login successful", tokens)
}

func (h *AuthHandler) Refresh(c *gin.Context) {
	var req dto.RefreshTokenRequest
	if !BindJSON(c, &req) {
		return
	}

	tokens, err := h.authService.RefreshToken(c.Request.Context(), req)
	if err != nil {
		HandleError(c, err)
		return
	}

	response.Success(c, "Token refreshed successfully", tokens)
}

func (h *AuthHandler) Logout(c *gin.Context) {
	var req dto.LogoutRequest
	if !BindJSON(c, &req) {
		return
	}

	if err := h.authService.Logout(c.Request.Context(), req); err != nil {
		HandleError(c, err)
		return
	}

	response.NoContent(c)
}
