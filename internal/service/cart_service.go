package service

import (
	"context"
	"errors"

	"ecommerce-api/internal/config"
	"ecommerce-api/internal/dto"
	"ecommerce-api/internal/models"
	"ecommerce-api/internal/pkg/apperror"
	"ecommerce-api/internal/repository"

	"gorm.io/gorm"
)

type CartService interface {
	GetCart(ctx context.Context, userID int64) (*dto.CartResponse, error)
	AddItem(ctx context.Context, userID int64, req dto.AddToCartRequest) (*dto.CartResponse, error)
	UpdateItem(ctx context.Context, userID int64, itemID int64, req dto.UpdateCartItemRequest) (*dto.CartResponse, error)
	RemoveItem(ctx context.Context, userID int64, itemID int64) error
	ClearCart(ctx context.Context, userID int64) error
}

type cartService struct {
	cartRepo    repository.CartRepository
	productRepo repository.ProductRepository
	cfg         *config.Config
}

func NewCartService(
	cartRepo repository.CartRepository,
	productRepo repository.ProductRepository,
	cfg *config.Config,
) CartService {
	return &cartService{
		cartRepo:    cartRepo,
		productRepo: productRepo,
		cfg:         cfg,
	}
}

func (s *cartService) GetCart(ctx context.Context, userID int64) (*dto.CartResponse, error) {
	cart, err := s.cartRepo.FindWithItems(ctx, userID)
	if err != nil {
		return nil, apperror.ErrInternal
	}

	return s.buildCartResponse(cart), nil
}

func (s *cartService) AddItem(ctx context.Context, userID int64, req dto.AddToCartRequest) (*dto.CartResponse, error) {
	// Validate product: exists, not deleted, ACTIVE (FR-6.2)
	product, err := s.productRepo.FindByID(ctx, req.ProductID)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, apperror.ErrProductUnavailable
		}
		return nil, apperror.ErrInternal
	}

	if product.Status != models.ProductStatusActive {
		return nil, apperror.ErrProductUnavailable
	}

	cart, err := s.cartRepo.FindOrCreateByUserID(ctx, userID)
	if err != nil {
		return nil, apperror.ErrInternal
	}

	// Check if already in cart
	existingItem, err := s.cartRepo.FindItemByProduct(ctx, cart.ID, req.ProductID)
	if err != nil && !errors.Is(err, gorm.ErrRecordNotFound) {
		return nil, apperror.ErrInternal
	}

	totalQuantity := req.Quantity
	if existingItem != nil {
		totalQuantity += existingItem.Quantity
	}

	// Check against stock (soft check)
	if totalQuantity > product.StockQuantity {
		return nil, apperror.ErrCartInsufficientStock
	}

	if existingItem != nil {
		existingItem.Quantity = totalQuantity
		if err := s.cartRepo.UpdateItem(ctx, existingItem); err != nil {
			return nil, apperror.ErrInternal
		}
	} else {
		newItem := &models.CartItem{
			CartID:    cart.ID,
			ProductID: req.ProductID,
			Quantity:  req.Quantity,
		}
		if err := s.cartRepo.AddItem(ctx, newItem); err != nil {
			return nil, apperror.ErrInternal
		}
	}

	return s.GetCart(ctx, userID)
}

func (s *cartService) UpdateItem(ctx context.Context, userID int64, itemID int64, req dto.UpdateCartItemRequest) (*dto.CartResponse, error) {
	cart, err := s.cartRepo.FindOrCreateByUserID(ctx, userID)
	if err != nil {
		return nil, apperror.ErrInternal
	}

	item, err := s.cartRepo.FindItemByID(ctx, cart.ID, itemID)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, apperror.New(404, "CART_ITEM_NOT_FOUND", "Cart item not found")
		}
		return nil, apperror.ErrInternal
	}

	// Check product stock
	product, err := s.productRepo.FindByID(ctx, item.ProductID)
	if err != nil {
		return nil, apperror.ErrProductUnavailable
	}

	if product.Status != models.ProductStatusActive {
		return nil, apperror.ErrProductUnavailable
	}

	if req.Quantity > product.StockQuantity {
		return nil, apperror.ErrCartInsufficientStock
	}

	item.Quantity = req.Quantity
	if err := s.cartRepo.UpdateItem(ctx, item); err != nil {
		return nil, apperror.ErrInternal
	}

	return s.GetCart(ctx, userID)
}

func (s *cartService) RemoveItem(ctx context.Context, userID int64, itemID int64) error {
	cart, err := s.cartRepo.FindOrCreateByUserID(ctx, userID)
	if err != nil {
		return apperror.ErrInternal
	}

	if err := s.cartRepo.RemoveItem(ctx, cart.ID, itemID); err != nil {
		return apperror.ErrInternal
	}

	return nil
}

func (s *cartService) ClearCart(ctx context.Context, userID int64) error {
	cart, err := s.cartRepo.FindOrCreateByUserID(ctx, userID)
	if err != nil {
		return apperror.ErrInternal
	}

	if err := s.cartRepo.ClearCart(ctx, cart.ID); err != nil {
		return apperror.ErrInternal
	}

	return nil
}

func (s *cartService) buildCartResponse(cart *models.Cart) *dto.CartResponse {
	resp := &dto.CartResponse{
		ID:            cart.ID,
		UserID:        cart.UserID,
		Items:         make([]dto.CartItemResponse, 0),
		ItemCount:     0,
		TotalQuantity: 0,
		Subtotal:      0,
		Currency:      s.cfg.DefaultCurrency,
	}

	for _, item := range cart.Items {
		if item.Product == nil || item.Product.DeletedAt.Valid {
			continue
		}
		lineTotal := item.Product.Price * int64(item.Quantity)
		resp.Subtotal += lineTotal
		resp.TotalQuantity += item.Quantity
		resp.ItemCount++

		resp.Items = append(resp.Items, dto.CartItemResponse{
			ID:          item.ID,
			ProductID:   item.ProductID,
			ProductName: item.Product.Name,
			SKU:         item.Product.SKU,
			Price:       item.Product.Price,
			Quantity:    item.Quantity,
			LineTotal:   lineTotal,
			ImageURL:    item.Product.ImageURL,
		})
	}

	return resp
}
