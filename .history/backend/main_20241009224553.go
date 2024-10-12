package main

import (
	"chatta/models"
	"encoding/json"
	"fmt"
	"log"
	"strings"
	"sync"
	"time"

	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/fiber/v2/middleware/cors"
	"github.com/gofiber/websocket/v2"
	"github.com/golang-jwt/jwt/v4"
	"github.com/google/uuid"
	"golang.org/x/crypto/bcrypt"
	"gorm.io/driver/sqlite"
	"gorm.io/gorm"
)
var jwtKey = []byte("my_secret_key")
var db *gorm.DB
type Client struct {
    Conn *websocket.Conn
    send chan []byte
}
type Subscription struct {
    client  *Client
    channel string
}
type Hub struct {
    // Map of channels to connected clients
    channels map[string]map[*Client]bool
    register   chan Subscription
    unregister chan Subscription
    broadcast chan models.Message
}
var clients = make(map[*Client]bool) // Connected clients
var broadcast = make(chan []byte)    // Broadcast channel
var mutex = &sync.Mutex{}            // To synchronize access to the clients map
func initDB(){
    var err error
    db, err = gorm.Open(sqlite.Open("stores.db"), &gorm.Config{})
    if err != nil{
        log.Fatal("FATAL ERR AT: Database Connection: ", err)
    }
    db.AutoMigrate(&models.User{},&models.Message{},&models.Chat{})
    log.Println("Connected to DB.")
}
func main() {
initDB()

//db.Exec("DELETE FROM users_chats")

//db.Exec("DELETE FROM dm_participants")
app := fiber.New()
app.Use(cors.New(cors.Config{
	AllowOrigins:  "http://localhost:8080, http://localhost:8081,https://chatta-kooshapari-koosha-paridehpours-projects.vercel.app",
}))
app.Post("/login", login)
app.Post("/signup", signup)
app.Post("/thread", createThread)
app.Get("/messages",getMessages)
app.Get("/chats",getChats)
app.Get("/chats/:uuid",getChat)
app.Post("/dm",getDM)

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
           
                
                // Parse the incoming JSON message into the Message struct
                var incomingMsg models.Message
                if err := json.Unmarshal(msg, &incomingMsg); err != nil {
                fmt.Println("Error unmarshaling message:", err)
                //fmt.Println("JSON Body: ", msg)
                continue // Skip invalid messages
                }
                if(incomingMsg.Channel == ""){
                    continue
                }
                
                //fmt.Println("JSON Body: ", msg)
                if incomingMsg.Deleted{
                    fmt.Println("Deleting Message: ", incomingMsg.Content)
                     db.Model(&models.Message{}).Model(&models.Message{}).Where("uuid = ?", incomingMsg.UUID).Delete(&models.Message{})
                }else if incomingMsg.Edited{
                    fmt.Println("Editing Message: ", incomingMsg.Content)
                    db.Model(&models.Message{}).Model(&models.Message{}).Where("uuid = ?", incomingMsg.UUID).Update("content",incomingMsg.Content)
                } else{
                    fmt.Println("Sending New Message: ", incomingMsg.Content)
                    user := new(models.User)
                    db.Where("username = ?", username).First(user)
                    // Populate additional fields
                    incomingMsg.UUID = uuid.New().String()       // Assign a new UUID
                    incomingMsg.SentAt = time.Now().UTC()           // Set current timestamp
                    incomingMsg.Edited = false     
                    incomingMsg.Deleted = false              // Default to not edited
                    incomingMsg.SenderID = user.UUID              // Assuming you have the sender's UUID
                    incomingMsg.Sender = *user
                    if err := db.Create(&incomingMsg).Error; err != nil {
                        fmt.Println("Error saving message to DB:", err)
                        continue
                }
                    if incomingMsg.Channel != "0000" {
            fmt.Println("Adding to Appropriate Array.")

            // Fetch the chat and preload the existing messages
            chat := new(models.Chat)
            if err := db.Preload("Messages").Where("uuid = ?", incomingMsg.Channel).First(chat).Error; err != nil {
                fmt.Println("Error finding chat: ", err)
                continue
            }

            // Append the new message to the chat's messages array
            chat.Messages = append(chat.Messages, incomingMsg)
            
            // Save the updated chat with the new message
            if err := db.Save(chat).Error; err != nil {
                fmt.Println("Error saving chat with new message: ", err)
            } else {
                fmt.Println("Message added successfully to chat.")
            }
        }}

                // Serialize the message back to JSON
                broadcastMsg, err := json.Marshal(incomingMsg)
                // fmt.Println(broadcastMsg)
                if err != nil {
                    fmt.Println("Error marshaling message:", err)
                    continue}
            

                // Send the structured message to the broadcast channel
                broadcast <- broadcastMsg
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
        authHeader := c.Get("Authorization")
     if authHeader == "" && c.Query("token") =="" {
        return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{"error": "Missing token"})
    }
     tokenString := strings.TrimPrefix(authHeader, "Bearer ");
    if c.Query("token") !=""{
        tokenString = c.Query("token")
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
func signup(c *fiber.Ctx) error{
    
    client  := new(models.User)
    client.UUID = uuid.New().String();
   // fmt.Println("BODY: ",c.Body())
    if err := c.BodyParser(client); err != nil {
        return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
            "error": "Cannot parse JSON",
        })
    }
    //fmt.Println("Client: ",client)
   
    db.Model(&client)
    if err := db.First(&client, "username = ?", client.Username).Error; err == nil {
    return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "User Already Exists"})
}   
    //fmt.Println("pass: ",client.Password)
    hashpass, err := bcrypt.GenerateFromPassword([]byte(client.Password),bcrypt.DefaultCost)
    if err != nil {
        return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error encrypting password": err.Error()})
    }
    client.Password=string(hashpass)
    if err := db.Create(&client).Error; err != nil {
        return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
            "error": err.Error(),
        })
    }
    client.Password = ""
   
    // Create JWT token
    expirationTime := time.Now().Add(5 * time.Minute)
    claims := &jwt.RegisteredClaims{
        Subject:   client.Username,
        ExpiresAt: jwt.NewNumericDate(expirationTime),
    }

    token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
    tokenString, err := token.SignedString(jwtKey)
    if err != nil {
        return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Could not create token"})
    }

 return c.JSON(fiber.Map{"token": tokenString, "user": client})


}
func getChat(c *fiber.Ctx) error{
    uuid := c.Params("uuid")
    if uuid == "" {
        return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
            "error": "UUID parameter is missing",
        })
    }
    var chat models.Chat
    if err := db.Preload("Messages").Preload("Sender").Where("uuid = ?", uuid).First(&chat).Error; err != nil {
        if err == gorm.ErrRecordNotFound {
            return c.Status(fiber.StatusNotFound).JSON(fiber.Map{
                "error": "Chat not found",
            })
        }
        // Log the error for debugging purposes
        fmt.Printf("Database error: %v\n", err)
        return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
            "error": "Internal server error",
        })
    }

    return c.JSON(chat)
   
}
func login(c *fiber.Ctx) error {
    type Credentials struct {
        Username string `json:"username"`
        Password string `json:"password"`
    }
    	type ResponseUser struct {
        UUID       string   `json:"uuid"`
        Username string `json:"username"`
    }
    var creds Credentials
    var response ResponseUser
    var users models.User

    if err := c.BodyParser(&creds); err != nil {
        return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Invalid request"})
    }

    if err := db.Where("username = ?", creds.Username).First(&users).Error; err != nil {
    return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{"error": "Invalid credentials"})
}
    err := bcrypt.CompareHashAndPassword([]byte(users.Password), [] byte(creds.Password))
    
 if err != nil {
    fmt.Println("CompareHashAndPassword error:", err)
    return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Invalid Credentials"})
  
} else {
	fmt.Println("Passwords match!")
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
    response =  ResponseUser{
        UUID: users.UUID,
        Username: users.Username,
    }
   return c.JSON(fiber.Map{"token": tokenString, "user": response})
}

func getDM(c *fiber.Ctx) error{
    // Grab Both User UUIDs from the given chat object
    var tempChat models.Chat
    if err := c.BodyParser(&tempChat); err != nil {
        return c.Status(500).JSON(fiber.Map{"error": "Invalid request payload"})
    }

    // Get both participant UUIDs
    participant1UUID := tempChat.Participants[0].UUID
    participant2UUID := tempChat.Participants[1].UUID
    
    var existingChat models.Chat
    if err := db.Preload("Messages").Preload("Users").Joins("JOIN dm_participants ON dm_participants.chat_uuid = chats.uuid").
    Where("chats.type = ? AND dm_participants.user_uuid IN (?, ?)", "dm", participant1UUID, participant2UUID).
    Group("chats.uuid").
    Having("COUNT(DISTINCT dm_participants.user_uuid) = 2").First(&existingChat).Error; err == nil {
    // DM chat found, return the existing chat
    fmt.Println("Already Exists!")
    return c.Status(200).JSON(existingChat)
}   
         fmt.Println("Create New")
    // No DM found, so create a new one
    tempChat.UUID = uuid.New().String()
    tempChat.Type = "dm"
    
    // Get the actual user objects
    var participant1, participant2 models.User
    if err := db.Where("uuid = ?", participant1UUID).First(&participant1).Error; err != nil {
        return c.Status(404).JSON(fiber.Map{"error": "User not found"})
    }
    if err := db.Where("uuid = ?", participant2UUID).First(&participant2).Error; err != nil {
        return c.Status(404).JSON(fiber.Map{"error": "User not found"})
    }

    // Add the participants to the chat
    tempChat.Participants = []models.User{participant1, participant2}
    fmt.Println(tempChat.Participants)
    // Save the new DM chat
    if err := db.Create(&tempChat).Error; err != nil {
        return c.Status(500).JSON(fiber.Map{"error": "Failed to create new DM chat"})
    }

    // Return the newly created DM chat
    return c.Status(201).JSON(tempChat)

}
func createThread(c *fiber.Ctx) error{
    var tempChat models.Chat;
    if err := c.BodyParser(&tempChat); err != nil {
        c.Status(500)
    }
    tempChat.UUID = uuid.New().String();
    db.Create(&tempChat)
    return c.JSON(fiber.Map{"chat":tempChat})
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

func getChats(c *fiber.Ctx) error{
    chats := []models.Chat{}
    if err := db.Preload("Users")Find(&chats).Error; err != nil {
        return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": err.Error()})
    }
    return c.JSON(chats)
}
func getMessages(c *fiber.Ctx) error {
    messages := []models.Message{}
    
    if err := db.Preload("Sender").Find(&messages).Error; err != nil {
    return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": err.Error()})
}

    return c.JSON(messages)
}