package auth

import (
	"os"
	"testing"
)

// TestInitJWT tests JWT initialization with required env var.
// Traces to: FR-CHATTA-002
func TestInitJWT(t *testing.T) {
	// Save original env
	original := os.Getenv("JWT_SECRET")
	defer func() {
		if original != "" {
			os.Setenv("JWT_SECRET", original)
		} else {
			os.Unsetenv("JWT_SECRET")
		}
	}()

	// Test missing env var
	os.Unsetenv("JWT_SECRET")
	err := InitJWT()
	if err == nil {
		t.Error("Expected error when JWT_SECRET is not set, got nil")
	}

	// Test with valid env var
	os.Setenv("JWT_SECRET", "test-secret-key-12345")
	err = InitJWT()
	if err != nil {
		t.Errorf("InitJWT failed with valid env var: %v", err)
	}

	// Verify token generation works
	token, err := GenerateToken("testuser")
	if err != nil {
		t.Errorf("GenerateToken failed: %v", err)
	}
	if token == "" {
		t.Error("GenerateToken returned empty token")
	}

	// Verify token validation works
	username, err := VerifyToken(token)
	if err != nil {
		t.Errorf("VerifyToken failed: %v", err)
	}
	if username != "testuser" {
		t.Errorf("Expected username 'testuser', got '%s'", username)
	}
}

// TestGenerateAndVerifyToken tests token generation and verification.
// Traces to: FR-CHATTA-002
func TestGenerateAndVerifyToken(t *testing.T) {
	os.Setenv("JWT_SECRET", "test-secret-key-12345")
	InitJWT()

	username := "alice"
	token, err := GenerateToken(username)
	if err != nil {
		t.Fatalf("GenerateToken failed: %v", err)
	}

	verified, err := VerifyToken(token)
	if err != nil {
		t.Fatalf("VerifyToken failed: %v", err)
	}

	if verified != username {
		t.Errorf("Expected '%s', got '%s'", username, verified)
	}
}

// TestInvalidToken tests invalid token rejection.
// Traces to: FR-CHATTA-002
func TestInvalidToken(t *testing.T) {
	os.Setenv("JWT_SECRET", "test-secret-key-12345")
	InitJWT()

	_, err := VerifyToken("invalid.token.string")
	if err == nil {
		t.Error("Expected error for invalid token, got nil")
	}
}
