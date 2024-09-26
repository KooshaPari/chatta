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
    // This is a for loop that runs indefinitely.
for {
    // Grab the next message from the broadcast channel.
    // The broadcast channel is a channel that is used to send messages to all connected clients.
    // The message is received from the channel and stored in the 'msg' variable.
    msg := <-broadcast

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