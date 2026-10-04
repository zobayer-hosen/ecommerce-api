package main

import (
	"context"
	"errors"
	"fmt"
	"log"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"ecommerce-api/internal/config"
	"ecommerce-api/internal/database"
	"ecommerce-api/internal/handler"
	"ecommerce-api/internal/models"
	"ecommerce-api/internal/pkg/hash"
	"ecommerce-api/internal/pkg/jwt"
	"ecommerce-api/internal/repository"
	"ecommerce-api/internal/router"
	"ecommerce-api/internal/service"

	"gorm.io/gorm"
)

func main() {
	// 1. Load configuration
	cfg, err := config.LoadConfig()
	if err != nil {
		log.Fatalf("Failed to load configuration: %v", err)
	}

	log.Printf("Starting application in %s mode on port %s", cfg.Env, cfg.Port)

	// 2. Connect to PostgreSQL
	db, err := database.Connect(cfg)
	if err != nil {
		log.Fatalf("Database connection failed: %v", err)
	}
	defer db.SQL.Close()

	// 3. Run database migrations
	if err := db.RunMigrations("migrations"); err != nil {
		log.Fatalf("Migration failed: %v", err)
	}

	// 4. Initialize Transaction Manager
	txManager := database.NewTxManager(db.GORM)

	// 5. Initialize JWT Manager
	jwtMgr := jwt.NewTokenManager(cfg.JWTSecret, cfg.JWTAccessDurationMinutes, cfg.JWTRefreshDurationDays)

	// 6. Initialize Repositories
	userRepo := repository.NewUserRepository(db.GORM)
	tokenRepo := repository.NewTokenRepository(db.GORM)
	categoryRepo := repository.NewCategoryRepository(db.GORM)
	productRepo := repository.NewProductRepository(db.GORM)
	cartRepo := repository.NewCartRepository(db.GORM)
	orderRepo := repository.NewOrderRepository(db.GORM)
	stockMovementRepo := repository.NewStockMovementRepository(db.GORM)
	dashboardRepo := repository.NewDashboardRepository(db.GORM)

	// 7. Seed Admin User
	seedAdmin(userRepo, cfg)

	// 8. Initialize Services
	authService := service.NewAuthService(userRepo, tokenRepo, cartRepo, jwtMgr)
	userService := service.NewUserService(userRepo, tokenRepo)
	categoryService := service.NewCategoryService(categoryRepo)
	productService := service.NewProductService(productRepo, categoryRepo, cfg)
	inventoryService := service.NewInventoryService(productRepo, stockMovementRepo, txManager, cfg)
	cartService := service.NewCartService(cartRepo, productRepo, cfg)
	orderService := service.NewOrderService(orderRepo, cartRepo, productRepo, stockMovementRepo, txManager, cfg)
	dashboardService := service.NewDashboardService(dashboardRepo)

	// 9. Initialize Handlers
	handlers := &router.Handlers{
		Auth:      handler.NewAuthHandler(authService),
		User:      handler.NewUserHandler(userService),
		Category:  handler.NewCategoryHandler(categoryService),
		Product:   handler.NewProductHandler(productService, inventoryService),
		Cart:      handler.NewCartHandler(cartService),
		Order:     handler.NewOrderHandler(orderService),
		Dashboard: handler.NewDashboardHandler(dashboardService),
		Health:    handler.NewHealthHandler(db),
	}

	// 10. Setup Router
	r := router.SetupRouter(cfg, jwtMgr, handlers)

	// 11. Start HTTP Server with Graceful Shutdown (NFR-9)
	srv := &http.Server{
		Addr:         fmt.Sprintf(":%s", cfg.Port),
		Handler:      r,
		ReadTimeout:  10 * time.Second,
		WriteTimeout: 10 * time.Second,
		IdleTimeout:  60 * time.Second,
	}

	go func() {
		log.Printf("Server listening on http://localhost:%s", cfg.Port)
		if err := srv.ListenAndServe(); err != nil && !errors.Is(err, http.ErrServerClosed) {
			log.Fatalf("Server error: %v", err)
		}
	}()

	// Wait for interrupt signal to gracefully shut down the server
	quit := make(chan os.Signal, 1)
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
	<-quit
	log.Println("Shutting down server...")

	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	if err := srv.Shutdown(ctx); err != nil {
		log.Fatalf("Server forced to shutdown: %v", err)
	}

	log.Println("Server exiting successfully")
}

func seedAdmin(userRepo repository.UserRepository, cfg *config.Config) {
	ctx := context.Background()
	existing, err := userRepo.FindByEmail(ctx, cfg.AdminEmail)
	if err != nil && !errors.Is(err, gorm.ErrRecordNotFound) {
		log.Printf("Warning: error checking admin existence: %v", err)
		return
	}

	if existing == nil {
		hashedPassword, err := hash.HashPassword(cfg.AdminPassword)
		if err != nil {
			log.Printf("Warning: failed to hash admin password: %v", err)
			return
		}

		admin := &models.User{
			Name:         cfg.AdminName,
			Email:        cfg.AdminEmail,
			PasswordHash: hashedPassword,
			Role:         models.RoleAdmin,
			IsActive:     true,
		}

		if err := userRepo.Create(ctx, admin); err != nil {
			log.Printf("Warning: failed to seed admin user: %v", err)
			return
		}
		log.Printf("Default admin user seeded: %s", cfg.AdminEmail)
	}
}
