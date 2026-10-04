package middleware

import (
	"net/http"
	"strings"

	"github.com/gin-gonic/gin"
)

func CORS(allowedOrigins []string) gin.HandlerFunc {
	allowAll := len(allowedOrigins) == 1 && allowedOrigins[0] == "*"

	originMap := make(map[string]bool)
	for _, o := range allowedOrigins {
		originMap[strings.ToLower(o)] = true
	}

	return func(c *gin.Context) {
		origin := c.GetHeader("Origin")

		if allowAll {
			c.Header("Access-Control-Allow-Origin", "*")
		} else if origin != "" && originMap[strings.ToLower(origin)] {
			c.Header("Access-Control-Allow-Origin", origin)
			c.Header("Access-Control-Allow-Credentials", "true")
		}

		c.Header("Access-Control-Allow-Methods", "GET, POST, PUT, PATCH, DELETE, OPTIONS")
		c.Header("Access-Control-Allow-Headers", "Origin, Content-Type, Accept, Authorization, X-Request-ID, Idempotency-Key")
		c.Header("Access-Control-Expose-Headers", "X-Request-ID, Content-Length")

		if c.Request.Method == http.MethodOptions {
			c.AbortWithStatus(http.StatusNoContent)
			return
		}

		c.Next()
	}
}
