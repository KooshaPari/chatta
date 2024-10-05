package models
type User struct {
	Name string `gorm:"primaryKey" gorm:"unique"`
	Password string `json:"password"`

}

