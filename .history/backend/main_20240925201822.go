package main

import (
	"fmt"
	"sync"
	"time"

	"github.com/gin-contrib/cors"
	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/fiber/v2/middleware/cors"
	"github.com/gofiber/websocket/v2"
	"github.com/golang-jwt/jwt/v4"
)
var jwtKey = []byte("my_secret_key")

// User credentials (in-memory for simplicity)
var users = map[string]string{
    "user1": "password1",
    "user2": "password2",
}
type Client struct {
	Conn *websocket.Conn
}
var clients = make(map[*Client]bool) // Connected clients
var broadcast = make(chan []byte)    // Broadcast channel
var mutex = &sync.Mutex{}            // To synchronize access to the clients map
func main() {

app := fiber.New()
app.Use(cors.New(cors.Config{
	AllowOrigins:  "http://localhost:8080,http://localhost:8081",
	AllowMethods:  "GET,POST,HEAD,PUT,DELETE,PATCH",
	AllowHeaders:  "Content-Type,Authorization",
}))
	app.Post("/login", login)
    // WebSocket route
    app.Get("/ws", websocket.New(func(c *websocket.Conn) {
        // Create a new client object and associate it with the connection 'c'
		client := &Client{Conn: c}
		username := c.Locals("username").(string)
		// Add the client to a list of registered clients, ensuring exclusive access
		// to prevent multiple clients from being added or removed at the same time
		mutex.Lock()
		// Add the client to the list
		clients[client] = true;
		// Release the exclusive access
		mutex.Unlock()

		// Set up a function to be executed when the current function returns,
		// to ensure the client is properly cleaned up
		defer func() {
			// Remove the client from the list of registered clients, again ensuring
			// exclusive access to prevent other clients from being added or removed
			// at the same time
			mutex.Lock()
			// Remove the client from the list
			delete(clients, client)
			// Release the exclusive access
			mutex.Unlock()
			// Close the connection to the client
			c.Close()
		}()

		// Enter an infinite loop to continuously handle messages from the client
		for {
			// Read a message from the client
			_, msg, err := c.ReadMessage()
			// If there was an error reading the message, print an error message and stop
			if err != nil{
				fmt.Println("Error reading message:", err)
				break
			}
			
			 // Prepend username to the message
        fullMsg := fmt.Sprintf("%s: %s", username, string(msg))

        // Send the message to the broadcast channel
        broadcast <- []byte(fullMsg)
		}
    }))
	// WebSocket route with authentication
    app.Use(func(c *fiber.Ctx) error {
        // Bypass authentication for login route
        if c.Path() == "/login" {
            return c.Next()
        }

        // Get token from query params (for WebSocket upgrade)
        tokenString := c.Query("token")
        if tokenString == "" {
            return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{"error": "Missing token"})
        }

        claims := &jwt.RegisteredClaims{}
        token, err := jwt.ParseWithClaims(tokenString, claims, func(token *jwt.Token) (interface{}, error) {
            return jwtKey, nil
        })
        if err != nil || !token.Valid {
            return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{"error": "Invalid token"})
        }

        // Store username in locals for use in handlers
        c.Locals("username", claims.Subject)

        return c.Next()
    })

    // Start a goroutine to handle messages
    go handleMessages()

    app.Listen(":8081")
}

func handleMessages() {
    // This is a for loop that runs indefinitely.
	for {
		// Grab the next message from the broadcast channel.
		// The broadcast channel is a channel that is used to send messages to all connected clients.
		// The message is received from the channel and stored in the 'msg' variable.
		msg := <- broadcast

		// The following block of code is executed within a critical section.
		// The critical section is protected by a mutex, which ensures that only one goroutine can access it at a time.
		// This is necessary because the code that follows modifies the 'clients' map, and we want to ensure that only one goroutine can modify it at a time.
		mutex.Lock()

		// Iterate over all connected clients.
		// The 'clients' map is a map that stores all connected clients.
		// The 'client' variable is a pointer to a Client struct, which represents a connected client.
		for client := range clients {
			// Write the message to the client's websocket connection.
			// The 'client.Conn.WriteMessage' function is used to write a message to the client's websocket connection.
			// The first parameter is the type of message being sent (in this case, a text message).
			// The second parameter is the message itself.
			if err := client.Conn.WriteMessage(websocket.TextMessage, msg); err != nil {
				// If there was an error writing the message, print an error message.
				fmt.Println("Error writing message:", err)

				// Close the client's websocket connection.
				client.Conn.Close()

				// Remove the client from the 'clients' map.
				delete(clients, client)
			}
		}

    // Exit the critical section.
    mutex.Unlock()
	}
}
func login(c *fiber.Ctx) error {
    type Credentials struct {
        Username string `json:"username"`
        Password string `json:"password"`
    }

    var creds Credentials
    if err := c.BodyParser(&creds); err != nil {
        return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Invalid request"})
    }

    // Validate credentials
    expectedPassword, ok := users[creds.Username]
    if !ok || expectedPassword != creds.Password {
        return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{"error": "Invalid credentials"})
    }

    // Create JWT token
    expirationTime := time.Now().Add(5 * time.Minute)
    claims := &jwt.RegisteredClaims{
        Subject:   creds.Username,
        ExpiresAt: jwt.NewNumericDate(expirationTime),
    }

    token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
    tokenString, err := token.SignedString(jwtKey)
    if err != nil {
        return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Could not create token"})
    }

    return c.JSON(fiber.Map{"token": tokenString})
}