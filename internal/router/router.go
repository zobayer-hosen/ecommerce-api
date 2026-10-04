package router

import (
	"ecommerce-api/internal/config"
	"ecommerce-api/internal/handler"
	"ecommerce-api/internal/middleware"
	"ecommerce-api/internal/models"
	"ecommerce-api/internal/pkg/jwt"

	"github.com/gin-gonic/gin"
)

type Handlers struct {
	Auth      *handler.AuthHandler
	User      *handler.UserHandler
	Category  *handler.CategoryHandler
	Product   *handler.ProductHandler
	Cart      *handler.CartHandler
	Order     *handler.OrderHandler
	Dashboard *handler.DashboardHandler
	Health    *handler.HealthHandler
}

func SetupRouter(cfg *config.Config, jwtMgr *jwt.TokenManager, h *Handlers) *gin.Engine {
	if cfg.Env == "production" {
		gin.SetMode(gin.ReleaseMode)
	}

	r := gin.New()

	// Global Middlewares
	r.Use(middleware.RequestID())
	r.Use(middleware.Logger())
	r.Use(middleware.Recovery())
	r.Use(middleware.CORS(cfg.CORSAllowedOrigins))

	// Health check (root & api)
	r.GET("/health", h.Health.HealthCheck)

	api := r.Group("/api/v1")
	{
		api.GET("/health", h.Health.HealthCheck)

		// Public Auth
		authGroup := api.Group("/auth")
		{
			authGroup.POST("/register", h.Auth.Register)
			authGroup.POST("/login", h.Auth.Login)
			authGroup.POST("/refresh", h.Auth.Refresh)
		}

		// Public Catalog reads
		api.GET("/categories", h.Category.List)
		api.GET("/categories/:id", h.Category.GetByID)
		api.GET("/products", middleware.OptionalAuth(jwtMgr), h.Product.List)
		api.GET("/products/:idOrSlug", middleware.OptionalAuth(jwtMgr), h.Product.GetByIDOrSlug)

		// Authenticated Routes (Customer & Admin)
		authenticated := api.Group("")
		authenticated.Use(middleware.Auth(jwtMgr))
		{
			authenticated.POST("/auth/logout", h.Auth.Logout)

			userGroup := authenticated.Group("/users")
			{
				userGroup.GET("/me", h.User.GetProfile)
				userGroup.PATCH("/me", h.User.UpdateProfile)
				userGroup.PUT("/me/password", h.User.ChangePassword)
			}
		}

		// Customer Routes
		customer := api.Group("")
		customer.Use(middleware.Auth(jwtMgr), middleware.RequireRole(models.RoleCustomer))
		{
			// Cart
			cartGroup := customer.Group("/cart")
			{
				cartGroup.GET("", h.Cart.GetCart)
				cartGroup.POST("/items", h.Cart.AddItem)
				cartGroup.PATCH("/items/:itemId", h.Cart.UpdateItem)
				cartGroup.DELETE("/items/:itemId", h.Cart.RemoveItem)
				cartGroup.DELETE("", h.Cart.ClearCart)
			}

			// Orders
			orderGroup := customer.Group("/orders")
			{
				orderGroup.POST("", h.Order.Checkout)
				orderGroup.GET("", h.Order.ListMyOrders)
				orderGroup.GET("/:id", h.Order.GetMyOrderDetail)
				orderGroup.POST("/:id/cancel", h.Order.CancelMyOrder)
			}
		}

		// Admin Routes
		admin := api.Group("/admin")
		admin.Use(middleware.Auth(jwtMgr), middleware.RequireRole(models.RoleAdmin))
		{
			// Categories
			admin.POST("/categories", h.Category.Create)
			admin.PATCH("/categories/:id", h.Category.Update)
			admin.DELETE("/categories/:id", h.Category.Delete)

			// Products
			admin.POST("/products", h.Product.Create)
			admin.PATCH("/products/:id", h.Product.Update)
			admin.DELETE("/products/:id", h.Product.Delete)
			admin.POST("/products/:id/stock", h.Product.AdjustStock)
			admin.GET("/products/low-stock", h.Product.ListLowStock)

			// Orders
			admin.GET("/orders", h.Order.AdminListOrders)
			admin.GET("/orders/:id", h.Order.AdminGetOrderDetail)
			admin.PATCH("/orders/:id/status", h.Order.AdminUpdateStatus)

			// Users
			admin.GET("/users", h.User.AdminListUsers)
			admin.PATCH("/users/:id", h.User.AdminUpdateUser)

			// Dashboard
			admin.GET("/dashboard", h.Dashboard.GetDashboard)
		}
	}

	return r
}
