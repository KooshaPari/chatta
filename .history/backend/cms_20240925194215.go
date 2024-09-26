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
