package models
type User struct {
	Username string `gorm:"primaryKey" gorm:"unique"`
	Password string `json:"password"`

}

