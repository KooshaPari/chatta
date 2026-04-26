package db

import (
	"chatta/backend/models"
	"log"

	"gorm.io/driver/sqlite"
	"gorm.io/gorm"
)

var DB *gorm.DB

// InitDB initializes the database connection and runs migrations.
// Traces to: FR-CHATTA-001
func InitDB() error {
	var err error
	DB, err = gorm.Open(sqlite.Open("stores.db"), &gorm.Config{})
	if err != nil {
		log.Fatal("FATAL ERR AT: Database Connection: ", err)
	}
	err = DB.AutoMigrate(&models.User{}, &models.Message{}, &models.Chat{})
	if err != nil {
		return err
	}
	log.Println("Connected to DB.")
	return nil
}
