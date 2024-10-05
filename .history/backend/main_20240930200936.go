package main

import (
	"chatta/models"
	"encoding/base64"
	"fmt"
	"log"
	"sync"
	"time"

	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/fiber/v2/middleware/cors"
	"github.com/gofiber/websocket/v2"
	"github.com/golang-jwt/jwt/v4"
	"golang.org/x/crypto/bcrypt"
	"gorm.io/driver/sqlite"
	"gorm.io/gorm"
)
var jwtKey = []byte("my_secret_key")
var db *gorm.DB
// User credentials (in-memory for simplicity)
func initDB(){
    var err error
    db, err = gorm.Open(sqlite.Open("stores.db"), &gorm.Config{})
    if err != nil{
        log.Fatal("FATAL ERR AT: Database Connection: ", err)
    }
    db.AutoMigrate(&models.User{},&models.Message{})
    log.Println("Connected to DB.")
}
type Client struct {
	Conn *websocket.Conn
}
var clients = make(map[*Client]bool) // Connected clients
var broadcast = make(chan []byte)    // Broadcast channel
var mutex = &sync.Mutex{}            // To synchronize access to the clients map

func main() {
initDB()
app := fiber.New()
app.Use(cors.New(cors.Config{
	AllowOrigins:  "http://localhost:8080, http://localhost:8081,https://chatta-kooshapari-koosha-paridehpours-projects.vercel.app",
}))
	app.Post("/login", login)
    app.Post("/signup", signup)
    // WebSocket route
    app.Get("/ws", websocket.New(func(c *websocket.Conn) {
		// Get the token from the query string
		token := c.Query("token")
		
		// Verify the token and get the username
		username, err := verifyToken(token)
		if err != nil {
			c.Close()
			return
		}
        // Create a new client object and associate it with the connection 'c'
		client := &Client{Conn: c}

		// Add the client to a list of registered clients, ensuring exclusive access
		// to prevent multiple clients from being added or removed at the same time
		mutex.Lock()
		// Add the client to the list
		 if username != "" {
            // Add the client to the list
            clients[client] = true
        } else {
            // Handle anonymous client connection, e.g., close the connection
            c.Close()
            return
        }
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
   // app.Put("/message/:id/edit", editMessage());
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
        /**APPENDTOMESAGETEABLE**/
		// The following block of code is executed within a critical section.
		// The critical section is protected by a mutex, which ensures that only one goroutine can access it at a time.
		// This is necessary because the code that follows modifies the 'clients' map, and we want to ensure that only one goroutine can modify it at a time.
		mutex.Lock()

		// Iterate over all connected clients.
		// The 'clients' map is a map that stores all connected clients.
		// The 'client' variable is a pointer to a Client struct, which represents a connected client.
		for client := range clients {
			
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
func editMessage(c *fiber.Ctx){
    /*
    EDIT IN SQL RELOAD MESSAGES / INSERT
    */
}
func signup(c *fiber.Ctx) error{
    
    client  := new(models.User)
    if err := c.BodyParser(client); err != nil {
        return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
            "error": "Cannot parse JSON",
        })
    }
    if err := db.First(&client, "username = ?", client.Username).Error; err == nil {
    return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "User Already Exists"})
} 
    hashpass, err := bcrypt.GenerateFromPassword([]byte(client.Password),bcrypt.DefaultCost)
    if err != nil {
        return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error encrypting password": err.Error()})
    }
    client.Password=base64.StdEncoding.EncodeToString(hashpass)
    if err := db.Create(&client).Error; err != nil {
        return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
            "error": err.Error(),
        })
    }
    client.Password = ""
    return c.Status(fiber.StatusCreated).JSON(client)


    // create new users row w data
    // return token

}
func login(c *fiber.Ctx) error {
    var users models.User
    
    type Credentials struct {
        Username string `json:"username"`
        Password string `json:"password"`
    }
  

    var creds Credentials
    if err := c.BodyParser(&creds); err != nil {
        return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Invalid request"})
    }
  
    // Validate credentials
   db.Where("username = ?", creds.Username).First(&users).Select("Password")
    expectedPassword, erro :=  base64.StdEncoding.DecodeString(users.Password)
      err:=bcrypt.CompareHashAndPassword([]byte(expectedPassword),[]byte(creds.Password))
      fmt.Println("Hashed password from DB:",err)
    if err !=nil {
 
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
	// Set the username in the locals for later use
    c.Locals("username", creds.Username)
    return c.JSON(fiber.Map{"token": tokenString})
}
func verifyToken(tokenString string) (string, error) {
    // Parse and verify the token, then return the username
    // This is just a skeleton - implement according to your JWT setup
    token, err := jwt.Parse(tokenString, func(token *jwt.Token) (interface{}, error) {
        return jwtKey, nil
    })
    
    if err != nil {
        return "", err
    }
    
    if claims, ok := token.Claims.(jwt.MapClaims); ok && token.Valid {
        return claims["sub"].(string), nil
    }
    
    return "", fmt.Errorf("invalid token")
}