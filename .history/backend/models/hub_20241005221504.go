type Hub struct {
    // Map of channels to connected clients
    channels map[string]map[*Client]bool

    // Register and unregister channels
    register   chan Subscription
    unregister chan Subscription

    // Broadcast messages to channels
    broadcast chan Message
}