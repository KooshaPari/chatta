package models

import (
	"time"
)
type Message struct {
	UUID string `gorm:"primaryKey" json:"uuid"`
	Channel string `gorm:"foreignKey:UUID;references:models.Chat"`
	Content string `json:"content"`
	SentAt time.Time `json:"sentAt"`
	Edited bool `json:"edited"`
	Deleted bool `json:"deleted"`
	SenderID string `gorm:"foreignKey:UUID;references:models.User"`
	Sender    User      `gorm:"foreignKey:SenderID" json:"sender"`


}