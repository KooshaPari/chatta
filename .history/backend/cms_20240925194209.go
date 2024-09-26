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
