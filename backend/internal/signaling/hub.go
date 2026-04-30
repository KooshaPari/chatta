package signaling

import (
	"chatta/backend/models"
	"fmt"
	"sync"

	"github.com/gofiber/websocket/v2"
)

// Client represents a WebSocket client connection.
type Client struct {
	Conn *websocket.Conn
	send chan []byte
}

// Hub manages all connected clients and broadcasts messages.
// Traces to: FR-CHATTA-003
type Hub struct {
	clients      map[*Client]bool
	register     chan *Client
	unregister   chan *Client
	broadcast    chan []byte
	messageBroadcast chan models.Message
	mutex        *sync.Mutex
}

var (
	clients   = make(map[*Client]bool)
	broadcast = make(chan []byte)
	mutex     = &sync.Mutex{}
)

// RegisterClient adds a client to the hub.
func RegisterClient(client *Client) {
	mutex.Lock()
	clients[client] = true
	mutex.Unlock()
}

// UnregisterClient removes a client from the hub.
func UnregisterClient(client *Client) {
	mutex.Lock()
	delete(clients, client)
	mutex.Unlock()
	client.Conn.Close()
}

// BroadcastMessage sends a message to all connected clients.
func BroadcastMessage(msg []byte) {
	broadcast <- msg
}

// HandleBroadcasts runs the broadcast loop for all connected clients.
func HandleBroadcasts() {
	for {
		msg := <-broadcast

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

// GetClients returns the current list of connected clients.
func GetClients() map[*Client]bool {
	mutex.Lock()
	defer mutex.Unlock()
	clientsCopy := make(map[*Client]bool)
	for k, v := range clients {
		clientsCopy[k] = v
	}
	return clientsCopy
}

// GetClientsMutex returns the mutex for client synchronization.
func GetClientsMutex() *sync.Mutex {
	return mutex
}
