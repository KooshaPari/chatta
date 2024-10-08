package models

import "github.com/google/uuid"

type chat struct {
	uuid
	ChatID string `json:"chatID"`
}