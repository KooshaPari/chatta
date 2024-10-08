package models

type Chat struct {
	UUID string `gorm:"primaryKey" json:"uuid"`
	Name string `json:"name"`
	
	Messages []Message `json:"messages"`
}