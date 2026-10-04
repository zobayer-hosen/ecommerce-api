package service

import (
	"context"
	"errors"
	"fmt"

	"ecommerce-api/internal/dto"
	"ecommerce-api/internal/models"
	"ecommerce-api/internal/pkg/apperror"
	"ecommerce-api/internal/pkg/slug"
	"ecommerce-api/internal/repository"

	"gorm.io/gorm"
)

type CategoryService interface {
	List(ctx context.Context) ([]dto.CategoryResponse, error)
	GetByID(ctx context.Context, id int64) (*dto.CategoryResponse, error)
	Create(ctx context.Context, req dto.CreateCategoryRequest) (*dto.CategoryResponse, error)
	Update(ctx context.Context, id int64, req dto.UpdateCategoryRequest) (*dto.CategoryResponse, error)
	Delete(ctx context.Context, id int64) error
}

type categoryService struct {
	categoryRepo repository.CategoryRepository
}

func NewCategoryService(categoryRepo repository.CategoryRepository) CategoryService {
	return &categoryService{categoryRepo: categoryRepo}
}

func (s *categoryService) List(ctx context.Context) ([]dto.CategoryResponse, error) {
	categories, err := s.categoryRepo.ListWithProductCount(ctx)
	if err != nil {
		return nil, apperror.ErrInternal
	}

	res := make([]dto.CategoryResponse, len(categories))
	for i, c := range categories {
		res[i] = dto.CategoryResponse{
			ID:           c.ID,
			Name:         c.Name,
			Slug:         c.Slug,
			Description:  c.Description,
			ProductCount: c.ProductCount,
			CreatedAt:    c.CreatedAt,
		}
	}
	return res, nil
}

func (s *categoryService) GetByID(ctx context.Context, id int64) (*dto.CategoryResponse, error) {
	category, err := s.categoryRepo.FindByID(ctx, id)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, apperror.ErrCategoryNotFound
		}
		return nil, apperror.ErrInternal
	}

	hasProds, err := s.categoryRepo.HasProducts(ctx, id)
	if err != nil {
		return nil, apperror.ErrInternal
	}
	var count int64
	if hasProds {
		count = 1
	}

	return &dto.CategoryResponse{
		ID:           category.ID,
		Name:         category.Name,
		Slug:         category.Slug,
		Description:  category.Description,
		ProductCount: count,
		CreatedAt:    category.CreatedAt,
	}, nil
}

func (s *categoryService) Create(ctx context.Context, req dto.CreateCategoryRequest) (*dto.CategoryResponse, error) {
	// Check name uniqueness
	existing, err := s.categoryRepo.FindByName(ctx, req.Name)
	if err != nil && !errors.Is(err, gorm.ErrRecordNotFound) {
		return nil, apperror.ErrInternal
	}
	if existing != nil {
		return nil, apperror.New(409, "CATEGORY_ALREADY_EXISTS", "Category name already exists")
	}

	categorySlug := slug.Make(req.Name)
	// Check slug uniqueness
	existingSlug, err := s.categoryRepo.FindBySlug(ctx, categorySlug)
	if err != nil && !errors.Is(err, gorm.ErrRecordNotFound) {
		return nil, apperror.ErrInternal
	}
	if existingSlug != nil {
		categorySlug = fmt.Sprintf("%s-%d", categorySlug, models.Category{}.ID)
	}

	category := &models.Category{
		Name:        req.Name,
		Slug:        categorySlug,
		Description: req.Description,
	}

	if err := s.categoryRepo.Create(ctx, category); err != nil {
		return nil, apperror.ErrInternal
	}

	return &dto.CategoryResponse{
		ID:           category.ID,
		Name:         category.Name,
		Slug:         category.Slug,
		Description:  category.Description,
		ProductCount: 0,
		CreatedAt:    category.CreatedAt,
	}, nil
}

func (s *categoryService) Update(ctx context.Context, id int64, req dto.UpdateCategoryRequest) (*dto.CategoryResponse, error) {
	category, err := s.categoryRepo.FindByID(ctx, id)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, apperror.ErrCategoryNotFound
		}
		return nil, apperror.ErrInternal
	}

	if req.Name != nil && *req.Name != category.Name {
		// Check name uniqueness
		existing, err := s.categoryRepo.FindByName(ctx, *req.Name)
		if err != nil && !errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, apperror.ErrInternal
		}
		if existing != nil && existing.ID != category.ID {
			return nil, apperror.New(409, "CATEGORY_ALREADY_EXISTS", "Category name already exists")
		}
		category.Name = *req.Name
		category.Slug = slug.Make(*req.Name)
	}

	if req.Description != nil {
		category.Description = req.Description
	}

	if err := s.categoryRepo.Update(ctx, category); err != nil {
		return nil, apperror.ErrInternal
	}

	return &dto.CategoryResponse{
		ID:          category.ID,
		Name:        category.Name,
		Slug:        category.Slug,
		Description: category.Description,
		CreatedAt:   category.CreatedAt,
	}, nil
}

func (s *categoryService) Delete(ctx context.Context, id int64) error {
	category, err := s.categoryRepo.FindByID(ctx, id)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return apperror.ErrCategoryNotFound
		}
		return apperror.ErrInternal
	}

	// FR-3.3: Blocked with 409 CATEGORY_HAS_PRODUCTS if any product references it
	hasProducts, err := s.categoryRepo.HasProducts(ctx, category.ID)
	if err != nil {
		return apperror.ErrInternal
	}
	if hasProducts {
		return apperror.ErrCategoryHasProducts
	}

	if err := s.categoryRepo.Delete(ctx, id); err != nil {
		return apperror.ErrInternal
	}

	return nil
}
