package models
type User struct {
	UUID string `gorm:"primaryKey" json:"id"`
	Name string `json:"name" gorm:"unique"`
	Password string `json:"password"`

}

