package models
type User struct {
	UUID string ` json:"id"`
	Name string `json:"name" gorm:"unique"`
	Password string `json:"password"`

}

