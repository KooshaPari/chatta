package models

import "github.com/gofiber/websocket"
type Client struct {
	Conn *websocket.Conn
}
type Hub struct {
    // Map of channels to connected clients
    channels map[string]map[*Client]bool

    // Register and unregister channels
    register   chan Subscription
    unregister chan Subscription

    // Broadcast messages to channels
    broadcast chan Message
}