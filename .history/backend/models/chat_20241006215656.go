package models

type Chat struct {
	UUID string `gorm:"primaryKey" json:"uuid"`
	Messages []Message `json:"messages"`
}