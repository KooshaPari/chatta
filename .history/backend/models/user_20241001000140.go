package models
type User struct {
	Username string `json:"username"`
	Password string `json:"-"`
	UUID string `gorm:"primaryKey" json:"uuid"`
	Messages []Message `gorm:"foreignKey:SenderID;references:UUID"`
}

