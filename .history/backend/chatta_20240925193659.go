package main

import (
	"github.com/gofiber/fiber/v2"
)
func chatta(){
	app := fiber.New()
	app.Get("/", func(c *fiber.Ctx) error{
		return c.SendString("Welcome to Chatta!")
	})
}