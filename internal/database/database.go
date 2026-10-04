package database

import (
	"database/sql"
	"fmt"
	"log"
	"time"

	"ecommerce-api/internal/config"

	"github.com/golang-migrate/migrate/v4"
	"github.com/golang-migrate/migrate/v4/database/postgres"
	_ "github.com/golang-migrate/migrate/v4/source/file"
	gormPostgres "gorm.io/driver/postgres"
	"gorm.io/gorm"
	"gorm.io/gorm/logger"
)

type DB struct {
	GORM *gorm.DB
	SQL  *sql.DB
}

func Connect(cfg *config.Config) (*DB, error) {
	gormLogLevel := logger.Warn
	if cfg.Env == "development" {
		gormLogLevel = logger.Info
	}

	gormDB, err := gorm.Open(gormPostgres.Open(cfg.DSN()), &gorm.Config{
		Logger: logger.Default.LogMode(gormLogLevel),
	})
	if err != nil {
		return nil, fmt.Errorf("failed to connect to database: %w", err)
	}

	sqlDB, err := gormDB.DB()
	if err != nil {
		return nil, fmt.Errorf("failed to get sql.DB handle: %w", err)
	}

	// Connection pool settings according to NFR-8
	sqlDB.SetMaxOpenConns(25)
	sqlDB.SetMaxIdleConns(10)
	sqlDB.SetConnMaxLifetime(1 * time.Hour)
	sqlDB.SetConnMaxIdleTime(15 * time.Minute)

	if err := sqlDB.Ping(); err != nil {
		return nil, fmt.Errorf("database ping failed: %w", err)
	}

	return &DB{
		GORM: gormDB,
		SQL:  sqlDB,
	}, nil
}

// RunMigrations applies database migrations using golang-migrate
func (db *DB) RunMigrations(migrationsPath string) error {
	driver, err := postgres.WithInstance(db.SQL, &postgres.Config{})
	if err != nil {
		return fmt.Errorf("could not create postgres migration driver: %w", err)
	}

	m, err := migrate.NewWithDatabaseInstance(
		fmt.Sprintf("file://%s", migrationsPath),
		"postgres",
		driver,
	)
	if err != nil {
		return fmt.Errorf("could not create migration instance: %w", err)
	}

	if err := m.Up(); err != nil && err != migrate.ErrNoChange {
		return fmt.Errorf("migration up failed: %w", err)
	}

	log.Println("Database migrations applied successfully")
	return nil
}
