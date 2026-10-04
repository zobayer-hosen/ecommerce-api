package service

import (
	"context"
	"errors"

	"ecommerce-api/internal/dto"
	"ecommerce-api/internal/models"
	"ecommerce-api/internal/pkg/apperror"
	"ecommerce-api/internal/pkg/hash"
	"ecommerce-api/internal/repository"

	"gorm.io/gorm"
)

type UserService interface {
	GetProfile(ctx context.Context, userID int64) (*dto.UserResponse, error)
	UpdateProfile(ctx context.Context, userID int64, req dto.UpdateProfileRequest) (*dto.UserResponse, error)
	ChangePassword(ctx context.Context, userID int64, req dto.ChangePasswordRequest) error
	AdminListUsers(ctx context.Context, page, limit int, search string) ([]dto.UserResponse, int64, error)
	AdminUpdateUser(ctx context.Context, targetUserID int64, req dto.AdminUpdateUserRequest) (*dto.UserResponse, error)
}

type userService struct {
	userRepo  repository.UserRepository
	tokenRepo repository.TokenRepository
}

func NewUserService(userRepo repository.UserRepository, tokenRepo repository.TokenRepository) UserService {
	return &userService{
		userRepo:  userRepo,
		tokenRepo: tokenRepo,
	}
}

func (s *userService) GetProfile(ctx context.Context, userID int64) (*dto.UserResponse, error) {
	user, err := s.userRepo.FindByID(ctx, userID)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, apperror.ErrUserNotFound
		}
		return nil, apperror.ErrInternal
	}

	return toUserResponse(user), nil
}

func (s *userService) UpdateProfile(ctx context.Context, userID int64, req dto.UpdateProfileRequest) (*dto.UserResponse, error) {
	user, err := s.userRepo.FindByID(ctx, userID)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, apperror.ErrUserNotFound
		}
		return nil, apperror.ErrInternal
	}

	if req.Name != nil {
		user.Name = *req.Name
	}
	if req.Phone != nil {
		user.Phone = req.Phone
	}

	if err := s.userRepo.Update(ctx, user); err != nil {
		return nil, apperror.ErrInternal
	}

	return toUserResponse(user), nil
}

func (s *userService) ChangePassword(ctx context.Context, userID int64, req dto.ChangePasswordRequest) error {
	user, err := s.userRepo.FindByID(ctx, userID)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, apperror.ErrUserNotFound
		}
		return nil, apperror.ErrInternal
	}

	if !hash.CheckPassword(req.CurrentPassword, user.PasswordHash) {
		return apperror.ErrInvalidCredentials
	}

	newHash, err := hash.HashPassword(req.NewPassword)
	if err != nil {
		return apperror.ErrInternal
	}

	user.PasswordHash = newHash
	if err := s.userRepo.Update(ctx, user); err != nil {
		return apperror.ErrInternal
	}

	// Revoke all refresh tokens of the user on password change (NFR-2 / FR-2.3)
	_ = s.tokenRepo.RevokeAllForUser(ctx, userID)

	return nil
}

func (s *userService) AdminListUsers(ctx context.Context, page, limit int, search string) ([]dto.UserResponse, int64, error) {
	users, total, err := s.userRepo.List(ctx, page, limit, search)
	if err != nil {
		return nil, 0, apperror.ErrInternal
	}

	resp := make([]dto.UserResponse, len(users))
	for i, u := range users {
		resp[i] = *toUserResponse(&u)
	}
	return resp, total, nil
}

func (s *userService) AdminUpdateUser(ctx context.Context, targetUserID int64, req dto.AdminUpdateUserRequest) (*dto.UserResponse, error) {
	user, err := s.userRepo.FindByID(ctx, targetUserID)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, apperror.ErrUserNotFound
		}
		return nil, apperror.ErrInternal
	}

	if req.Role != nil {
		user.Role = *req.Role
	}
	if req.IsActive != nil {
		user.IsActive = *req.IsActive
		// If user was deactivated, revoke all their tokens immediately
		if !user.IsActive {
			_ = s.tokenRepo.RevokeAllForUser(ctx, targetUserID)
		}
	}

	if err := s.userRepo.Update(ctx, user); err != nil {
		return nil, apperror.ErrInternal
	}

	return toUserResponse(user), nil
}

func toUserResponse(u *models.User) *dto.UserResponse {
	return &dto.UserResponse{
		ID:        u.ID,
		Name:      u.Name,
		Email:     u.Email,
		Phone:     u.Phone,
		Role:      u.Role,
		IsActive:  u.IsActive,
		CreatedAt: u.CreatedAt,
	}
}
