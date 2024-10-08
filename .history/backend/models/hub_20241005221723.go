package main
type Hub struct {
   
    channels map[string]map[*Client]bool
    register   chan Subscription
    unregister chan Subscription

    broadcast chan Message
}