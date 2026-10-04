package repository

import (
	"context"
	"time"

	"ecommerce-api/internal/database"
	"ecommerce-api/internal/models"

	"gorm.io/gorm"
)

type TokenRepository interface {
	Create(ctx context.Context, token *models.RefreshToken) error
	FindByHash(ctx context.Context, tokenHash string) (*models.RefreshToken, error)
	Revoke(ctx context.Context, tokenHash string) error
	RevokeAllForUser(ctx context.Context, userID int64) error
}

type tokenRepository struct {
	db *gorm.DB
}

func NewTokenRepository(db *gorm.DB) TokenRepository {
	return &tokenRepository{db: db}
}

func (r *tokenRepository) getDB(ctx context.Context) *gorm.DB {
	return database.GetDB(ctx, r.db)
}

func (r *tokenRepository) Create(ctx context.Context, token *models.RefreshToken) error {
	return r.getDB(ctx).Create(token).Error
}

func (r *tokenRepository) FindByHash(ctx context.Context, tokenHash string) (*models.RefreshToken, error) {
	var token models.RefreshToken
	err := r.getDB(ctx).Where("token_hash = ?", tokenHash).First(&token).Error
	if err != nil {
		return nil, err
	}
	return &token, nil
}

func (r *tokenRepository) Revoke(ctx context.Context, tokenHash string) error {
	now := time.Now()
	return r.getDB(ctx).Model(&models.RefreshToken{}).
		Where("token_hash = ? AND revoked_at IS NULL", tokenHash).
		Update("revoked_at", now).Error
}

func (r *tokenRepository) RevokeAllForUser(ctx context.Context, userID int64) error {
	now := time.Now()
	return r.getDB(ctx).Model(&models.RefreshToken{}).
		Where("user_id = ? AND revoked_at IS NULL", userID).
		Update("revoked_at", now).Error
}
