package middleware

import (
	"log/slog"
	"os"
	"time"

	"github.com/gin-gonic/gin"
)

func Logger() gin.HandlerFunc {
	logger := slog.New(slog.NewJSONHandler(os.Stdout, nil))

	return func(c *gin.Context) {
		start := time.Now()
		path := c.Request.URL.Path
		rawQuery := c.Request.URL.RawQuery

		c.Next()

		latency := time.Since(start)
		status := c.Writer.Status()
		clientIP := c.ClientIP()
		reqID, _ := c.Get(RequestIDKey)

		if rawQuery != "" {
			path = path + "?" + rawQuery
		}

		logger.Info("http_request",
			slog.String("request_id", reqID.(string)),
			slog.String("method", c.Request.Method),
			slog.String("path", path),
			slog.Int("status", status),
			slog.String("client_ip", clientIP),
			slog.Duration("latency", latency),
		)
	}
}
