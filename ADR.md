# ADR — chatta

## ADR-001 — WebRTC Data Channels for Real-Time Messaging

**Status:** Accepted

**Context:** Need sub-200ms message delivery without polling. Options are WebSockets, Server-Sent Events, or WebRTC.

**Decision:** Use WebRTC data channels for peer-to-peer message transport. A Go signaling server coordinates initial peer connection setup.

**Rationale:** WebRTC data channels provide the lowest latency path once connected. No server relay hop for message payloads after handshake. Aligns with the original "WebRTC client" project intent.

**Alternatives Considered:**
- WebSockets: simpler but all traffic relays through server; higher server load at scale
- SSE: unidirectional; not suitable for bidirectional chat

---

## ADR-002 — Svelte Frontend

**Status:** Accepted

**Context:** Need a reactive UI framework for the chat client with minimal bundle overhead.

**Decision:** Use SvelteKit (Svelte) for the frontend.

**Rationale:** Svelte compiles to minimal vanilla JS with no virtual DOM overhead. Reactive state management is built-in. Fast initial load.

**Alternatives Considered:**
- React: heavier runtime
- Vue: similar to Svelte but heavier

---

## ADR-003 — Go Backend / Signaling Server

**Status:** Accepted

**Context:** Signaling server needs to handle WebRTC offer/answer exchange, ICE candidates, and message persistence.

**Decision:** Use Go for the backend signaling server.

**Rationale:** Go concurrency model (goroutines) is well-suited for handling many simultaneous WebRTC signaling connections. Low memory footprint.

**Alternatives Considered:**
- Node.js: common choice for WebRTC signaling but single-threaded
- Rust: higher implementation complexity for a signaling server

---

## ADR-004 — Per-User Access Protections Enforced Server-Side

**Status:** Accepted

**Context:** DMs and group chats must be private. Client-side checks are insufficient.

**Decision:** All access checks for DM content are enforced in the backend. Any request for DM content validates that the authenticated user is a participant.

**Rationale:** Client-side checks can be bypassed. Server is the authority.

---

## ADR-005 — Message History Persistence

**Status:** Accepted

**Context:** Users expect to see prior messages when joining a channel or opening a DM.

**Decision:** All messages are persisted in a server-side database. History is loaded on channel/DM open.

**Rationale:** WebRTC data channels are ephemeral; persistence requires server storage. A database is the correct place for durable message state.

**Alternatives Considered:**
- Client-side localStorage: loses history when switching devices
- No persistence: unacceptable UX
