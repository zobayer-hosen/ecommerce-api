package service

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"sort"
	"time"

	"ecommerce-api/internal/config"
	"ecommerce-api/internal/database"
	"ecommerce-api/internal/dto"
	"ecommerce-api/internal/models"
	"ecommerce-api/internal/pkg/apperror"
	"ecommerce-api/internal/repository"

	"gorm.io/gorm"
)

type OrderService interface {
	Checkout(ctx context.Context, userID int64, idempotencyKey string, req dto.CheckoutRequest) (*dto.OrderResponse, error)
	ListMyOrders(ctx context.Context, userID int64, page, limit int, status string) ([]dto.OrderResponse, int64, error)
	GetMyOrderDetail(ctx context.Context, userID, orderID int64) (*dto.OrderResponse, error)
	CancelMyOrder(ctx context.Context, userID, orderID int64) (*dto.OrderResponse, error)
	AdminListOrders(ctx context.Context, filter dto.OrderFilter) ([]dto.OrderResponse, int64, error)
	AdminGetOrderDetail(ctx context.Context, orderID int64) (*dto.OrderResponse, error)
	AdminUpdateStatus(ctx context.Context, adminID, orderID int64, req dto.ChangeOrderStatusRequest) (*dto.OrderResponse, error)
}

type orderService struct {
	orderRepo         repository.OrderRepository
	cartRepo          repository.CartRepository
	productRepo       repository.ProductRepository
	stockMovementRepo repository.StockMovementRepository
	txManager         database.TxManager
	cfg               *config.Config
}

func NewOrderService(
	orderRepo repository.OrderRepository,
	cartRepo repository.CartRepository,
	productRepo repository.ProductRepository,
	stockMovementRepo repository.StockMovementRepository,
	txManager database.TxManager,
	cfg *config.Config,
) OrderService {
	return &orderService{
		orderRepo:         orderRepo,
		cartRepo:          cartRepo,
		productRepo:       productRepo,
		stockMovementRepo: stockMovementRepo,
		txManager:         txManager,
		cfg:               cfg,
	}
}

func (s *orderService) Checkout(ctx context.Context, userID int64, idempotencyKey string, req dto.CheckoutRequest) (*dto.OrderResponse, error) {
	// 1. Idempotency Check (FR-7.2)
	if idempotencyKey != "" {
		existingOrder, err := s.orderRepo.FindByIdempotencyKey(ctx, userID, idempotencyKey)
		if err == nil && existingOrder != nil {
			// Check if placed within 24 hours
			if time.Since(existingOrder.PlacedAt) < 24*time.Hour {
				return s.toOrderResponse(existingOrder), nil
			}
		}
	}

	var createdOrder *models.Order

	err := s.txManager.WithTx(ctx, func(txCtx context.Context) error {
		// 1. Load user's cart
		cart, err := s.cartRepo.FindWithItems(txCtx, userID)
		if err != nil {
			return apperror.ErrInternal
		}

		if len(cart.Items) == 0 {
			return apperror.ErrCartEmpty
		}

		// 2. Validate products and sort ascending product_id to prevent deadlock (Section 5.2)
		items := make([]models.CartItem, len(cart.Items))
		copy(items, cart.Items)
		sort.Slice(items, func(i, j int) bool {
			return items[i].ProductID < items[j].ProductID
		})

		var subtotal int64
		orderItemsToCreate := make([]models.OrderItem, 0, len(items))

		for _, item := range items {
			product, err := s.productRepo.FindByID(txCtx, item.ProductID)
			if err != nil {
				if errors.Is(err, gorm.ErrRecordNotFound) {
					return apperror.ErrProductUnavailable
				}
				return apperror.ErrInternal
			}

			if product.Status != models.ProductStatusActive || product.DeletedAt.Valid {
				return apperror.ErrProductUnavailable
			}

			// 3. Conditional stock decrement (Section 5.2)
			decremented, err := s.productRepo.DecrementStock(txCtx, product.ID, item.Quantity)
			if err != nil {
				return apperror.ErrInternal
			}
			if !decremented {
				return apperror.New(409, "INSUFFICIENT_STOCK", fmt.Sprintf("Insufficient stock for product: %s", product.Name))
			}

			lineTotal := product.Price * int64(item.Quantity)
			subtotal += lineTotal

			orderItemsToCreate = append(orderItemsToCreate, models.OrderItem{
				ProductID:   product.ID,
				ProductName: product.Name,
				SKU:         product.SKU,
				UnitPrice:   product.Price,
				Quantity:    item.Quantity,
				LineTotal:   lineTotal,
			})
		}

		// 4. Create Order
		orderNumber := generateOrderNumber()
		shippingFee := s.cfg.DefaultShippingFee
		totalAmount := subtotal + shippingFee

		addrJSON, err := json.Marshal(req.ShippingAddress)
		if err != nil {
			return apperror.ErrBadRequest
		}

		var idKey *string
		if idempotencyKey != "" {
			idKey = &idempotencyKey
		}

		order := &models.Order{
			OrderNumber:     orderNumber,
			UserID:          userID,
			Status:          models.OrderStatusPending,
			Subtotal:        subtotal,
			ShippingFee:     shippingFee,
			TotalAmount:     totalAmount,
			Currency:        s.cfg.DefaultCurrency,
			ShippingAddress: string(addrJSON),
			Note:            req.Note,
			IdempotencyKey:  idKey,
			PlacedAt:        time.Now(),
		}

		if err := s.orderRepo.Create(txCtx, order); err != nil {
			return apperror.ErrInternal
		}

		// 5. Create Order Items
		for i := range orderItemsToCreate {
			orderItemsToCreate[i].OrderID = order.ID
		}
		if err := s.orderRepo.CreateItems(txCtx, orderItemsToCreate); err != nil {
			return apperror.ErrInternal
		}

		// 6. Create Order Status History & Stock Movements
		history := &models.OrderStatusHistory{
			OrderID:   order.ID,
			ToStatus:  models.OrderStatusPending,
			ChangedBy: &userID,
			Note:      stringPtr("Order created"),
		}
		if err := s.orderRepo.CreateStatusHistory(txCtx, history); err != nil {
			return apperror.ErrInternal
		}

		for _, oi := range orderItemsToCreate {
			movement := &models.StockMovement{
				ProductID: oi.ProductID,
				Change:    -oi.Quantity,
				Reason:    models.StockReasonOrder,
				OrderID:   &order.ID,
				CreatedBy: &userID,
			}
			if err := s.stockMovementRepo.Create(txCtx, movement); err != nil {
				return apperror.ErrInternal
			}
		}

		// 7. Clear cart items
		if err := s.cartRepo.ClearCart(txCtx, cart.ID); err != nil {
			return apperror.ErrInternal
		}

		order.Items = orderItemsToCreate
		order.StatusHistory = []models.OrderStatusHistory{*history}
		createdOrder = order
		return nil
	})

	if err != nil {
		if appErr, ok := err.(*apperror.AppError); ok {
			return nil, appErr
		}
		return nil, apperror.ErrInternal
	}

	return s.toOrderResponse(createdOrder), nil
}

func (s *orderService) ListMyOrders(ctx context.Context, userID int64, page, limit int, status string) ([]dto.OrderResponse, int64, error) {
	filter := dto.OrderFilter{
		UserID: &userID,
		Status: status,
		Page:   page,
		Limit:  limit,
	}

	orders, total, err := s.orderRepo.List(ctx, filter)
	if err != nil {
		return nil, 0, apperror.ErrInternal
	}

	res := make([]dto.OrderResponse, len(orders))
	for i, o := range orders {
		res[i] = *s.toOrderResponse(&o)
	}

	return res, total, nil
}

func (s *orderService) GetMyOrderDetail(ctx context.Context, userID, orderID int64) (*dto.OrderResponse, error) {
	order, err := s.orderRepo.FindByID(ctx, orderID)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, apperror.ErrOrderNotFound
		}
		return nil, apperror.ErrInternal
	}

	// NFR-3: If another user's order, return 404, not 403
	if order.UserID != userID {
		return nil, apperror.ErrOrderNotFound
	}

	return s.toOrderResponse(order), nil
}

func (s *orderService) CancelMyOrder(ctx context.Context, userID, orderID int64) (*dto.OrderResponse, error) {
	var updatedOrder *models.Order

	err := s.txManager.WithTx(ctx, func(txCtx context.Context) error {
		order, err := s.orderRepo.FindByID(txCtx, orderID)
		if err != nil {
			if errors.Is(err, gorm.ErrRecordNotFound) {
				return apperror.ErrOrderNotFound
			}
			return apperror.ErrInternal
		}

		if order.UserID != userID {
			return apperror.ErrOrderNotFound
		}

		// FR-7.5: Only when PENDING
		if order.Status != models.OrderStatusPending {
			return apperror.New(409, "INVALID_STATUS_TRANSITION", "Only PENDING orders can be cancelled by customer")
		}

		// Update order status to CANCELLED
		if err := s.orderRepo.UpdateStatus(txCtx, order.ID, models.OrderStatusCancelled); err != nil {
			return apperror.ErrInternal
		}

		// Restore stock for every item in same transaction (Section 5.2)
		for _, item := range order.Items {
			if err := s.productRepo.IncrementStock(txCtx, item.ProductID, item.Quantity); err != nil {
				return apperror.ErrInternal
			}

			// Stock movement
			movement := &models.StockMovement{
				ProductID: item.ProductID,
				Change:    item.Quantity,
				Reason:    models.StockReasonCancel,
				OrderID:   &order.ID,
				CreatedBy: &userID,
			}
			if err := s.stockMovementRepo.Create(txCtx, movement); err != nil {
				return apperror.ErrInternal
			}
		}

		// Order status history
		history := &models.OrderStatusHistory{
			OrderID:    order.ID,
			FromStatus: &order.Status,
			ToStatus:   models.OrderStatusCancelled,
			ChangedBy:  &userID,
			Note:       stringPtr("Order cancelled by customer"),
		}
		if err := s.orderRepo.CreateStatusHistory(txCtx, history); err != nil {
			return apperror.ErrInternal
		}

		order.Status = models.OrderStatusCancelled
		order.StatusHistory = append(order.StatusHistory, *history)
		updatedOrder = order
		return nil
	})

	if err != nil {
		if appErr, ok := err.(*apperror.AppError); ok {
			return nil, appErr
		}
		return nil, apperror.ErrInternal
	}

	return s.toOrderResponse(updatedOrder), nil
}

func (s *orderService) AdminListOrders(ctx context.Context, filter dto.OrderFilter) ([]dto.OrderResponse, int64, error) {
	orders, total, err := s.orderRepo.List(ctx, filter)
	if err != nil {
		return nil, 0, apperror.ErrInternal
	}

	res := make([]dto.OrderResponse, len(orders))
	for i, o := range orders {
		res[i] = *s.toOrderResponse(&o)
	}

	return res, total, nil
}

func (s *orderService) AdminGetOrderDetail(ctx context.Context, orderID int64) (*dto.OrderResponse, error) {
	order, err := s.orderRepo.FindByID(ctx, orderID)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, apperror.ErrOrderNotFound
		}
		return nil, apperror.ErrInternal
	}

	return s.toOrderResponse(order), nil
}

func (s *orderService) AdminUpdateStatus(ctx context.Context, adminID, orderID int64, req dto.ChangeOrderStatusRequest) (*dto.OrderResponse, error) {
	var updatedOrder *models.Order

	err := s.txManager.WithTx(ctx, func(txCtx context.Context) error {
		order, err := s.orderRepo.FindByID(txCtx, orderID)
		if err != nil {
			if errors.Is(err, gorm.ErrRecordNotFound) {
				return apperror.ErrOrderNotFound
			}
			return apperror.ErrInternal
		}

		// Validate state machine transition (Section 5.5)
		if !isValidStatusTransition(order.Status, req.Status) {
			return apperror.ErrInvalidStatusTransition
		}

		if err := s.orderRepo.UpdateStatus(txCtx, order.ID, req.Status); err != nil {
			return apperror.ErrInternal
		}

		// If moving to CANCELLED, restore stock
		if req.Status == models.OrderStatusCancelled {
			for _, item := range order.Items {
				if err := s.productRepo.IncrementStock(txCtx, item.ProductID, item.Quantity); err != nil {
					return apperror.ErrInternal
				}

				movement := &models.StockMovement{
					ProductID: item.ProductID,
					Change:    item.Quantity,
					Reason:    models.StockReasonCancel,
					OrderID:   &order.ID,
					CreatedBy: &adminID,
				}
				if err := s.stockMovementRepo.Create(txCtx, movement); err != nil {
					return apperror.ErrInternal
				}
			}
		}

		// Write status history
		history := &models.OrderStatusHistory{
			OrderID:    order.ID,
			FromStatus: &order.Status,
			ToStatus:   req.Status,
			ChangedBy:  &adminID,
			Note:       req.Note,
		}
		if err := s.orderRepo.CreateStatusHistory(txCtx, history); err != nil {
			return apperror.ErrInternal
		}

		order.Status = req.Status
		order.StatusHistory = append(order.StatusHistory, *history)
		updatedOrder = order
		return nil
	})

	if err != nil {
		if appErr, ok := err.(*apperror.AppError); ok {
			return nil, appErr
		}
		return nil, apperror.ErrInternal
	}

	return s.toOrderResponse(updatedOrder), nil
}

// State machine validation according to PRD Section 5.5
func isValidStatusTransition(current, next string) bool {
	switch current {
	case models.OrderStatusPending:
		return next == models.OrderStatusConfirmed || next == models.OrderStatusCancelled
	case models.OrderStatusConfirmed:
		return next == models.OrderStatusProcessing || next == models.OrderStatusCancelled
	case models.OrderStatusProcessing:
		return next == models.OrderStatusShipped || next == models.OrderStatusCancelled
	case models.OrderStatusShipped:
		return next == models.OrderStatusDelivered
	default:
		// DELIVERED and CANCELLED are terminal
		return false
	}
}

func (s *orderService) toOrderResponse(o *models.Order) *dto.OrderResponse {
	var address dto.ShippingAddressDTO
	_ = json.Unmarshal([]byte(o.ShippingAddress), &address)

	items := make([]dto.OrderItemResponse, len(o.Items))
	for i, item := range o.Items {
		items[i] = dto.OrderItemResponse{
			ID:          item.ID,
			ProductID:   item.ProductID,
			ProductName: item.ProductName,
			SKU:         item.SKU,
			UnitPrice:   item.UnitPrice,
			Quantity:    item.Quantity,
			LineTotal:   item.LineTotal,
		}
	}

	history := make([]dto.OrderStatusHistoryResponse, len(o.StatusHistory))
	for i, h := range o.StatusHistory {
		history[i] = dto.OrderStatusHistoryResponse{
			ID:         h.ID,
			FromStatus: h.FromStatus,
			ToStatus:   h.ToStatus,
			ChangedBy:  h.ChangedBy,
			Note:       h.Note,
			CreatedAt:  h.CreatedAt,
		}
	}

	return &dto.OrderResponse{
		ID:              o.ID,
		OrderNumber:     o.OrderNumber,
		UserID:          o.UserID,
		Status:          o.Status,
		Subtotal:        o.Subtotal,
		ShippingFee:     o.ShippingFee,
		TotalAmount:     o.TotalAmount,
		Currency:        o.Currency,
		ShippingAddress: address,
		Note:            o.Note,
		PlacedAt:        o.PlacedAt,
		CreatedAt:       o.CreatedAt,
		Items:           items,
		StatusHistory:   history,
	}
}

func generateOrderNumber() string {
	now := time.Now()
	return fmt.Sprintf("ORD-%s-%06d", now.Format("20060102"), now.UnixNano()%1000000)
}

func stringPtr(s string) *string {
	return &s
}
