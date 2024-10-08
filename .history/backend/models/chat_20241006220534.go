package models

type Chat struct {
	UUID string `gorm:"primaryKey" json:"uuid"`
	Name string `json:"name"`
	Users []User `json:"users"`
	Messages []Message `json:"messages"`
}