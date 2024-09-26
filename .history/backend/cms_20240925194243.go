package main
import (
    "fmt"
    "sync"

    "github.com/gofiber/fiber/v2"
    "github.com/gofiber/websocket/v2"
)

type Client struct {
	Conn *websocket.Conn
}
var clients = make(map[*Client]bool) // Connected clients
var broadcast = make(chan []byte)    // Broadcast channel
var mutex = &sync.Mutex{}            // To synchronize access to the clients map
unc main() {
    app := fiber.New()

    // WebSocket route
    app.Get("/ws", websocket.New(func(c *websocket.Conn) {
        client := &Client{Conn: c}
        // Register the client
        mutex.Lock()
        clients[client] = true
        mutex.Unlock()

        defer func() {
            // Unregister the client
            mutex.Lock()
            delete(clients, client)
            mutex.Unlock()
            c.Close()
        }()

        for {
            // Read message from client
            _, msg, err := c.ReadMessage()
            if err != nil {
                fmt.Println("Error reading message:", err)
                break
            }
            // Send the message to the broadcast channel
            broadcast <- msg
        }
    }))

    // Start a goroutine to handle messages
    go handleMessages()

    app.Listen(":8080")
}

func handleMessages() {
    for {
        // Grab the next message from the broadcast channel
        msg := <-broadcast

        // Send it to every connected client
        mutex.Lock()
        for client := range clients {
            if err := client.Conn.WriteMessage(websocket.TextMessage, msg); err != nil {
                fmt.Println("Error writing message:", err)
                client.Conn.Close()
                delete(clients, client)
            }
        }
        mutex.Unlock()
    }
}