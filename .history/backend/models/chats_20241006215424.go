package models

type chat struct {
	UUID string `gorm:"primaryKey" json:"uuid"`
}