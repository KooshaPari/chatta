package handlers

import (
	"chatta/backend/internal/auth"
	"chatta/backend/internal/db"
	"chatta/backend/internal/signaling"
	"chatta/backend/models"
	"encoding/json"
	"fmt"
	"time"

	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/websocket/v2"
	"github.com/google/uuid"
)

// WebSocketHandler manages WebSocket connections and message operations.
func WebSocketHandler(c *websocket.Conn) {
	// Get the token from the query string
	token := c.Query("token")

	// Verify the token and get the username
	username, err := auth.VerifyToken(token)
	if err != nil {
		c.Close()
		return
	}

	// Create a new client object
	client := &signaling.Client{Conn: c}

	// Register the client
	signaling.RegisterClient(client)

	// Clean up on disconnect
	defer func() {
		signaling.UnregisterClient(client)
	}()

	// Handle incoming messages
	for {
		_, msg, err := c.ReadMessage()
		if err != nil {
			fmt.Println("Error reading message:", err)
			break
		}

		// Parse the incoming JSON message
		var incomingMsg models.Message
		if err := json.Unmarshal(msg, &incomingMsg); err != nil {
			fmt.Println("Error unmarshaling message:", err)
			continue
		}

		if incomingMsg.Channel == "" {
			continue
		}

		// Handle message operations
		if incomingMsg.Deleted {
			fmt.Println("Deleting Message:", incomingMsg.Content)
			db.DB.Where("uuid = ?", incomingMsg.UUID).Delete(&models.Message{})
		} else if incomingMsg.Edited {
			fmt.Println("Editing Message:", incomingMsg.Content)
			db.DB.Where("uuid = ?", incomingMsg.UUID).Update("content", incomingMsg.Content)
		} else {
			fmt.Println("Sending New Message:", incomingMsg.Content)
			user := new(models.User)
			db.DB.Where("username = ?", username).First(user)

			// Populate message fields
			incomingMsg.UUID = uuid.New().String()
			incomingMsg.SentAt = time.Now().UTC()
			incomingMsg.Edited = false
			incomingMsg.Deleted = false
			incomingMsg.SenderID = user.UUID
			incomingMsg.Sender = *user

			if err := db.DB.Create(&incomingMsg).Error; err != nil {
				fmt.Println("Error saving message to DB:", err)
				continue
			}

			if incomingMsg.Channel != "0000" {
				fmt.Println("Adding to Appropriate Array.")

				chat := new(models.Chat)
				if err := db.DB.Preload("Messages").Where("uuid = ?", incomingMsg.Channel).First(chat).Error; err != nil {
					fmt.Println("Error finding chat: ", err)
					continue
				}

				chat.Messages = append(chat.Messages, incomingMsg)

				if err := db.DB.Save(chat).Error; err != nil {
					fmt.Println("Error saving chat with new message: ", err)
				} else {
					fmt.Println("Message added successfully to chat.")
				}
			}
		}

		// Serialize and broadcast
		broadcastMsg, err := json.Marshal(incomingMsg)
		if err != nil {
			fmt.Println("Error marshaling message:", err)
			continue
		}

		signaling.BroadcastMessage(broadcastMsg)
	}
}

// WebSocketMiddleware ensures only authenticated users can upgrade to WebSocket.
func WebSocketMiddleware(c *fiber.Ctx) error {
	// Bypass for login
	if c.Path() == "/backend/login" {
		return c.Next()
	}

	// Get token from header or query
	authHeader := c.Get("Authorization")
	tokenString := c.Query("token")

	if authHeader == "" && tokenString == "" {
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{"error": "Missing token"})
	}

	if authHeader != "" {
		tokenString = authHeader[7:] // Strip "Bearer "
	}

	_, err := auth.VerifyToken(tokenString)
	if err != nil {
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{"error": "Invalid token"})
	}

	return c.Next()
}
