package models

import (
	"time"
)
type Message struct {
	UUID string `gorm:"primaryKey" json:"id"`
	Content string `json:"content"`
	Sent_At time.Time `json:"sentAt"`
	Edited bool `json:"edited"`
	SenderID string `gorm:"foreignKey:UUID;references:models.User"`
	Sender    User      `gorm:"foreignKey:SenderID" json:"sender"`

}
type Message struct {
    UUID      string    `gorm:"primaryKey" json:"uuid"`
    Content   string    `json:"content"`
    SentAt    time.Time `json:"sent_at"`
    Edited    bool      `json:"edited"`
    SenderID  string    `json:"sender_id"`
   
}