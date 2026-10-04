package middleware

import (
	"errors"
	"strings"

	"ecommerce-api/internal/pkg/apperror"
	"ecommerce-api/internal/pkg/jwt"
	"ecommerce-api/internal/pkg/response"

	"github.com/gin-gonic/gin"
	jwtPkg "github.com/golang-jwt/jwt/v5"
)

const (
	ContextUserID = "user_id"
	ContextRole   = "role"
)

func Auth(jwtMgr *jwt.TokenManager) gin.HandlerFunc {
	return func(c *gin.Context) {
		authHeader := c.GetHeader("Authorization")
		if authHeader == "" {
			response.Error(c, apperror.ErrUnauthorized)
			c.Abort()
			return
		}

		parts := strings.SplitN(authHeader, " ", 2)
		if len(parts) != 2 || !strings.EqualFold(parts[0], "Bearer") {
			response.Error(c, apperror.ErrUnauthorized)
			c.Abort()
			return
		}

		claims, err := jwtMgr.ParseAccessToken(parts[1])
		if err != nil {
			if errors.Is(err, jwtPkg.ErrTokenExpired) {
				response.Error(c, apperror.ErrTokenExpired)
			} else {
				response.Error(c, apperror.ErrUnauthorized)
			}
			c.Abort()
			return
		}

		c.Set(ContextUserID, claims.UserID)
		c.Set(ContextRole, claims.Role)
		c.Next()
	}
}

// OptionalAuth parses the token if provided, but does not reject requests without a token
func OptionalAuth(jwtMgr *jwt.TokenManager) gin.HandlerFunc {
	return func(c *gin.Context) {
		authHeader := c.GetHeader("Authorization")
		if authHeader != "" {
			parts := strings.SplitN(authHeader, " ", 2)
			if len(parts) == 2 && strings.EqualFold(parts[0], "Bearer") {
				if claims, err := jwtMgr.ParseAccessToken(parts[1]); err == nil {
					c.Set(ContextUserID, claims.UserID)
					c.Set(ContextRole, claims.Role)
				}
			}
		}
		c.Next()
	}
}

func RequireRole(allowedRoles ...string) gin.HandlerFunc {
	roleMap := make(map[string]bool)
	for _, r := range allowedRoles {
		roleMap[r] = true
	}

	return func(c *gin.Context) {
		userRole, exists := c.Get(ContextRole)
		if !exists {
			response.Error(c, apperror.ErrUnauthorized)
			c.Abort()
			return
		}

		roleStr, ok := userRole.(string)
		if !ok || !roleMap[roleStr] {
			response.Error(c, apperror.ErrForbidden)
			c.Abort()
			return
		}

		c.Next()
	}
}
