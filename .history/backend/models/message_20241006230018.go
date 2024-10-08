package models

import (
	"time"
)
type Message struct {
	UUID string `gorm:"primaryKey" json:"uuid"`
	Channel   string    `gorm:"not null" json:"channel"`
	Content string `json:"content"`
	SentAt time.Time `json:"sentAt"`
	Edited bool `json:"edited"`
	Deleted bool `json:"deleted"`
	SenderID string `gorm:"foreignKey:UUID;references:models.User"`
	Sender    User      `gorm:"foreignKey:SenderID" json:"sender"`

}type Message struct {
    UUID      string    `gorm:"primaryKey" json:"uuid"`
    Channel   string    `gorm:"not null" json:"channel"` // Chat UUID
    Content   string    `json:"content"`
    SentAt    time.Time `json:"sentAt"`
    Edited    bool      `json:"edited"`
    Deleted   bool      `json:"deleted"`
    SenderID  string    `gorm:"not null" json:"senderId"` // User UUID
    Sender    User      `gorm:"foreignKey:SenderID" json:"sender"`
}