# chatta — SPEC.md

## Overview

chatta is a WebRTC-based real-time chat application supporting peer-to-peer messaging, threads, direct messages (DMs), and group chats with by-user access protections.

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         chatta                                   │
├─────────────────────────────────────────────────────────────────┤
│  ┌──────────────────────────────────────────────────────────┐  │
│  │                   Frontend (SvelteKit)                    │  │
│  │  ┌─────────────┐  ┌─────────────┐  ┌──────────────────┐ │  │
│  │  │    Chat     │ │   Thread    │ │      DM/GC         │ │  │
│  │  │    View     │ │   View      │ │     Views          │ │  │
│  │  │             │ │             │ │                    │ │  │
│  │  │ • Messages  │ │ • Replies   │ │ • Private chats    │ │  │
│  │  │ • Edit/Del  │ │ • Nested    │ │ • Group rooms      │ │  │
│  │  │ • History   │ │             │ │ • Access control   │ │  │
│  │  └─────────────┘  └─────────────┘  └──────────────────┘ │  │
│  └──────────────────────────────────────────────────────────┘  │
│                              │                                   │
│  ┌───────────────────────────┴──────────────────────────────┐  │
│  │              WebRTC Signaling Layer                       │  │
│  │  ┌────────────┐ ┌────────────┐ ┌────────────┐           │  │
│  │  │   Peer     │ │  Signal    │ │   ICE      │           │  │
│  │  │Connection  │ │  Server    │ │  (STUN/   │           │  │
│  │  │  (P2P)     │ │  (WebSock) │ │  TURN)    │           │  │
│  │  └────────────┘ └────────────┘ └────────────┘           │  │
│  └──────────────────────────────────────────────────────────┘  │
│                              │                                   │
│  ┌───────────────────────────┴──────────────────────────────┐  │
│  │                   Backend (Go)                            │  │
│  │  ┌────────────┐ ┌────────────┐ ┌────────────┐           │  │
│  │  │   Message   │ │   User     │ │   Room     │           │  │
│  │  │   Store     │ │   Service  │ │   Manager  │           │  │
│  │  │ (Persist)  │ │            │ │            │           │  │
│  │  └────────────┘ └────────────┘ └────────────┘           │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

---

## Components

### Frontend Components

| Component | Responsibility | Tech |
|-----------|----------------|------|
| `ChatView` | Main message display | Svelte + CSS |
| `MessageInput` | Compose, edit, delete | Svelte stores |
| `ThreadView` | Nested reply threads | Recursive Svelte |
| `RoomList` | DM/GC list with presence | Svelte + WS |
| `UserPanel` | Profile, settings | Svelte + forms |

### Backend Services

| Service | Responsibility | Interface |
|---------|----------------|-----------|
| `SignalServer` | WebRTC handshake | WebSocket |
| `MessageStore` | Message persistence | Go interface |
| `RoomManager` | Room lifecycle | REST + WS |
| `AuthService` | User auth | JWT tokens |

---

## Data Models

### Message

```typescript
interface Message {
  id: string;
  roomId: string;
  authorId: string;
  content: string;
  type: 'text' | 'image' | 'file';
  threadParentId?: string;  // null = top-level
  editedAt?: Date;
  deletedAt?: Date;
  createdAt: Date;
}

interface Thread {
  parentMessageId: string;
  replyCount: number;
  lastReplyAt: Date;
  participants: string[];
}
```

### Room (DM or Group Chat)

```typescript
interface Room {
  id: string;
  type: 'dm' | 'group';
  name?: string;           // null for DMs
  participants: Participant[];
  createdAt: Date;
  settings: RoomSettings;
}

interface Participant {
  userId: string;
  role: 'owner' | 'admin' | 'member';
  joinedAt: Date;
  lastReadAt: Date;
}

interface RoomSettings {
  allowInvites: boolean;
  requireApproval: boolean;
  retentionDays: number;
}
```

### User & Presence

```typescript
interface User {
  id: string;
  username: string;
  displayName: string;
  avatarUrl?: string;
  status: 'online' | 'away' | 'offline';
  lastSeenAt: Date;
  publicKey: string;  // For E2E encryption
}

interface Presence {
  userId: string;
  status: 'online' | 'away' | 'offline';
  currentRoomId?: string;
  typingIn?: string;
}
```

---

## Stack

| Layer | Technology | Version |
|-------|------------|---------|
| Frontend | SvelteKit | Latest |
| Language | TypeScript | 5.x |
| Styling | CSS/Tailwind | - |
| Backend | Go | 1.21+ |
| Real-time | WebRTC + WebSocket | - |
| Database | SQLite/Postgres | - |
| Auth | JWT | - |

---

## WebRTC Flow

```
1. User A wants to message User B
   ↓
2. Both connect to Signal Server (WebSocket)
   ↓
3. A sends offer → Server → B
   ↓
4. B sends answer → Server → A
   ↓
5. ICE candidates exchanged
   ↓
6. P2P connection established
   ↓
7. Messages flow directly (encrypted)
   ↓
8. Server persists messages for history
```

---

## API Contract

### REST Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/rooms` | GET | List user's rooms |
| `/api/rooms` | POST | Create new room |
| `/api/rooms/:id/messages` | GET | Fetch message history |
| `/api/rooms/:id/messages` | POST | Send message (via WS preferred) |
| `/api/messages/:id` | PATCH | Edit message |
| `/api/messages/:id` | DELETE | Delete message |
| `/api/users/:id` | GET | User profile |

### WebSocket Events

| Direction | Event | Payload |
|-----------|-------|---------|
| C→S | `join_room` | `{ roomId }` |
| C→S | `send_message` | `{ roomId, content, threadParentId? }` |
| C→S | `typing` | `{ roomId }` |
| S→C | `message` | Message object |
| S→C | `presence_update` | Presence object |
| S→C | `message_edited` | `{ messageId, newContent }` |
| S→C | `message_deleted` | `{ messageId }` |

---

## Security

| Feature | Implementation |
|---------|----------------|
| Message encryption | WebRTC DTLS + optional E2E |
| Access control | Room-level participant roles |
| DM protections | By-user invitation required |
| File uploads | Type validation, size limits |
| Rate limiting | Per-user message rate |

---

## Performance

| Metric | Target |
|--------|--------|
| Message delivery | <100ms (P2P) |
| History fetch | <500ms (first 50) |
| Video/audio latency | <300ms |
| Concurrent rooms | 100+ per server |

---

## Project Structure

```
chatta/
├── frontend/                 # SvelteKit app
│   ├── src/
│   │   ├── routes/          # Pages
│   │   ├── lib/
│   │   │   ├── components/  # Svelte components
│   │   │   ├── stores/      # State management
│   │   │   └── webrtc/      # WebRTC client
│   │   └── app.html
│   └── package.json
├── backend/                  # Go server
│   ├── cmd/server/          # Entry point
│   ├── internal/
│   │   ├── signaling/       # WebSocket signaling
│   │   ├── message/         # Message storage
│   │   └── room/            # Room management
│   └── go.mod
├── docs/                     # Documentation
└── start                     # Dev startup script
```

---

## Features

| Feature | Status | Notes |
|---------|--------|-------|
| Send messages | ✅ | P2P + persistence |
| Edit messages | ✅ | In-place update |
| Delete messages | ✅ | Soft delete |
| View history | ✅ | Paginated fetch |
| Create threads | ✅ | Nested replies |
| DMs | ✅ | User-to-user |
| Group chats | ✅ | Multi-user rooms |
| Access control | ✅ | By-user protections |
| File attachments | 🔄 | PNG, JPEG support |
| GIF support | ⏳ | Planned |
| Video calls | ⏳ | WebRTC extension |
| E2E encryption | ⏳ | Signal Protocol |

---

## References

- [WebRTC Documentation](https://webrtc.org/getting-started/)
- [SvelteKit Docs](https://kit.svelte.dev/docs)
- [Go WebSocket](https://github.com/gorilla/websocket)
