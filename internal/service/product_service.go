package service

import (
	"context"
	"errors"
	"fmt"
	"time"

	"ecommerce-api/internal/config"
	"ecommerce-api/internal/dto"
	"ecommerce-api/internal/models"
	"ecommerce-api/internal/pkg/apperror"
	"ecommerce-api/internal/pkg/slug"
	"ecommerce-api/internal/repository"

	"gorm.io/gorm"
)

type ProductService interface {
	List(ctx context.Context, filter dto.ProductFilter, isAdmin bool) ([]dto.ProductResponse, int64, error)
	GetByIDOrSlug(ctx context.Context, idOrSlug string, isAdmin bool) (*dto.ProductResponse, error)
	Create(ctx context.Context, req dto.CreateProductRequest) (*dto.ProductResponse, error)
	Update(ctx context.Context, id int64, req dto.UpdateProductRequest) (*dto.ProductResponse, error)
	Delete(ctx context.Context, id int64) error
}

type productService struct {
	productRepo  repository.ProductRepository
	categoryRepo repository.CategoryRepository
	cfg          *config.Config
}

func NewProductService(
	productRepo repository.ProductRepository,
	categoryRepo repository.CategoryRepository,
	cfg *config.Config,
) ProductService {
	return &productService{
		productRepo:  productRepo,
		categoryRepo: categoryRepo,
		cfg:          cfg,
	}
}

func (s *productService) List(ctx context.Context, filter dto.ProductFilter, isAdmin bool) ([]dto.ProductResponse, int64, error) {
	// Public users always see ACTIVE products only
	if !isAdmin {
		filter.Status = models.ProductStatusActive
	}

	products, total, err := s.productRepo.List(ctx, filter)
	if err != nil {
		return nil, 0, apperror.ErrInternal
	}

	res := make([]dto.ProductResponse, len(products))
	for i, p := range products {
		res[i] = *s.toProductResponse(&p)
	}

	return res, total, nil
}

func (s *productService) GetByIDOrSlug(ctx context.Context, idOrSlug string, isAdmin bool) (*dto.ProductResponse, error) {
	product, err := s.productRepo.FindByIDOrSlug(ctx, idOrSlug, !isAdmin)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, apperror.ErrProductNotFound
		}
		return nil, apperror.ErrInternal
	}

	return s.toProductResponse(product), nil
}

func (s *productService) Create(ctx context.Context, req dto.CreateProductRequest) (*dto.ProductResponse, error) {
	// Verify category exists
	_, err := s.categoryRepo.FindByID(ctx, req.CategoryID)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, apperror.ErrCategoryNotFound
		}
		return nil, apperror.ErrInternal
	}

	// Verify SKU unique
	existingSKU, err := s.productRepo.FindBySKU(ctx, req.SKU)
	if err != nil && !errors.Is(err, gorm.ErrRecordNotFound) {
		return nil, apperror.ErrInternal
	}
	if existingSKU != nil {
		return nil, apperror.ErrSKUAlreadyExists
	}

	productSlug := slug.Make(req.Name)
	// Check slug uniqueness
	existingSlug, err := s.productRepo.FindBySlug(ctx, productSlug)
	if err != nil && !errors.Is(err, gorm.ErrRecordNotFound) {
		return nil, apperror.ErrInternal
	}
	if existingSlug != nil {
		productSlug = fmt.Sprintf("%s-%d", productSlug, time.Now().UnixNano()%10000)
	}

	status := req.Status
	if status == "" {
		status = models.ProductStatusDraft
	}

	product := &models.Product{
		CategoryID:    req.CategoryID,
		Name:          req.Name,
		Slug:          productSlug,
		Description:   req.Description,
		SKU:           req.SKU,
		Price:         req.Price,
		StockQuantity: req.StockQuantity,
		ImageURL:      req.ImageURL,
		Status:        status,
	}

	if err := s.productRepo.Create(ctx, product); err != nil {
		return nil, apperror.ErrInternal
	}

	// Refetch to populate category relation
	createdProduct, err := s.productRepo.FindByID(ctx, product.ID)
	if err != nil {
		return s.toProductResponse(product), nil
	}

	return s.toProductResponse(createdProduct), nil
}

func (s *productService) Update(ctx context.Context, id int64, req dto.UpdateProductRequest) (*dto.ProductResponse, error) {
	product, err := s.productRepo.FindByID(ctx, id)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, apperror.ErrProductNotFound
		}
		return nil, apperror.ErrInternal
	}

	if req.CategoryID != nil && *req.CategoryID != product.CategoryID {
		_, err := s.categoryRepo.FindByID(ctx, *req.CategoryID)
		if err != nil {
			if errors.Is(err, gorm.ErrRecordNotFound) {
				return nil, apperror.ErrCategoryNotFound
			}
			return nil, apperror.ErrInternal
		}
		product.CategoryID = *req.CategoryID
	}

	if req.Name != nil && *req.Name != product.Name {
		product.Name = *req.Name
		product.Slug = slug.Make(*req.Name)
	}

	if req.SKU != nil && *req.SKU != product.SKU {
		existingSKU, err := s.productRepo.FindBySKU(ctx, *req.SKU)
		if err != nil && !errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, apperror.ErrInternal
		}
		if existingSKU != nil && existingSKU.ID != product.ID {
			return nil, apperror.ErrSKUAlreadyExists
		}
		product.SKU = *req.SKU
	}

	if req.Price != nil {
		product.Price = *req.Price
	}
	if req.StockQuantity != nil {
		product.StockQuantity = *req.StockQuantity
	}
	if req.Description != nil {
		product.Description = req.Description
	}
	if req.ImageURL != nil {
		product.ImageURL = req.ImageURL
	}
	if req.Status != nil {
		product.Status = *req.Status
	}

	if err := s.productRepo.Update(ctx, product); err != nil {
		return nil, apperror.ErrInternal
	}

	updatedProduct, err := s.productRepo.FindByID(ctx, product.ID)
	if err != nil {
		return s.toProductResponse(product), nil
	}

	return s.toProductResponse(updatedProduct), nil
}

func (s *productService) Delete(ctx context.Context, id int64) error {
	product, err := s.productRepo.FindByID(ctx, id)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return apperror.ErrProductNotFound
		}
		return apperror.ErrInternal
	}

	if err := s.productRepo.SoftDelete(ctx, product.ID); err != nil {
		return apperror.ErrInternal
	}

	return nil
}

func (s *productService) toProductResponse(p *models.Product) *dto.ProductResponse {
	resp := &dto.ProductResponse{
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

	if p.Category != nil {
		resp.Category = &dto.CategoryResponse{
			ID:          p.Category.ID,
			Name:        p.Category.Name,
			Slug:        p.Category.Slug,
			Description: p.Category.Description,
			CreatedAt:   p.Category.CreatedAt,
		}
	}

	return resp
}
