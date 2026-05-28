package signaling

import (
	"testing"
)

// TestRegisterUnregisterClient tests client registration and cleanup.
// Traces to: FR-CHATTA-003
func TestRegisterUnregisterClient(t *testing.T) {
	// Reset state
	clients = make(map[*Client]bool)

	// Create mock client
	client := &Client{
		Conn: nil,
		send: make(chan []byte),
	}

	// Register
	RegisterClient(client)

	clientsCopy := GetClients()
	if _, exists := clientsCopy[client]; !exists {
		t.Error("Client not registered")
	}

	// Unregister (mock close)
	clientsMux := GetClientsMutex()
	clientsMux.Lock()
	delete(clients, client)
	clientsMux.Unlock()

	clientsCopy = GetClients()
	if _, exists := clientsCopy[client]; exists {
		t.Error("Client not unregistered")
	}
}

// TestBroadcastMessage tests message broadcasting.
// Traces to: FR-CHATTA-003
func TestBroadcastMessage(t *testing.T) {
	// Reset broadcast channel to avoid blocking
	broadcast = make(chan []byte, 100) // buffered to prevent blocking

	msg := []byte("test message")
	BroadcastMessage(msg)

	// Verify message is in channel
	select {
	case received := <-broadcast:
		if string(received) != string(msg) {
			t.Errorf("Expected '%s', got '%s'", string(msg), string(received))
		}
	default:
		t.Error("Message not broadcast")
	}
}

// TestGetClients tests client list retrieval.
// Traces to: FR-CHATTA-003
func TestGetClients(t *testing.T) {
	clients = make(map[*Client]bool)

	client1 := &Client{Conn: nil}
	client2 := &Client{Conn: nil}

	RegisterClient(client1)
	RegisterClient(client2)

	clientsCopy := GetClients()
	if len(clientsCopy) != 2 {
		t.Errorf("Expected 2 clients, got %d", len(clientsCopy))
	}

	if _, ok := clientsCopy[client1]; !ok {
		t.Error("Client1 not in list")
	}
	if _, ok := clientsCopy[client2]; !ok {
		t.Error("Client2 not in list")
	}
}
