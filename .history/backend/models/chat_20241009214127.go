package models

type Chat struct {
	UUID string `gorm:"primaryKey" json:"uuid"`
	Name string `json:"name"`
	Type string `json:"type"`
	Messages []Message `gorm:"foreignKey:Channel;references:UUID" json:"messages"`
	DMUsers
}
