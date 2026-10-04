package service

import (
	"context"
	"errors"

	"ecommerce-api/internal/config"
	"ecommerce-api/internal/database"
	"ecommerce-api/internal/dto"
	"ecommerce-api/internal/models"
	"ecommerce-api/internal/pkg/apperror"
	"ecommerce-api/internal/repository"

	"gorm.io/gorm"
)

type InventoryService interface {
	AdjustStock(ctx context.Context, adminID, productID int64, req dto.AdjustStockRequest) (*dto.ProductResponse, error)
	ListLowStock(ctx context.Context, threshold, page, limit int) ([]dto.ProductResponse, int64, error)
}

type inventoryService struct {
	productRepo       repository.ProductRepository
	stockMovementRepo repository.StockMovementRepository
	txManager         database.TxManager
	cfg               *config.Config
}

func NewInventoryService(
	productRepo repository.ProductRepository,
	stockMovementRepo repository.StockMovementRepository,
	txManager database.TxManager,
	cfg *config.Config,
) InventoryService {
	return &inventoryService{
		productRepo:       productRepo,
		stockMovementRepo: stockMovementRepo,
		txManager:         txManager,
		cfg:               cfg,
	}
}

func (s *inventoryService) AdjustStock(ctx context.Context, adminID, productID int64, req dto.AdjustStockRequest) (*dto.ProductResponse, error) {
	var updatedProduct *models.Product

	err := s.txManager.WithTx(ctx, func(txCtx context.Context) error {
		product, err := s.productRepo.FindByID(txCtx, productID)
		if err != nil {
			if errors.Is(err, gorm.ErrRecordNotFound) {
				return apperror.ErrProductNotFound
			}
			return apperror.ErrInternal
		}

		if req.Adjustment < 0 {
			toDeduct := -req.Adjustment
			success, err := s.productRepo.DecrementStock(txCtx, product.ID, toDeduct)
			if err != nil {
				return apperror.ErrInternal
			}
			if !success {
				return apperror.New(422, "INSUFFICIENT_STOCK", "Stock cannot be reduced below zero")
			}
		} else {
			if err := s.productRepo.IncrementStock(txCtx, product.ID, req.Adjustment); err != nil {
				return apperror.ErrInternal
			}
		}

		// Write stock movement
		movement := &models.StockMovement{
			ProductID: product.ID,
			Change:    req.Adjustment,
			Reason:    req.Reason,
			CreatedBy: &adminID,
		}
		if err := s.stockMovementRepo.Create(txCtx, movement); err != nil {
			return apperror.ErrInternal
		}

		p, err := s.productRepo.FindByID(txCtx, productID)
		if err != nil {
			return apperror.ErrInternal
		}
		updatedProduct = p
		return nil
	})

	if err != nil {
		if appErr, ok := err.(*apperror.AppError); ok {
			return nil, appErr
		}
		return nil, apperror.ErrInternal
	}

	return &dto.ProductResponse{
		ID:            updatedProduct.ID,
		CategoryID:    updatedProduct.CategoryID,
		Name:          updatedProduct.Name,
		Slug:          updatedProduct.Slug,
		Description:   updatedProduct.Description,
		SKU:           updatedProduct.SKU,
		Price:         updatedProduct.Price,
		Currency:      s.cfg.DefaultCurrency,
		StockQuantity: updatedProduct.StockQuantity,
		ImageURL:      updatedProduct.ImageURL,
		Status:        updatedProduct.Status,
		CreatedAt:     updatedProduct.CreatedAt,
	}, nil
}

func (s *inventoryService) ListLowStock(ctx context.Context, threshold, page, limit int) ([]dto.ProductResponse, int64, error) {
	if threshold <= 0 {
		threshold = 5
	}
	if limit <= 0 {
		limit = 20
	}
	if page <= 0 {
		page = 1
	}

	products, total, err := s.productRepo.ListLowStock(ctx, threshold, page, limit)
	if err != nil {
		return nil, 0, apperror.ErrInternal
	}

	res := make([]dto.ProductResponse, len(products))
	for i, p := range products {
		res[i] = dto.ProductResponse{
			ID:            p.ID,
			CategoryID:    p.CategoryID,
			Name:          p.Name,
			Slug:          p.Slug,
			Description:   p.Description,
			SKU:           p.SKU,
			Price:         p.Price,
			Currency:      s.cfg.DefaultCurrency,
			StockQuantity: p.StockQuantity,
			ImageURL:      p.ImageURL,
			Status:        p.Status,
			CreatedAt:     p.CreatedAt,
		}
	}

	return res, total, nil
}
