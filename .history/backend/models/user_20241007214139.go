package models
type User struct {
	Username string `json:"username"`
	Password string `json:"password"`
	UUID string `gorm:"primaryKey" json:"uuid"`
	Messages []Message `gorm:"foreignKey:SenderID;references:UUID" json:"messages"`
	Chats    []Chat    `gorm:"many2many:user_chats" json:"chats"`
}
