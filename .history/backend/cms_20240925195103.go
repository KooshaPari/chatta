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
        // Create a new client object and associate it with the connection 'c'
		client := &Client(Conn: c)

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
			
			// If there was an error reading the message, print an error message and stop
			if err != nil{
				fmt.Println("Error reading message:", err)
				break
			}
			// Send the message to a channel that broadcasts it to all other clients
			
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
}}