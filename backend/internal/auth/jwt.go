package auth

import (
	"fmt"
	"os"
	"time"

	"github.com/golang-jwt/jwt/v4"
)

var jwtKey []byte

// InitJWT initializes the JWT secret from environment or fails loud.
// Traces to: FR-CHATTA-002
func InitJWT() error {
	secret := os.Getenv("JWT_SECRET")
	if secret == "" {
		return fmt.Errorf("JWT_SECRET environment variable is not set")
	}
	jwtKey = []byte(secret)
	return nil
}

// GenerateToken creates a JWT token for a user.
func GenerateToken(username string) (string, error) {
	expirationTime := time.Now().Add(5 * time.Minute)
	claims := &jwt.RegisteredClaims{
		Subject:   username,
		ExpiresAt: jwt.NewNumericDate(expirationTime),
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	tokenString, err := token.SignedString(jwtKey)
	if err != nil {
		return "", err
	}
	return tokenString, nil
}

// VerifyToken parses and validates a JWT token, returning the username.
func VerifyToken(tokenString string) (string, error) {
	token, err := jwt.Parse(tokenString, func(token *jwt.Token) (interface{}, error) {
		return jwtKey, nil
	})

	if err != nil {
		return "", err
	}

	if claims, ok := token.Claims.(jwt.MapClaims); ok && token.Valid {
		return claims["sub"].(string), nil
	}

	return "", fmt.Errorf("invalid token")
}
