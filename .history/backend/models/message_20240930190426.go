package models
import (
	"time"
)
type Message struct {
	UUID string `gorm:"primaryKey" json:"id"`
	Content string `json:"content"`
	Sent_At time.Time `json:"sentAt"`
	Edited bool `json:"edited"`

}
