package jwt

import (
	"errors"
	"fmt"
	"time"

	"github.com/golang-jwt/jwt/v5"
)

type Claims struct {
	UserID int64  `json:"sub"`
	Role   string `json:"role"`
	jwt.RegisteredClaims
}

type TokenManager struct {
	secretKey     []byte
	accessExpiry  time.Duration
	refreshExpiry time.Duration
}

func NewTokenManager(secretKey string, accessMinutes, refreshDays int) *TokenManager {
	return &TokenManager{
		secretKey:     []byte(secretKey),
		accessExpiry:  time.Duration(accessMinutes) * time.Minute,
		refreshExpiry: time.Duration(refreshDays) * 24 * time.Hour,
	}
}

func (tm *TokenManager) AccessExpiry() time.Duration {
	return tm.accessExpiry
}

func (tm *TokenManager) RefreshExpiry() time.Duration {
	return tm.refreshExpiry
}

// GenerateAccessToken signs a new JWT access token with user_id and role
func (tm *TokenManager) GenerateAccessToken(userID int64, role string) (string, error) {
	now := time.Now()
	claims := Claims{
		UserID: userID,
		Role:   role,
		RegisteredClaims: jwt.RegisteredClaims{
			Subject:   fmt.Sprintf("%d", userID),
			IssuedAt:  jwt.NewNumericDate(now),
			ExpiresAt: jwt.NewNumericDate(now.Add(tm.accessExpiry)),
		},
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	return token.SignedString(tm.secretKey)
}

// ParseAccessToken validates the access token and parses its claims
func (tm *TokenManager) ParseAccessToken(tokenString string) (*Claims, error) {
	token, err := jwt.ParseWithClaims(tokenString, &Claims{}, func(token *jwt.Token) (interface{}, error) {
		if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
			return nil, fmt.Errorf("unexpected signing method: %v", token.Header["alg"])
		}
		return tm.secretKey, nil
	})

	if err != nil {
		if errors.Is(err, jwt.ErrTokenExpired) {
			return nil, jwt.ErrTokenExpired
		}
		return nil, err
	}

	claims, ok := token.Claims.(*Claims)
	if !ok || !token.Valid {
		return nil, errors.New("invalid token claims")
	}

	return claims, nil
}
