type Hub struct {
   
    channels map[string]map[*Client]bool
    register   chan Subscription
    unregister chan Subscription

    // Broadcast messages to channels
    broadcast chan Message
}