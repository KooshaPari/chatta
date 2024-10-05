package models
type User struct {
	Username string `json:"username"`
	Password string `json:"password"`
	UUID string `gorm:"primaryKey" json:"id"`
	Messages []Message `gorm:"foreignKey:SenderID;references:UUID"`
}

