package database

import (
	"context"

	"gorm.io/gorm"
)

type txContextKey struct{}

type TxManager interface {
	WithTx(ctx context.Context, fn func(txCtx context.Context) error) error
}

type gormTxManager struct {
	db *gorm.DB
}

func NewTxManager(db *gorm.DB) TxManager {
	return &gormTxManager{db: db}
}

func (m *gormTxManager) WithTx(ctx context.Context, fn func(txCtx context.Context) error) error {
	return m.db.WithContext(ctx).Transaction(func(tx *gorm.DB) error {
		txCtx := context.WithValue(ctx, txContextKey{}, tx)
		return fn(txCtx)
	})
}

// GetDB returns the active transaction from context if one exists; otherwise, returns the fallback DB.
func GetDB(ctx context.Context, fallback *gorm.DB) *gorm.DB {
	if tx, ok := ctx.Value(txContextKey{}).(*gorm.DB); ok && tx != nil {
		return tx.WithContext(ctx)
	}
	return fallback.WithContext(ctx)
}
