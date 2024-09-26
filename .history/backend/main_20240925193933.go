package main

import (
	"github.com/gofiber/fiber/v2"
)
func main(){
	app := fiber.New()
	app.Get("/", func(c *fiber.Ctx) error{
		return c.SendString("Welcome to Chatta!")
	})
	app.Get("ws", func(c *fiber.Ctx) error{
		var (
			mt int
			msg []byte
			err error
		)
		for{
			if mt, msg, err = c.ReadMessage();
		}
	})
	app.Listen(":8081")
}