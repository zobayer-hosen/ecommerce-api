package pagination

import (
	"math"
	"strconv"

	"ecommerce-api/internal/pkg/response"

	"github.com/gin-gonic/gin"
)

const (
	DefaultPage  = 1
	DefaultLimit = 20
	MaxLimit     = 100
)

type Params struct {
	Page  int
	Limit int
}

func (p Params) Offset() int {
	return (p.Page - 1) * p.Limit
}

func FromContext(c *gin.Context) Params {
	page := getIntQuery(c, "page", DefaultPage)
	if page < 1 {
		page = DefaultPage
	}

	limit := getIntQuery(c, "limit", DefaultLimit)
	if limit < 1 {
		limit = DefaultLimit
	} else if limit > MaxLimit {
		limit = MaxLimit
	}

	return Params{
		Page:  page,
		Limit: limit,
	}
}

func BuildMeta(params Params, total int64) response.Meta {
	totalPages := 0
	if params.Limit > 0 {
		totalPages = int(math.Ceil(float64(total) / float64(params.Limit)))
	}
	return response.Meta{
		Page:       params.Page,
		Limit:      params.Limit,
		Total:      total,
		TotalPages: totalPages,
	}
}

func getIntQuery(c *gin.Context, key string, defaultVal int) int {
	valStr := c.Query(key)
	if valStr == "" {
		return defaultVal
	}
	val, err := strconv.Atoi(valStr)
	if err != nil {
		return defaultVal
	}
	return val
}
