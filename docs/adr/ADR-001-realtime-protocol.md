# ADR-001: Real-Time Protocol Selection

**Document ID:** PHENOTYPE_CHATTA_ADR_001  
**Status:** Accepted  
**Last Updated:** 2026-04-03  
**Author:** Phenotype Architecture Team  
**Supersedes:** N/A  
**Related ADRs:** [ADR-002](./ADR-002-message-storage.md), [ADR-003](./ADR-003-presence-system.md)

---

## Table of Contents

1. [Title](#title)
2. [Context](#context)
3. [Decision](#decision)
4. [Consequences](#consequences)
5. [Technical Details](#technical-details)
6. [Alternatives Considered](#alternatives-considered)
7. [Implementation Notes](#implementation-notes)
8. [Cross-References](#cross-references)

---

## Context

chatta requires a real-time communication protocol to deliver messages between users with sub-200ms latency. The application supports multiple communication patterns:

- **Direct Messages (DM):** Two users communicating privately
- **Group Chats (GC):** Three or more users in a shared conversation
- **Threads:** Nested replies within a room context
- **Presence:** Real-time online/away/offline status
- **Typing Indicators:** Real-time typing state notifications

The protocol selection must balance several competing requirements:

### Requirements

| ID | Requirement | Priority | Notes |
|----|-------------|----------|-------|
| R1 | Sub-200ms message delivery | Critical | Measurable on local network |
| R2 | Bidirectional communication | Critical | Both send and receive |
| R3 | Browser-native support | High | No plugins required |
| R4 | Graceful degradation | High | Works when P2P is unavailable |
| R5 | Group chat scalability | High | Support 50+ participants |
| R6 | Message ordering | Critical | Causal ordering within rooms |
| R7 | Security (encryption) | Critical | In-transit encryption |
| R8 | Low server infrastructure cost | Medium | P2P preferred when possible |
| R9 | Mobile browser support | Medium | iOS Safari, Chrome Android |
| R10 | Firewall/NAT traversal | High | Must work behind corporate firewalls |

### Constraints

- Frontend is SvelteKit (browser-based)
- Backend is Go
- Project originally conceived as WebRTC-based
- Must support both P2P and server-relayed communication
- No external message broker for MVP

### Current State

The existing ADR.md documents the original decision to use WebRTC data channels for peer-to-peer message transport with a Go signaling server. This ADR formalizes and expands that decision with detailed technical specifications.

### Network Topology Considerations

```
WebRTC Mesh Topology (Problematic for Groups):

  2 users:  1 connection    ─── feasible
  3 users:  3 connections   ─── feasible
  4 users:  6 connections   ─── feasible
  5 users:  10 connections  ─── marginal
  10 users: 45 connections  ─── not feasible
  50 users: 1,225 connections ─── impossible

Formula: connections = n(n-1)/2
```

### Protocol Options Evaluated

```
┌─────────────────────────────────────────────────────────────────┐
│                   Protocol Evaluation Matrix                     │
├──────────────┬──────────┬──────────┬──────────┬────────────────┤
│ Criterion    │ WebRTC   │ WebSocket│ SSE      │ MQTT           │
├──────────────┼──────────┼──────────┼──────────┼────────────────┤
│ Latency      │ ★★★★★   │ ★★★★☆   │ ★★★☆☆   │ ★★★★☆         │
│ Bidirectional│ ★★★★★   │ ★★★★★   │ ★☆☆☆☆   │ ★★★★★         │
│ P2P Support  │ ★★★★★   │ ★☆☆☆☆   │ ★☆☆☆☆   │ ★☆☆☆☆         │
│ Browser Nat. │ ★★★★☆   │ ★★★★★   │ ★★★★★   │ ★★☆☆☆         │
│ NAT Traversal│ ★★☆☆☆   │ ★★★★★   │ ★★★★★   │ ★★★★★         │
│ Group Scale  │ ★★☆☆☆   │ ★★★★★   │ ★★★☆☆   │ ★★★★☆         │
│ Complexity   │ ★★☆☆☆   │ ★★★★☆   │ ★★★★★   │ ★★★☆☆         │
│ Maturity     │ ★★★★☆   │ ★★★★★   │ ★★★★★   │ ★★★★★         │
├──────────────┼──────────┼──────────┼──────────┼────────────────┤
│ Total        │ 33/40    │ 38/40    │ 27/40    │ 32/40         │
└──────────────┴──────────┴──────────┴──────────┴────────────────┘
```

---

## Decision

We will use a **hybrid real-time protocol architecture**:

### Primary Decision

**WebRTC Data Channels** for Direct Messages (2 participants) with **WebSocket relay** as the transport for group chats (3+ participants) and as a fallback when P2P connections fail.

### Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    chatta Transport Architecture                 │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  DMs (2 users):                                                 │
│  ┌──────────┐ ◀════ WebRTC Data Channel ════▶ ┌──────────┐     │
│  │ Client A │                                   │ Client B │     │
│  └────┬─────┘                                   └────┬─────┘     │
│       │                                              │            │
│       └────────▶ ┌──────────────┐ ◀──────────────────┘            │
│                  │  Signaling   │                                 │
│                  │  (WebSocket) │                                 │
│                  └──────────────┘                                 │
│                                                                  │
│  Group Chats (3+ users):                                         │
│  ┌──────────┐ ──▶ ┌──────────────┐ ◀── ┌──────────┐             │
│  │ Client A │     │  Go Server   │     │ Client B │             │
│  └──────────┘     │  (WebSocket) │     └──────────┘             │
│  ┌──────────┐     │  + Broadcast │     ┌──────────┐             │
│  │ Client C │ ──▶ │              │ ◀── │ Client D │             │
│  └──────────┘     └──────────────┘     └──────────┘             │
│                                                                  │
│  Fallback (when P2P fails):                                      │
│  ┌──────────┐ ──▶ ┌──────────────┐ ◀── ┌──────────┐             │
│  │ Client A │     │  Go Server   │     │ Client B │             │
│  └──────────┘     │  (WebSocket) │     └──────────┘             │
│                   │  (Relay Mode)│                               │
│                   └──────────────┘                               │
└─────────────────────────────────────────────────────────────────┘
```

### Protocol Selection Rules

| Scenario | Protocol | Rationale |
|----------|----------|-----------|
| DM (2 users, P2P available) | WebRTC Data Channel | Lowest latency, no server relay |
| DM (2 users, P2P blocked) | WebSocket relay | Graceful degradation |
| Group chat (3+ users) | WebSocket relay | Mesh topology infeasible |
| Presence updates | WebSocket | Simple, reliable, low overhead |
| Typing indicators | WebSocket (unordered) | Loss-tolerant, frequent updates |
| Message history | REST API | Pagination, search, caching |
| File transfer | WebRTC Data Channel | Direct P2P, no server bandwidth |
| Authentication | REST API + JWT | Stateless, standard |

### Signaling Protocol

The signaling server uses WebSocket with a JSON-based message format:

```json
{
  "type": "offer",
  "room_id": "dm-alice-bob",
  "target_id": "user-bob",
  "payload": {
    "sdp": "v=0\r\no=- ...",
    "type": "offer"
  },
  "timestamp": 1712188800000
}
```

### Supported Signal Types

```go
const (
    SignalAuth         = "auth"
    SignalAuthOK       = "auth_ok"
    SignalAuthError    = "auth_error"
    SignalOffer        = "offer"
    SignalAnswer       = "answer"
    SignalICECandidate = "ice_candidate"
    SignalPresence     = "presence"
    SignalRoomJoin     = "room_join"
    SignalRoomLeave    = "room_leave"
    SignalPing         = "ping"
    SignalPong         = "pong"
    SignalError        = "error"
)
```

---

## Consequences

### Positive Consequences

1. **Optimal latency for DMs:** WebRTC data channels provide 10-50ms P2P latency, significantly faster than server-relayed WebSocket (20-100ms). This exceeds the sub-200ms requirement for the most common use case.

2. **Reduced server bandwidth for DMs:** Message payloads flow directly between peers, eliminating server bandwidth costs for the majority of chat traffic. Server only handles signaling (small SDP/ICE payloads).

3. **Graceful degradation:** When P2P connections fail (NAT issues, firewalls), the WebSocket relay provides a reliable fallback. Users experience slightly higher latency but no loss of functionality.

4. **Scalable group chats:** Using WebSocket relay for groups avoids the O(n²) connection problem of WebRTC mesh. The server can efficiently broadcast to 50+ participants using a single connection per client.

5. **Simplified presence system:** WebSocket connections provide natural presence detection through connection state. No separate heartbeat infrastructure is needed beyond WebSocket ping/pong frames.

6. **Alignment with project vision:** The original chatta concept was a "WebRTC client." This decision honors that vision while pragmatically addressing the limitations of pure P2P for group scenarios.

7. **Future-proof architecture:** The hybrid design allows incremental migration. We can start with WebSocket-only and add WebRTC later, or vice versa. The abstraction layer keeps transport details isolated.

8. **Security by default:** WebRTC mandates DTLS encryption for all data channels. WebSocket connections use WSS (TLS). Both provide strong in-transit encryption without additional configuration.

### Negative Consequences

1. **Increased implementation complexity:** Managing two transport protocols (WebRTC + WebSocket) requires more code, more testing, and more operational knowledge than a single-protocol approach. The signaling layer adds a distributed systems component.

2. **NAT traversal challenges:** WebRTC requires STUN/TURN servers for NAT traversal. This introduces additional infrastructure (coturn) and potential costs for TURN bandwidth when direct P2P fails (~20% of connections).

3. **Debugging complexity:** Issues can occur in either transport layer, the signaling layer, or the interaction between them. Debugging "why isn't my message arriving" requires checking WebRTC state, WebSocket state, and signaling state.

4. **Mobile browser limitations:** WebRTC support on mobile browsers is good but not perfect. iOS Safari has known issues with data channel reliability under network transitions. Android Chrome is more reliable but still has edge cases.

5. **Connection state management:** Clients must manage the state machine for both WebRTC (new → connecting → connected → disconnected → failed → closed) and WebSocket (connecting → open → closing → closed), plus the transition logic between them.

6. **Testing overhead:** End-to-end tests must cover P2P paths, relay paths, fallback transitions, and all failure modes. This significantly increases the test matrix compared to a single-protocol approach.

7. **Operational monitoring:** Monitoring must track WebRTC connection quality (ICE state, data channel state, bytes sent/received), WebSocket connection health, and signaling server performance. More dashboards, more alerts.

8. **Browser compatibility matrix:** WebRTC API differences between browsers require polyfills or feature detection. The pion/webrtc library in Go is well-maintained but must be kept in sync with browser implementations.

---

## Technical Details

### WebRTC Data Channel Configuration

```go
// Reliable ordered channel for messages
ordered := true
dataChannelConfig := &webrtc.DataChannelInit{
    Ordered: &ordered,
    // Default: reliable (unlimited retransmits)
}

// Unordered channel for presence/typing
ordered = false
maxPacketLifeTime := uint16(3000) // 3 seconds
presenceChannelConfig := &webrtc.DataChannelInit{
    Ordered:         &ordered,
    MaxPacketLifeTime: &maxPacketLifeTime,
}
```

### WebSocket Message Format

```typescript
interface WSMessage {
  id: string;          // UUID v4
  type: string;        // Event type
  room_id: string;     // Room identifier
  author_id: string;   // Sender user ID
  payload: unknown;    // Event-specific data
  timestamp: number;   // Unix milliseconds
  sequence?: number;   // Server-assigned sequence number
}

// Example: new message
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "type": "message",
  "room_id": "room-general",
  "author_id": "user-alice",
  "payload": {
    "content": "Hello, world!",
    "type": "text"
  },
  "timestamp": 1712188800000,
  "sequence": 42
}
```

### Transport Abstraction Layer

```typescript
// lib/transport/interface.ts
export interface Transport {
  connect(): Promise<void>;
  disconnect(): void;
  send(roomId: string, message: unknown): Promise<void>;
  onMessage(callback: (message: unknown) => void): void;
  onStateChange(callback: (state: TransportState) => void): void;
  getState(): TransportState;
}

export type TransportState =
  | 'disconnected'
  | 'connecting'
  | 'connected'
  | 'reconnecting'
  | 'failed';

// lib/transport/manager.ts
export class TransportManager {
  private primary: Transport;   // WebRTC for DMs
  private fallback: Transport;  // WebSocket for groups/fallback

  async sendMessage(roomId: string, message: unknown): Promise<void> {
    const transport = this.selectTransport(roomId);
    try {
      await transport.send(roomId, message);
    } catch (error) {
      // Fall back to WebSocket
      await this.fallback.send(roomId, message);
    }
  }

  private selectTransport(roomId: string): Transport {
    const room = this.roomStore.get(roomId);
    if (room?.participantCount === 2 && this.primary.getState() === 'connected') {
      return this.primary;
    }
    return this.fallback;
  }
}
```

### ICE Server Configuration

```go
config := webrtc.Configuration{
    ICEServers: []webrtc.ICEServer{
        // Google's public STUN servers (free)
        {
            URLs: []string{
                "stun:stun.l.google.com:19302",
                "stun:stun1.l.google.com:19302",
            },
        },
        // Self-hosted TURN server (for when STUN fails)
        {
            URLs:       []string{"turn:turn.chatta.example.com:3478"},
            Username:   generateTurnUsername(),
            Credential: generateTurnCredential(),
            CredentialType: webrtc.ICECredentialTypeTimestamp,
        },
    },
    ICETransportPolicy: webrtc.ICETransportPolicyAll,
}
```

---

## Alternatives Considered

### Alternative 1: WebSocket Only

**Description:** Use WebSocket for all real-time communication, including DMs and group chats.

**Pros:**
- Simpler implementation (single protocol)
- No NAT traversal needed
- Easier debugging and monitoring
- Better mobile browser support
- Lower operational complexity

**Cons:**
- Higher latency for DMs (server relay hop)
- All message traffic consumes server bandwidth
- Does not align with original WebRTC project vision
- Server becomes bottleneck at scale

**Why Rejected:** The original project vision is WebRTC-based, and the latency advantage of P2P for DMs is significant. The added complexity is justified by the performance benefits.

### Alternative 2: WebRTC Only (Full Mesh)

**Description:** Use WebRTC data channels for all communication, including group chats.

**Pros:**
- Lowest latency for all scenarios
- No server bandwidth for message relay
- Consistent protocol across all features

**Cons:**
- O(n²) connections for group chats (infeasible beyond ~5 users)
- Complex connection management
- High failure rate in group scenarios
- No graceful degradation path

**Why Rejected:** The mesh topology is mathematically infeasible for group chats. A 10-user group requires 45 connections, which exceeds browser and network limits.

### Alternative 3: WebRTC with SFU

**Description:** Use a Selective Forwarding Unit (SFU) server to relay WebRTC streams for group chats.

**Pros:**
- WebRTC for all communication
- O(n) connections instead of O(n²)
- Server can selectively forward streams

**Cons:**
- Additional infrastructure (SFU server)
- Increased server complexity
- Overkill for text-only chat
- Adds operational burden

**Why Rejected:** SFUs are designed for media streaming (audio/video). For text-only chat, WebSocket relay is simpler and equally effective. SFU can be added later if video/audio is introduced.

### Alternative 4: MQTT over WebSocket

**Description:** Use MQTT as the application-layer protocol over WebSocket transport.

**Pros:**
- Built-in QoS levels
- Topic-based pub/sub
- Last Will for presence detection
- Lightweight protocol

**Cons:**
- Additional broker infrastructure
- Not browser-native (requires MQTT.js)
- Overhead for simple chat use case
- Learning curve for team

**Why Rejected:** MQTT's strengths (QoS, retained messages, wildcards) are not needed for chat. The additional broker infrastructure adds complexity without proportional benefit.

---

## Implementation Notes

### Phase 1: WebSocket Foundation

Start with WebSocket-only implementation to establish the messaging core:

1. Implement Go WebSocket server with hub pattern
2. Implement Svelte WebSocket client with reconnection
3. Build message CRUD over WebSocket
4. Add presence detection via connection state
5. Implement typing indicators

### Phase 2: WebRTC Integration

Add WebRTC for DMs:

1. Integrate pion/webrtc in Go backend
2. Implement signaling protocol over WebSocket
3. Add WebRTC data channel support in Svelte frontend
4. Implement ICE candidate exchange
5. Add fallback logic (WebRTC → WebSocket)

### Phase 3: Production Readiness

1. Deploy TURN server (coturn)
2. Add connection quality monitoring
3. Implement transport metrics
4. Add automated failover testing
5. Performance benchmarking

### Key Libraries

| Layer | Library | Version | Purpose |
|-------|---------|---------|---------|
| Go WebRTC | github.com/pion/webrtc/v4 | Latest | WebRTC implementation |
| Go WebSocket | github.com/gorilla/websocket | Latest | WebSocket server |
| Svelte WebRTC | Native RTCPeerConnection | Browser native | WebRTC client |
| Svelte WebSocket | Native WebSocket | Browser native | WebSocket client |
| TURN Server | coturn | Latest | NAT traversal |

---

## Cross-References

- **SOTA Research:** [REALTIME_CHAT_SOTA.md](../research/REALTIME_CHAT_SOTA.md) - Comprehensive protocol analysis
- **ADR-002:** [ADR-002-message-storage.md](./ADR-002-message-storage.md) - Message storage strategy (depends on this transport decision)
- **ADR-003:** [ADR-003-presence-system.md](./ADR-003-presence-system.md) - Presence system design (uses WebSocket connection state)
- **SPEC.md:** [../../SPEC.md](../../SPEC.md) - System specification (transport layer section)
- **PRD.md:** [../../PRD.md](../../PRD.md) - Product requirements (E1: Real-Time Messaging)
- **FUNCTIONAL_REQUIREMENTS.md:** [../../FUNCTIONAL_REQUIREMENTS.md](../../FUNCTIONAL_REQUIREMENTS.md) - FR-WEBRTC requirements

---

*This ADR was accepted on 2026-04-03 by the Phenotype Architecture Team.*