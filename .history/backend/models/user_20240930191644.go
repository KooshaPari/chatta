package models
type User struct {
	UUID string ` json:"id"`
	Name string `gorm:"primaryKey" gorm:"unique"`
	Password string `json:"password"`

}

