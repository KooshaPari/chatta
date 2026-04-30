package main

import (
	"chatta/backend/internal/auth"
	"chatta/backend/internal/db"
	"chatta/backend/internal/handlers"
	"chatta/backend/internal/signaling"
	"log"

	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/fiber/v2/middleware/cors"
	"github.com/gofiber/websocket/v2"
)

func main() {
	// Initialize database
	if err := db.InitDB(); err != nil {
		log.Fatalf("Failed to initialize database: %v", err)
	}

	// Initialize JWT secret from environment
	if err := auth.InitJWT(); err != nil {
		log.Fatalf("Failed to initialize JWT: %v", err)
	}

	// Create Fiber app
	app := fiber.New()

	// CORS middleware
	app.Use(cors.New(cors.Config{
		AllowOrigins: "http://localhost:8080, http://localhost:8081",
	}))

	// Public auth routes (before middleware)
	app.Post("/backend/login", handlers.Login)
	app.Post("/backend/signup", handlers.Signup)

	// WebSocket middleware (after public routes)
	app.Use(handlers.WebSocketMiddleware)

	// Chat routes
	app.Post("/backend/thread", handlers.CreateThread)
	app.Get("/messages", handlers.GetMessages)
	app.Get("/backend/chats", handlers.GetChats)
	app.Get("/backend/chats/:uuid", handlers.GetChat)
	app.Post("/backend/dm", handlers.GetDM)

	// WebSocket upgrade route
	app.Get("/backend/ws", websocket.New(handlers.WebSocketHandler))

	// Start broadcast handler in background
	go signaling.HandleBroadcasts()

	// Listen on port 8081
	log.Println("Starting server on :8081")
	if err := app.Listen(":8081"); err != nil {
		log.Fatalf("Server error: %v", err)
	}
}
