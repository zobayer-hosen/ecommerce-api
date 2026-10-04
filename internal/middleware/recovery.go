package middleware

import (
	"log/slog"
	"net/http"
	"runtime/debug"

	"ecommerce-api/internal/pkg/apperror"
	"ecommerce-api/internal/pkg/response"

	"github.com/gin-gonic/gin"
)

func Recovery() gin.HandlerFunc {
	return func(c *gin.Context) {
		defer func() {
			if r := recover(); r != nil {
				reqID, _ := c.Get(RequestIDKey)
				reqIDStr, _ := reqID.(string)

				slog.Error("panic_recovered",
					slog.Any("error", r),
					slog.String("request_id", reqIDStr),
					slog.String("stack", string(debug.Stack())),
				)

				response.Error(c, apperror.New(http.StatusInternalServerError, "INTERNAL_ERROR", "An unexpected internal error occurred"))
				c.Abort()
			}
		}()
		c.Next()
	}
}
