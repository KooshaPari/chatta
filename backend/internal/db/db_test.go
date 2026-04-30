package db

import (
	"chatta/backend/models"
	"os"
	"testing"
)

// TestInitDB tests database initialization and migrations.
// Traces to: FR-CHATTA-001
func TestInitDB(t *testing.T) {
	// Use test database
	testDB := "test_stores.db"
	defer os.Remove(testDB)

	// Temporarily override DB file path
	originalDB := DB
	defer func() { DB = originalDB }()

	// Initialize test DB
	err := InitDB()
	if err != nil {
		t.Fatalf("InitDB failed: %v", err)
	}

	if DB == nil {
		t.Error("Database connection is nil")
	}

	// Verify tables were created
	if !DB.Migrator().HasTable(&models.User{}) {
		t.Error("User table not created")
	}
	if !DB.Migrator().HasTable(&models.Message{}) {
		t.Error("Message table not created")
	}
	if !DB.Migrator().HasTable(&models.Chat{}) {
		t.Error("Chat table not created")
	}
}
