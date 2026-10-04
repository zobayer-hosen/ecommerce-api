package config

import (
	"fmt"
	"os"
	"strconv"
	"strings"

	"github.com/joho/godotenv"
)

type Config struct {
	Port                     string
	Env                      string
	DBHost                   string
	DBPort                   string
	DBUser                   string
	DBPassword               string
	DBName                   string
	DBSSLMode                string
	JWTSecret                string
	JWTAccessDurationMinutes int
	JWTRefreshDurationDays   int
	DefaultCurrency          string
	DefaultShippingFee       int64
	CORSAllowedOrigins       []string
	AdminEmail               string
	AdminPassword            string
	AdminName                string
}

func LoadConfig() (*Config, error) {
	// Attempt to load .env, ignore if missing
	_ = godotenv.Load()

	cfg := &Config{
		Port:                     getEnv("PORT", "8080"),
		Env:                      getEnv("ENV", "development"),
		DBHost:                   getEnv("DB_HOST", "localhost"),
		DBPort:                   getEnv("DB_PORT", "5432"),
		DBUser:                   getEnv("DB_USER", "postgres"),
		DBPassword:               getEnv("DB_PASSWORD", "12345"),
		DBName:                   getEnv("DB_NAME", "ecommerce_db"),
		DBSSLMode:                getEnv("DB_SSLMODE", "disable"),
		JWTSecret:                getEnv("JWT_SECRET", "super-secret-jwt-key-for-ecommerce-api"),
		JWTAccessDurationMinutes: getEnvAsInt("JWT_ACCESS_DURATION_MINUTES", 15),
		JWTRefreshDurationDays:   getEnvAsInt("JWT_REFRESH_DURATION_DAYS", 7),
		DefaultCurrency:          getEnv("DEFAULT_CURRENCY", "BDT"),
		DefaultShippingFee:       int64(getEnvAsInt("DEFAULT_SHIPPING_FEE", 0)),
		AdminEmail:               getEnv("ADMIN_EMAIL", "admin@ecommerce.com"),
		AdminPassword:            getEnv("ADMIN_PASSWORD", "Admin12345!"),
		AdminName:                getEnv("ADMIN_NAME", "System Administrator"),
	}

	origins := getEnv("CORS_ALLOWED_ORIGINS", "*")
	if origins == "*" {
		cfg.CORSAllowedOrigins = []string{"*"}
	} else {
		for _, o := range strings.Split(origins, ",") {
			trimmed := strings.TrimSpace(o)
			if trimmed != "" {
				cfg.CORSAllowedOrigins = append(cfg.CORSAllowedOrigins, trimmed)
			}
		}
	}

	if cfg.JWTSecret == "" {
		return nil, fmt.Errorf("JWT_SECRET must be set")
	}
	if cfg.DBName == "" {
		return nil, fmt.Errorf("DB_NAME must be set")
	}

	return cfg, nil
}

func (c *Config) DSN() string {
	return fmt.Sprintf("host=%s port=%s user=%s password=%s dbname=%s sslmode=%s",
		c.DBHost, c.DBPort, c.DBUser, c.DBPassword, c.DBName, c.DBSSLMode)
}

func getEnv(key, defaultVal string) string {
	if val, ok := os.LookupEnv(key); ok && val != "" {
		return val
	}
	return defaultVal
}

func getEnvAsInt(key string, defaultVal int) int {
	if valStr, ok := os.LookupEnv(key); ok {
		if val, err := strconv.Atoi(valStr); err == nil {
			return val
		}
	}
	return defaultVal
}
