package main

import (
	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/websocket"
)
func main(){
	app := fiber.New()
	app.Get("/", func(c *fiber.Ctx) error{
		return c.SendString("Welcome to Chatta!")
	})
	app.Get("ws", websocket.New(func(c *websocket.Conn){
		var (
			mt int
			msg []byte
			err error
		)
		for{
			if mt, msg, err = c.ReadMessage(); err != nil {
				break
			}
		}
	}))
	app.Listen(":8081")
}