package service

import (
	"context"
	"errors"
	"time"

	"ecommerce-api/internal/dto"
	"ecommerce-api/internal/models"
	"ecommerce-api/internal/pkg/apperror"
	"ecommerce-api/internal/pkg/hash"
	"ecommerce-api/internal/pkg/jwt"
	"ecommerce-api/internal/repository"

	"gorm.io/gorm"
)

type AuthService interface {
	Register(ctx context.Context, req dto.RegisterRequest) (*dto.UserResponse, error)
	Login(ctx context.Context, req dto.LoginRequest) (*dto.TokenResponse, error)
	RefreshToken(ctx context.Context, req dto.RefreshTokenRequest) (*dto.TokenResponse, error)
	Logout(ctx context.Context, req dto.LogoutRequest) error
}

type authService struct {
	userRepo  repository.UserRepository
	tokenRepo repository.TokenRepository
	cartRepo  repository.CartRepository
	jwtMgr    *jwt.TokenManager
}

func NewAuthService(
	userRepo repository.UserRepository,
	tokenRepo repository.TokenRepository,
	cartRepo repository.CartRepository,
	jwtMgr *jwt.TokenManager,
) AuthService {
	return &authService{
		userRepo:  userRepo,
		tokenRepo: tokenRepo,
		cartRepo:  cartRepo,
		jwtMgr:    jwtMgr,
	}
}

func (s *authService) Register(ctx context.Context, req dto.RegisterRequest) (*dto.UserResponse, error) {
	// Check existing email
	existing, err := s.userRepo.FindByEmail(ctx, req.Email)
	if err != nil && !errors.Is(err, gorm.ErrRecordNotFound) {
		return nil, apperror.ErrInternal
	}
	if existing != nil {
		return nil, apperror.ErrEmailAlreadyExists
	}

	// Hash password (bcrypt cost 12)
	hashedPassword, err := hash.HashPassword(req.Password)
	if err != nil {
		return nil, apperror.ErrInternal
	}

	user := &models.User{
		Name:         req.Name,
		Email:        req.Email,
		PasswordHash: hashedPassword,
		Phone:        req.Phone,
		Role:         models.RoleCustomer,
		IsActive:     true,
	}

	if err := s.userRepo.Create(ctx, user); err != nil {
		return nil, apperror.ErrInternal
	}

	// Auto-create cart for customer
	_, _ = s.cartRepo.FindOrCreateByUserID(ctx, user.ID)

	return &dto.UserResponse{
		ID:        user.ID,
		Name:      user.Name,
		Email:     user.Email,
		Phone:     user.Phone,
		Role:      user.Role,
		IsActive:  user.IsActive,
		CreatedAt: user.CreatedAt,
	}, nil
}

func (s *authService) Login(ctx context.Context, req dto.LoginRequest) (*dto.TokenResponse, error) {
	user, err := s.userRepo.FindByEmail(ctx, req.Email)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			// Don't leak if email exists or not
			return nil, apperror.ErrInvalidCredentials
		}
		return nil, apperror.ErrInternal
	}

	// Check password
	if !hash.CheckPassword(req.Password, user.PasswordHash) {
		return nil, apperror.ErrInvalidCredentials
	}

	// Check if active
	if !user.IsActive {
		return nil, apperror.ErrUserInactive
	}

	return s.generateTokenPair(ctx, user)
}

func (s *authService) RefreshToken(ctx context.Context, req dto.RefreshTokenRequest) (*dto.TokenResponse, error) {
	rawToken := req.RefreshToken
	tokenHash := hash.HashToken(rawToken)

	tokenRecord, err := s.tokenRepo.FindByHash(ctx, tokenHash)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, apperror.ErrUnauthorized
		}
		return nil, apperror.ErrInternal
	}

	// Check if revoked or expired
	if tokenRecord.RevokedAt != nil || time.Now().After(tokenRecord.ExpiresAt) {
		return nil, apperror.ErrUnauthorized
	}

	// Revoke current refresh token (rotation)
	if err := s.tokenRepo.Revoke(ctx, tokenHash); err != nil {
		return nil, apperror.ErrInternal
	}

	// Fetch user
	user, err := s.userRepo.FindByID(ctx, tokenRecord.UserID)
	if err != nil {
		return nil, apperror.ErrUnauthorized
	}

	if !user.IsActive {
		return nil, apperror.ErrUserInactive
	}

	return s.generateTokenPair(ctx, user)
}

func (s *authService) Logout(ctx context.Context, req dto.LogoutRequest) error {
	tokenHash := hash.HashToken(req.RefreshToken)
	_ = s.tokenRepo.Revoke(ctx, tokenHash)
	return nil
}

func (s *authService) generateTokenPair(ctx context.Context, user *models.User) (*dto.TokenResponse, error) {
	// Access token
	accessToken, err := s.jwtMgr.GenerateAccessToken(user.ID, user.Role)
	if err != nil {
		return nil, apperror.ErrInternal
	}

	// Refresh token
	rawRefreshToken, err := hash.GenerateRandomToken()
	if err != nil {
		return nil, apperror.ErrInternal
	}

	tokenHash := hash.HashToken(rawRefreshToken)
	refreshTokenRecord := &models.RefreshToken{
		UserID:    user.ID,
		TokenHash: tokenHash,
		ExpiresAt: time.Now().Add(s.jwtMgr.RefreshExpiry()),
	}

	if err := s.tokenRepo.Create(ctx, refreshTokenRecord); err != nil {
		return nil, apperror.ErrInternal
	}

	return &dto.TokenResponse{
		AccessToken:  accessToken,
		RefreshToken: rawRefreshToken,
		TokenType:    "Bearer",
		ExpiresIn:    int(s.jwtMgr.AccessExpiry().Seconds()),
	}, nil
}
