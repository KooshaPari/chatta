# chatta — Comprehensive Specification

**Document ID:** PHENOTYPE_CHATTA_SPEC_001  
**Status:** Active  
**Last Updated:** 2026-04-03  
**Author:** Phenotype Architecture Team  
**Version:** 2.0.0

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [System Architecture](#2-system-architecture)
3. [Functionality Specification](#3-functionality-specification)
4. [Technical Architecture](#4-technical-architecture)
5. [Data Models](#5-data-models)
6. [API Reference](#6-api-reference)
7. [Real-Time Protocol Specification](#7-real-time-protocol-specification)
8. [Error Handling](#8-error-handling)
9. [Security](#9-security)
10. [Performance Requirements](#10-performance-requirements)
11. [Deployment Architecture](#11-deployment-architecture)
12. [Testing Strategy](#12-testing-strategy)
13. [Observability](#13-observability)
14. [Migration and Compatibility](#14-migration-and-compatibility)
15. [Glossary](#15-glossary)
16. [Appendices](#16-appendices)

---

## 1. Project Overview

### 1.1 Purpose

chatta is a WebRTC-based real-time chat application that supports peer-to-peer messaging, group threads, direct messages (DMs), message editing/deletion, and history browsing with per-user access protections. It is part of the Phenotype ecosystem of applications.

### 1.2 Vision

Provide a fast, private, and reliable real-time communication platform that leverages peer-to-peer technology for optimal performance while maintaining the reliability and features users expect from modern chat applications.

### 1.3 Scope

**In Scope:**
- Real-time text messaging (P2P and server-relayed)
- Direct messages (DMs) between two users
- Group chats with 3+ participants
- Threaded replies within rooms
- Message editing and deletion
- Message history with pagination
- User presence detection (online/away/offline)
- Typing indicators
- Per-user access controls
- User authentication and session management
- File attachments (images, documents)

**Out of Scope (Future Phases):**
- End-to-end encryption (Signal Protocol)
- Voice/video calls
- Mobile native applications
- GIF/sticker support
- Message reactions
- Rich text formatting (Markdown)
- Bot/integration platform
- Federation with other chat systems

### 1.4 Design Principles

| Principle | Description |
|-----------|-------------|
| **P2P First** | Use peer-to-peer communication when possible for lowest latency |
| **Graceful Degradation** | Fall back to server relay when P2P is unavailable |
| **Security by Default** | All communication encrypted; access controls enforced server-side |
| **Simplicity** | Prefer simple, proven solutions over complex alternatives |
| **Observability** | All systems must be monitorable and debuggable |
| **Extensibility** | Design for future features without breaking changes |

### 1.4 Target Users

| User Type | Description | Primary Use Case |
|-----------|-------------|------------------|
| Individual | Personal communication | DMs with friends |
| Team | Small group collaboration | Group chats, threads |
| Community | Larger group discussions | Public rooms, channels |

### 1.5 Key Metrics

| Metric | Target | Measurement |
|--------|--------|-------------|
| Message delivery latency (P2P) | <100ms | P50, same region |
| Message delivery latency (relay) | <200ms | P50 |
| Message delivery reliability | 99.9% | At-least-once delivery |
| Presence update latency | <500ms | P95 |
| History load time (50 messages) | <500ms | P95 |
| Concurrent connections per server | 10,000 | Sustained |
| Uptime | 99.9% | Monthly |

---

## 2. System Architecture

### 2.1 High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│                            chatta System                                │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  ┌──────────────────────────────────────────────────────────────────┐   │
│  │                        Client Tier                                │   │
│  │                                                                    │   │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────────┐ │   │
│  │  │   Browser    │  │   Browser    │  │       Browser            │ │   │
│  │  │  (Desktop)   │  │   (Mobile)   │  │      (Tablet)            │ │   │
│  │  │              │  │              │  │                          │ │   │
│  │  │  SvelteKit   │  │  SvelteKit   │  │      SvelteKit           │ │   │
│  │  │  + WebRTC    │  │  + WebRTC    │  │      + WebRTC            │ │   │
│  │  │  + WebSocket │  │  + WebSocket │  │      + WebSocket         │ │   │
│  │  └──────┬───────┘  └──────┬───────┘  └────────────┬─────────────┘ │   │
│  │         │                 │                        │               │   │
│  └─────────┼─────────────────┼────────────────────────┼───────────────┘   │
│            │                 │                        │                   │
│  ┌─────────▼─────────────────▼────────────────────────▼───────────────┐   │
│  │                        Transport Layer                              │   │
│  │                                                                      │   │
│  │  ┌──────────────────────────────────────────────────────────────┐   │   │
│  │  │                    WebRTC Data Channels                       │   │   │
│  │  │  (P2P for DMs - lowest latency, no server relay)             │   │   │
│  │  └──────────────────────────────────────────────────────────────┘   │   │
│  │  ┌──────────────────────────────────────────────────────────────┐   │   │
│  │  │                    WebSocket Connections                       │   │   │
│  │  │  (Signaling + Group Chat Relay + Presence + Fallback)        │   │   │
│  │  └──────────────────────────────────────────────────────────────┘   │   │
│  │  ┌──────────────────────────────────────────────────────────────┐   │   │
│  │  │                    REST API (HTTPS)                            │   │   │
│  │  │  (Auth, History, Search, User Management)                    │   │   │
│  │  └──────────────────────────────────────────────────────────────┘   │   │
│  └──────────────────────────────────────────────────────────────────┘   │
│            │                 │                        │                   │
│  ┌─────────▼─────────────────▼────────────────────────▼───────────────┐   │
│  │                        Server Tier                                  │   │
│  │                                                                      │   │
│  │  ┌──────────────────────────────────────────────────────────────┐   │   │
│  │  │                     Go Backend Server                         │   │   │
│  │  │                                                               │   │   │
│  │  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐  │   │   │
│  │  │  │  Signaling  │  │  Message    │  │    Room Manager     │  │   │   │
│  │  │  │  Server     │  │  Store      │  │                     │  │   │   │
│  │  │  │  (WebSocket)│  │  (PostgreSQL)│ │                     │  │   │   │
│  │  │  └─────────────┘  └─────────────┘  └─────────────────────┘  │   │   │
│  │  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐  │   │   │
│  │  │  │  Presence   │  │   Auth      │  │    File Handler     │  │   │   │
│  │  │  │  Manager    │  │   Service   │  │    (Upload/Download)│  │   │   │
│  │  │  └─────────────┘  └─────────────┘  └─────────────────────┘  │   │   │
│  │  │                                                               │   │   │
│  │  │  ┌─────────────────────────────────────────────────────────┐ │   │   │
│  │  │  │              WebRTC Manager (pion/webrtc)                │ │   │   │
│  │  │  │  • Peer Connection Management                           │ │   │   │
│  │  │  │  • ICE Candidate Exchange                               │ │   │   │
│  │  │  │  • Data Channel Orchestration                           │ │   │   │
│  │  │  └─────────────────────────────────────────────────────────┘ │   │   │
│  │  └──────────────────────────────────────────────────────────────┘   │   │
│  └──────────────────────────────────────────────────────────────────┘   │
│            │                                                              │
│  ┌─────────▼──────────────────────────────────────────────────────────┐   │
│  │                        Storage Tier                                 │   │
│  │                                                                      │   │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────────┐   │   │
│  │  │  PostgreSQL  │  │  File Store  │  │      TURN Server         │   │   │
│  │  │              │  │  (Local/     │  │      (coturn)            │   │   │
│  │  │  • Messages  │  │   S3)        │  │                          │   │   │
│  │  │  • Users     │  │              │  │  • NAT Traversal         │   │   │
│  │  │  • Rooms     │  │  • Images    │  │  • P2P Fallback          │   │   │
│  │  │  • Presence  │  │  • Documents │  │  • Relay when blocked    │   │   │
│  │  │  (last_seen) │  │              │  │                          │   │   │
│  │  └──────────────┘  └──────────────┘  └──────────────────────────┘   │   │
│  └──────────────────────────────────────────────────────────────────┘   │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

### 2.2 Component Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                     Frontend (SvelteKit)                         │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌────────────────────────────────────────────────────────────┐  │
│  │                     Routes                                  │  │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌────────────┐ │  │
│  │  │  /login  │  │  /chat   │  │  /rooms  │  │  /settings │ │  │
│  │  └──────────┘  └──────────┘  └──────────┘  └────────────┘ │  │
│  └────────────────────────────────────────────────────────────┘  │
│                                                                  │
│  ┌────────────────────────────────────────────────────────────┐  │
│  │                   Components                                │  │
│  │  ┌────────────┐  ┌────────────┐  ┌──────────────────────┐ │  │
│  │  │ MessageList│  │MessageInput│  │    RoomSidebar       │ │  │
│  │  │            │  │            │  │                      │ │  │
│  │  │ • Virtual  │  │ • Compose  │  │ • Room list          │ │  │
│  │  │   scroll   │  │ • Edit     │  │ • Presence indicators│ │  │
│  │  │ • Grouping │  │ • Delete   │  │ • Unread counts      │ │  │
│  │  │ • Threads  │  │ • Send     │  │ • Create room        │ │  │
│  │  └────────────┘  └────────────┘  └──────────────────────┘ │  │
│  │  ┌────────────┐  ┌────────────┐  ┌──────────────────────┐ │  │
│  │  │ ThreadView │  │ UserPanel  │  │    TypingIndicator   │ │  │
│  │  │            │  │            │  │                      │ │  │
│  │  │ • Replies  │  │ • Profile  │  │ • Active typers      │ │  │
│  │  │ • Collapse │  │ • Status   │  │ • Debounced updates  │ │  │
│  │  │ • Count    │  │ • Settings │  │ • Room-scoped        │ │  │
│  │  └────────────┘  └────────────┘  └──────────────────────┘ │  │
│  └────────────────────────────────────────────────────────────┘  │
│                                                                  │
│  ┌────────────────────────────────────────────────────────────┐  │
│  │                     Stores                                  │  │
│  │  ┌────────────┐  ┌────────────┐  ┌──────────────────────┐ │  │
│  │  │ authStore  │  │ roomStore  │  │    presenceStore     │ │  │
│  │  │            │  │            │  │                      │ │  │
│  │  │ • User     │  │ • Rooms    │  │ • User statuses      │ │  │
│  │  │ • Token    │  │ • Messages │  │ • Multi-device       │ │  │
│  │  │ • Session  │  │ • Threads  │  │ • Activity tracking  │ │  │
│  │  └────────────┘  └────────────┘  └──────────────────────┘ │  │
│  └────────────────────────────────────────────────────────────┘  │
│                                                                  │
│  ┌────────────────────────────────────────────────────────────┐  │
│  │                  Transport Layer                            │  │
│  │  ┌─────────────┐  ┌─────────────┐  ┌────────────────────┐ │  │
│  │  │ WebRTC      │  │ WebSocket   │  │    REST Client     │ │  │
│  │  │ Manager     │  │ Manager     │  │                    │ │  │
│  │  │             │  │             │  │ • Auth endpoints   │ │  │
│  │  │ • P2P DMs   │  │ • Signaling │  │ • History fetch    │ │  │
│  │  │ • Fallback  │  │ • Groups    │  │ • User profiles    │ │  │
│  │  │ • File xfer │  │ • Presence  │  │ • File upload      │ │  │
│  │  └─────────────┘  └─────────────┘  └────────────────────┘ │  │
│  └────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

### 2.3 Backend Component Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                     Backend (Go)                                 │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌────────────────────────────────────────────────────────────┐  │
│  │                   HTTP Server (net/http)                     │  │
│  │                                                              │  │
│  │  Routes:                                                     │  │
│  │  ┌──────────────────────────────────────────────────────┐   │  │
│  │  │ POST   /api/auth/register      → AuthHandler         │   │  │
│  │  │ POST   /api/auth/login         → AuthHandler         │   │  │
│  │  │ POST   /api/auth/refresh       → AuthHandler         │   │  │
│  │  │ GET    /api/users/:id          → UserHandler         │   │  │
│  │  │ PATCH  /api/users/:id          → UserHandler         │   │  │
│  │  │ GET    /api/rooms              → RoomHandler         │   │  │
│  │  │ POST   /api/rooms              → RoomHandler         │   │  │
│  │  │ GET    /api/rooms/:id          → RoomHandler         │   │  │
│  │  │ GET    /api/rooms/:id/messages → MessageHandler      │   │  │
│  │  │ PATCH  /api/messages/:id       → MessageHandler      │   │  │
│  │  │ DELETE /api/messages/:id       → MessageHandler      │   │  │
│  │  │ POST   /api/upload             → FileHandler         │   │  │
│  │  │ GET    /api/files/:id          → FileHandler         │   │  │
│  │  └──────────────────────────────────────────────────────┘   │  │
│  └────────────────────────────────────────────────────────────┘  │
│                                                                  │
│  ┌────────────────────────────────────────────────────────────┐  │
│  │                   WebSocket Server                           │  │
│  │                                                              │  │
│  │  GET /ws?token=<jwt> → WebSocketHandler                     │  │
│  │                                                              │  │
│  │  Events (Client → Server):                                   │  │
│  │  • auth, join_room, leave_room, send_message                │  │
│  │  • typing_start, typing_stop, heartbeat                     │  │
│  │  • offer, answer, ice_candidate (signaling)                 │  │
│  │  • presence_update                                          │  │
│  │                                                              │  │
│  │  Events (Server → Client):                                   │  │
│  │  • auth_ok, auth_error, message, message_edited             │  │
│  │  • message_deleted, presence_update, typing                 │  │
│  │  • offer, answer, ice_candidate (signaling)                 │  │
│  │  • heartbeat_ack, error                                     │  │
│  └────────────────────────────────────────────────────────────┘  │
│                                                                  │
│  ┌────────────────────────────────────────────────────────────┐  │
│  │                   Services                                   │  │
│  │                                                              │  │
│  │  ┌─────────────┐  ┌─────────────┐  ┌────────────────────┐  │  │
│  │  │ AuthService │  │UserService  │  │   RoomService      │  │  │
│  │  │             │  │             │  │                    │  │  │
│  │  │ • Register  │  │ • GetProfile│  │ • Create           │  │  │
│  │  │ • Login     │  │ • Update    │  │ • Join             │  │  │
│  │  │ • JWT       │  │ • Search    │  │ • Leave            │  │  │
│  │  │ • Refresh   │  │             │  │ • ListMembers      │  │  │
│  │  └─────────────┘  └─────────────┘  └────────────────────┘  │  │
│  │  ┌─────────────┐  ┌─────────────┐  ┌────────────────────┐  │  │
│  │  │MessageService│ │PresenceSvc  │  │   FileService      │  │  │
│  │  │             │  │             │  │                    │  │  │
│  │  │ • Create    │  │ • OnConnect │  │ • Upload           │  │  │
│  │  │ • Edit      │  │ • OnDisconnect│ │ • Download         │  │  │
│  │  │ • Delete    │  │ • Update    │  │ • Validate         │  │  │
│  │  │ • GetHistory│  │ • Broadcast │  │ • Store            │  │  │
│  │  │ • Search    │  │ • GetStatus │  │                    │  │  │
│  │  └─────────────┘  └─────────────┘  └────────────────────┘  │  │
│  └────────────────────────────────────────────────────────────┘  │
│                                                                  │
│  ┌────────────────────────────────────────────────────────────┐  │
│  │                   Repositories                               │  │
│  │                                                              │  │
│  │  ┌─────────────┐  ┌─────────────┐  ┌────────────────────┐  │  │
│  │  │UserRepo     │  │RoomRepo     │  │   MessageRepo      │  │  │
│  │  │             │  │             │  │                    │  │  │
│  │  │ • Create    │  │ • Create    │  │ • Create           │  │  │
│  │  │ • GetByID   │  │ • GetByID   │  │ • GetByRoom        │  │  │
│  │  │ • GetByUser │  │ • GetByUser │  │ • GetThread        │  │  │
│  │  │ • Update    │  │ • AddMember │  │ • Edit             │  │  │
│  │  │ • Verify    │  │ • RemoveMem │  │ • Delete           │  │  │
│  │  └─────────────┘  └─────────────┘  └────────────────────┘  │  │
│  └────────────────────────────────────────────────────────────┘  │
│                                                                  │
│  ┌────────────────────────────────────────────────────────────┐  │
│  │                   Infrastructure                             │  │
│  │                                                              │  │
│  │  ┌─────────────┐  ┌─────────────┐  ┌────────────────────┐  │  │
│  │  │ PostgreSQL  │  │ WebRTC Mgr  │  │   Hub (WS)         │  │  │
│  │  │             │  │             │  │                    │  │  │
│  │  │ • Messages  │  │ • Peers     │  │ • Clients          │  │  │
│  │  │ • Users     │  │ • Channels  │  │ • Broadcast        │  │  │
│  │  │ • Rooms     │  │ • ICE       │  │ • Rooms            │  │  │
│  │  │ • Sequences │  │ • Signaling │  │ • Presence         │  │  │
│  │  └─────────────┘  └─────────────┘  └────────────────────┘  │  │
│  └────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

### 2.4 Deployment Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                     Production Deployment                        │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│                    ┌───────────────┐                            │
│                    │  Load Balancer│                            │
│                    │  (nginx/ALB)  │                            │
│                    └───────┬───────┘                            │
│                            │                                     │
│              ┌─────────────┼─────────────┐                      │
│              │             │             │                       │
│        ┌─────▼─────┐ ┌────▼─────┐ ┌─────▼─────┐                │
│        │  Go Server│ │ Go Server│ │ Go Server │                 │
│        │  (Node 1) │ │ (Node 2) │ │ (Node 3)  │                 │
│        └─────┬─────┘ └────┬─────┘ └─────┬─────┘                │
│              │             │             │                       │
│        ┌─────▼─────────────▼─────────────▼─────┐                │
│        │          Redis Cluster                 │                │
│        │    (Pub/Sub + Session + Presence)      │                │
│        └─────────────────┬─────────────────────┘                │
│                          │                                       │
│        ┌─────────────────▼─────────────────────┐                │
│        │        PostgreSQL Cluster              │                │
│        │    (Primary + Read Replicas)           │                │
│        └───────────────────────────────────────┘                │
│                                                                  │
│        ┌──────────────┐     ┌──────────────┐                    │
│        │  File Store  │     │  TURN Server │                    │
│        │  (S3/Local)  │     │  (coturn)    │                    │
│        └──────────────┘     └──────────────┘                    │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## 3. Functionality Specification

### 3.1 User Authentication (FR-AUTH)

#### 3.1.1 Registration

| Field | Requirement |
|-------|-------------|
| Username | 3-50 characters, alphanumeric + underscore, unique |
| Password | 8+ characters, at least one uppercase, one number |
| Display Name | 1-100 characters, any UTF-8 |
| Email | Valid email format, unique (optional for MVP) |

**Flow:**
```
Client                          Server
  │                               │
  │── POST /api/auth/register ───▶│
  │   {username, password,        │
  │    display_name}              │
  │                               │
  │                               │── Validate input
  │                               │── Check username uniqueness
  │                               │── Hash password (bcrypt)
  │                               │── Create user record
  │                               │── Generate JWT
  │                               │
  │◀── 201 Created ───────────────│
  │   {user_id, username,         │
  │    access_token, refresh_token}│
```

**Error Responses:**

| Status | Code | Message |
|--------|------|---------|
| 400 | VALIDATION_ERROR | "Username must be 3-50 characters" |
| 400 | VALIDATION_ERROR | "Password must be at least 8 characters" |
| 409 | USERNAME_TAKEN | "Username already exists" |
| 500 | INTERNAL_ERROR | "Registration failed" |

#### 3.1.2 Login

**Flow:**
```
Client                          Server
  │                               │
  │── POST /api/auth/login ──────▶│
  │   {username, password}        │
  │                               │
  │                               │── Find user by username
  │                               │── Verify password hash
  │                               │── Generate JWT pair
  │                               │── Record login event
  │                               │
  │◀── 200 OK ────────────────────│
  │   {access_token, refresh_token,│
  │    expires_in, user}          │
```

#### 3.1.3 Token Refresh

```
POST /api/auth/refresh
Authorization: Bearer <refresh_token>

Response:
{
  "access_token": "new_access_token",
  "refresh_token": "new_refresh_token",
  "expires_in": 900
}
```

#### 3.1.4 WebSocket Authentication

```
WS Connection: wss://chatta.example.com/ws?token=<access_token>

Server validates JWT on connection:
- Valid → AUTH_OK with user info
- Expired → AUTH_ERROR (client should refresh token)
- Invalid → AUTH_ERROR + close connection
```

### 3.2 Real-Time Messaging (FR-MSG)

#### 3.2.1 Send Message

**Via WebRTC (DMs):**
```
Client A ──[Data Channel]──▶ Client B
             Message {
               id: "uuid",
               content: "Hello!",
               room_id: "dm-alice-bob",
               author_id: "alice",
               timestamp: 1712188800000,
               type: "text"
             }

Both clients also persist to server via REST:
POST /api/rooms/:id/messages
```

**Via WebSocket (Groups):**
```
Client ──[WebSocket]──▶ Server ──[Broadcast]──▶ All Room Members
         send_message {
           room_id: "group-dev",
           content: "Hello team!",
           thread_parent_id: null
         }
```

#### 3.2.2 Edit Message

```
Client ──[Transport]──▶ Server
         edit_message {
           message_id: "uuid",
           new_content: "Updated text"
         }

Server:
1. Verify author_id matches message author
2. Verify message not deleted
3. Update message content
4. Record edit in message_edits table
5. Broadcast message_edited to room

All clients receive:
{
  type: "message_edited",
  payload: {
    message_id: "uuid",
    new_content: "Updated text",
    edited_at: "2026-04-03T10:00:00Z"
  }
}
```

#### 3.2.3 Delete Message

```
Client ──[Transport]──▶ Server
         delete_message {
           message_id: "uuid"
         }

Server:
1. Verify author_id matches message author
2. Soft delete (set deleted_at, change content)
3. Broadcast message_deleted to room

All clients receive:
{
  type: "message_deleted",
  payload: {
    message_id: "uuid",
    deleted_at: "2026-04-03T10:00:00Z"
  }
}
```

#### 3.2.4 Message History

```
GET /api/rooms/:id/messages?cursor=<sequence_num>&limit=50

Response:
{
  "messages": [
    {
      "id": "uuid",
      "room_id": "uuid",
      "author_id": "uuid",
      "content": "Hello!",
      "message_type": "text",
      "parent_id": null,
      "edited_at": null,
      "deleted_at": null,
      "sequence_num": 42,
      "created_at": "2026-04-03T10:00:00Z",
      "author": {
        "id": "uuid",
        "username": "alice",
        "display_name": "Alice"
      }
    }
  ],
  "has_more": true,
  "next_cursor": 41
}
```

### 3.3 Threads and Channels (FR-THREAD)

#### 3.3.1 Thread Model

```
Message Thread Structure:

Room: "general"
├── Message 1: "What do you think about the new design?"
│   ├── Reply 1.1: "I love the color scheme!"
│   ├── Reply 1.2: "Agreed, much better than before"
│   └── Reply 1.3: "Can we also change the font?"
│       └── Reply 1.3.1: "Sure, I'll create a ticket"
├── Message 2: "Meeting at 3pm today"
│   └── Reply 2.1: "I'll be 5 min late"
└── Message 3: "Deployed to staging"
```

**Data Model:**
```typescript
interface ThreadSummary {
  parentMessageId: string;
  replyCount: number;
  lastReplyAt: Date;
  lastReplyAuthor: string;
  participants: string[];
  unreadCount: number;
}
```

#### 3.3.2 Thread Operations

| Operation | Endpoint | Description |
|-----------|----------|-------------|
| Get thread replies | `GET /api/messages/:id/replies` | Fetch replies for a parent message |
| Create reply | `POST /api/rooms/:id/messages` | Send with `parent_id` set |
| Get thread summary | `GET /api/rooms/:id/threads` | List all threads in room |

### 3.4 Direct Messages (FR-DM)

#### 3.4.1 DM Creation

```
POST /api/rooms
{
  "type": "dm",
  "participant_ids": ["user-bob"]
}

Response:
{
  "id": "dm-alice-bob",
  "type": "dm",
  "participants": [
    {"user_id": "alice", "role": "member"},
    {"user_id": "bob", "role": "member"}
  ],
  "created_at": "2026-04-03T10:00:00Z"
}
```

**DM Rules:**
- Only 2 participants allowed
- Cannot create duplicate DM (check existing)
- Both users can send messages
- No one else can join or view

#### 3.4.2 DM Access Control

```
Access Check Flow:

Request: GET /api/rooms/:id/messages
              │
              ▼
        ┌─────────────┐
        │ Is user     │
        │ authenticated?│
        └──────┬──────┘
               │ Yes
               ▼
        ┌─────────────┐
        │ Is room type│
        │ "dm"?       │
        └──────┬──────┘
               │ Yes
               ▼
        ┌─────────────┐
        │ Is user a   │
        │ participant? │
        └──────┬──────┘
               │ Yes          │ No
               ▼              ▼
        ┌─────────────┐  ┌─────────────┐
        │ Return      │  │ 403         │
        │ messages    │  │ Forbidden   │
        └─────────────┘  └─────────────┘
```

### 3.5 Group Chats

#### 3.5.1 Group Chat Creation

```
POST /api/rooms
{
  "type": "group",
  "name": "Development Team",
  "participant_ids": ["user-bob", "user-charlie", "user-dave"],
  "settings": {
    "allow_invites": true,
    "require_approval": false,
    "retention_days": 0
  }
}
```

#### 3.5.2 Group Chat Roles

| Role | Permissions |
|------|-------------|
| Owner | All permissions, transfer ownership, delete room |
| Admin | Invite/remove members, edit room settings |
| Member | Send messages, react, create threads |

#### 3.5.3 Group Chat Operations

| Operation | Required Role | Description |
|-----------|--------------|-------------|
| Send message | Member | Post to group |
| Edit own message | Member | Edit own messages |
| Delete own message | Member | Delete own messages |
| Invite member | Admin | Add new participant |
| Remove member | Admin | Remove participant |
| Edit room name | Admin | Change room name |
| Delete room | Owner | Permanently delete |
| Transfer ownership | Owner | Give ownership to admin |

### 3.6 Presence System

#### 3.6.1 Presence States

| State | Trigger | Display |
|-------|---------|---------|
| Online | WebSocket connected + activity within 5min | Green dot |
| Away | No activity for 5+ minutes | Yellow dot |
| Offline | WebSocket disconnected | Gray dot |
| Do Not Disturb | User-set | Red dot with minus |
| Invisible | User-set | Appears offline |

#### 3.6.2 Presence API

```
// Get presence for multiple users
GET /api/presence?user_ids=id1,id2,id3

Response:
{
  "presence": {
    "id1": {
      "status": "online",
      "last_seen_at": "2026-04-03T10:00:00Z",
      "devices": [
        {"type": "desktop", "browser": "Chrome"}
      ]
    },
    "id2": {
      "status": "away",
      "last_seen_at": "2026-04-03T09:55:00Z",
      "devices": [
        {"type": "mobile", "browser": "Safari"}
      ]
    }
  }
}
```

### 3.7 Typing Indicators

```
Typing Indicator Protocol:

1. User starts typing → Client sends typing_start
2. Server broadcasts to room members
3. Other clients show "X is typing..."
4. After 5 seconds of no activity → auto typing_stop
5. User sends message → typing_stop
6. User stops typing for 5s → typing_stop

Debouncing: typing_start sent at most once per second
```

### 3.8 File Attachments

#### 3.8.1 Upload

```
POST /api/upload
Content-Type: multipart/form-data

Fields:
- file: Binary file data
- room_id: Target room
- message_id (optional): Attach to existing message

Supported Types:
- Images: PNG, JPEG, GIF, WebP (max 10MB)
- Documents: PDF, TXT, MD (max 5MB)

Response:
{
  "file_id": "uuid",
  "url": "/api/files/uuid",
  "thumbnail_url": "/api/files/uuid/thumb",
  "mime_type": "image/png",
  "size": 1024000,
  "filename": "screenshot.png"
}
```

#### 3.8.2 Download

```
GET /api/files/:id
Headers: Authorization: Bearer <token>

Response:
- 200: File content with appropriate Content-Type
- 403: User not in room
- 404: File not found
```

---

## 4. Technical Architecture

### 4.1 Technology Stack

| Layer | Technology | Version | Purpose |
|-------|------------|---------|---------|
| Frontend Framework | SvelteKit | Latest | UI framework |
| Language (Frontend) | TypeScript | 5.x+ | Type safety |
| Styling | CSS/Tailwind | Latest | UI styling |
| Backend Language | Go | 1.21+ | Server implementation |
| WebRTC Library | pion/webrtc | v4 | Go WebRTC |
| WebSocket Library | gorilla/websocket | Latest | Go WebSocket |
| Database | PostgreSQL | 15+ | Primary storage |
| Connection Pooler | PgBouncer | Latest | DB connection management |
| TURN Server | coturn | Latest | NAT traversal |
| File Storage | Local/S3 | - | File attachments |
| Build Tool | Vite | Latest | Frontend build |
| Package Manager | Bun | Latest | JS package management |

### 4.2 Project Structure

```
chatta/
├── frontend/                          # SvelteKit application
│   ├── src/
│   │   ├── routes/                    # Page routes
│   │   │   ├── +layout.svelte         # Root layout
│   │   │   ├── +page.svelte           # Landing/login
│   │   │   ├── chat/
│   │   │   │   └── +page.svelte       # Main chat view
│   │   │   ├── rooms/
│   │   │   │   └── +page.svelte       # Room management
│   │   │   └── settings/
│   │   │       └── +page.svelte       # User settings
│   │   ├── lib/
│   │   │   ├── components/            # Reusable components
│   │   │   │   ├── MessageList.svelte
│   │   │   │   ├── MessageInput.svelte
│   │   │   │   ├── MessageBubble.svelte
│   │   │   │   ├── ThreadView.svelte
│   │   │   │   ├── RoomSidebar.svelte
│   │   │   │   ├── UserPanel.svelte
│   │   │   │   ├── TypingIndicator.svelte
│   │   │   │   └── PresenceDot.svelte
│   │   │   ├── stores/                # Svelte stores
│   │   │   │   ├── auth.ts
│   │   │   │   ├── rooms.ts
│   │   │   │   ├── messages.ts
│   │   │   │   └── presence.ts
│   │   │   ├── webrtc/                # WebRTC client
│   │   │   │   ├── peer.ts
│   │   │   │   ├── datachannel.ts
│   │   │   │   └── signaling.ts
│   │   │   ├── websocket/             # WebSocket client
│   │   │   │   ├── manager.ts
│   │   │   │   └── protocol.ts
│   │   │   ├── transport/             # Transport abstraction
│   │   │   │   ├── interface.ts
│   │   │   │   ├── webrtc.ts
│   │   │   │   ├── websocket.ts
│   │   │   │   └── manager.ts
│   │   │   ├── api/                   # REST API client
│   │   │   │   ├── auth.ts
│   │   │   │   ├── messages.ts
│   │   │   │   ├── rooms.ts
│   │   │   │   └── users.ts
│   │   │   ├── types/                 # TypeScript types
│   │   │   │   ├── message.ts
│   │   │   │   ├── room.ts
│   │   │   │   ├── user.ts
│   │   │   │   └── presence.ts
│   │   │   └── utils/                 # Utilities
│   │   │       ├── time.ts
│   │   │       ├── validation.ts
│   │   │       └── format.ts
│   │   ├── app.html
│   │   ├── app.css
│   │   └── hooks.server.ts
│   ├── static/                        # Static assets
│   ├── vite.config.ts
│   ├── svelte.config.js
│   ├── tsconfig.json
│   └── package.json
│
├── backend/                           # Go server
│   ├── cmd/
│   │   └── server/
│   │       └── main.go               # Entry point
│   ├── internal/
│   │   ├── config/                    # Configuration
│   │   │   └── config.go
│   │   ├── server/                    # HTTP server
│   │   │   ├── server.go
│   │   │   └── routes.go
│   │   ├── handler/                   # HTTP handlers
│   │   │   ├── auth.go
│   │   │   ├── user.go
│   │   │   ├── room.go
│   │   │   ├── message.go
│   │   │   ├── file.go
│   │   │   └── websocket.go
│   │   ├── service/                   # Business logic
│   │   │   ├── auth.go
│   │   │   ├── user.go
│   │   │   ├── room.go
│   │   │   ├── message.go
│   │   │   ├── presence.go
│   │   │   └── file.go
│   │   ├── repository/                # Data access
│   │   │   ├── user.go
│   │   │   ├── room.go
│   │   │   └── message.go
│   │   ├── model/                     # Domain models
│   │   │   ├── user.go
│   │   │   ├── room.go
│   │   │   ├── message.go
│   │   │   └── presence.go
│   │   ├── signaling/                 # WebRTC signaling
│   │   │   ├── manager.go
│   │   │   └── protocol.go
│   │   ├── webrtc/                    # WebRTC management
│   │   │   ├── manager.go
│   │   │   └── peer.go
│   │   ├── hub/                       # WebSocket hub
│   │   │   ├── hub.go
│   │   │   └── client.go
│   │   └── middleware/                # HTTP middleware
│   │       ├── auth.go
│   │       ├── cors.go
│   │       ├── logging.go
│   │       └── ratelimit.go
│   ├── migrations/                    # Database migrations
│   │   └── 001_initial_schema.sql
│   ├── go.mod
│   └── go.sum
│
├── docs/                              # Documentation
│   ├── research/
│   │   └── REALTIME_CHAT_SOTA.md
│   ├── adr/
│   │   ├── ADR-001-realtime-protocol.md
│   │   ├── ADR-002-message-storage.md
│   │   └── ADR-003-presence-system.md
│   ├── index.md
│   └── getting-started.md
│
├── deploy/                            # Deployment configs
│   ├── docker-compose.yml
│   ├── Dockerfile.backend
│   ├── Dockerfile.frontend
│   └── nginx.conf
│
├── SPEC.md                            # This file
├── PRD.md                             # Product requirements
├── PLAN.md                            # Implementation plan
├── FUNCTIONAL_REQUIREMENTS.md         # Functional requirements
├── ADR.md                             # Architecture decision log
├── README.md                          # Project readme
├── start                              # Development startup
└── package.json                       # Root package.json
```

### 4.3 Configuration

```yaml
# config.yaml
server:
  host: "0.0.0.0"
  port: 8080
  read_timeout: 15s
  write_timeout: 15s
  idle_timeout: 60s

database:
  host: "localhost"
  port: 5432
  name: "chatta"
  user: "chatta"
  password: "${DB_PASSWORD}"
  max_open_conns: 25
  max_idle_conns: 5
  conn_max_lifetime: 5m

webrtc:
  ice_servers:
    - urls: ["stun:stun.l.google.com:19302"]
    - urls: ["turn:turn.chatta.example.com:3478"]
      username: "${TURN_USERNAME}"
      credential: "${TURN_CREDENTIAL}"
  ice_timeout:
    disconnected: 6s
    failed: 6s
    keepalive: 3s

websocket:
  read_buffer_size: 1024
  write_buffer_size: 1024
  max_message_size: 524288  # 512KB
  pong_wait: 60s
  ping_period: 54s
  write_wait: 10s

auth:
  jwt_secret: "${JWT_SECRET}"
  access_token_ttl: 15m
  refresh_token_ttl: 7d

presence:
  away_timeout: 5m
  cleanup_interval: 1m
  heartbeat_interval: 30s

files:
  max_size: 10485760  # 10MB
  allowed_types:
    - "image/png"
    - "image/jpeg"
    - "image/gif"
    - "image/webp"
    - "application/pdf"
    - "text/plain"
    - "text/markdown"
  storage_path: "./data/files"

rate_limit:
  messages: 100  # per minute
  connections: 10  # per minute
  uploads: 20  # per minute
```

---

## 5. Data Models

### 5.1 User

```typescript
interface User {
  id: string;              // UUID v4
  username: string;        // 3-50 chars, unique
  passwordHash: string;    // bcrypt hash
  displayName: string;     // 1-100 chars
  avatarUrl?: string;      // URL to avatar image
  publicKey?: string;      // For future E2E encryption
  createdAt: Date;
  updatedAt: Date;
  lastSeenAt?: Date;       // Updated on disconnect
}
```

### 5.2 Room

```typescript
interface Room {
  id: string;              // UUID v4
  type: 'dm' | 'group';    // Room type
  name?: string;           // Required for groups, null for DMs
  settings: RoomSettings;
  createdAt: Date;
  updatedAt: Date;
}

interface RoomSettings {
  allowInvites: boolean;   // Members can invite others
  requireApproval: boolean;// New members need approval
  retentionDays: number;   // 0 = forever
}
```

### 5.3 Participant

```typescript
interface Participant {
  id: string;              // UUID v4
  roomId: string;          // FK to rooms
  userId: string;          // FK to users
  role: 'owner' | 'admin' | 'member';
  joinedAt: Date;
  lastReadAt: Date;        // For unread count
}
```

### 5.4 Message

```typescript
interface Message {
  id: string;              // UUID v4
  roomId: string;          // FK to rooms
  authorId: string;        // FK to users
  content: string;         // Max 4096 chars
  messageType: 'text' | 'system' | 'file' | 'image';
  parentId?: string;       // FK to messages (thread)
  editedAt?: Date;
  deletedAt?: Date;        // Soft delete
  sequenceNum: number;     // Per-room ordering
  createdAt: Date;
  updatedAt: Date;
}
```

### 5.5 Message Edit (Audit)

```typescript
interface MessageEdit {
  id: string;              // UUID v4
  messageId: string;       // FK to messages
  oldContent: string;      // Previous content
  editedAt: Date;
  editorId: string;        // FK to users
}
```

### 5.6 File Attachment

```typescript
interface FileAttachment {
  id: string;              // UUID v4
  roomId: string;          // FK to rooms
  uploaderId: string;      // FK to users
  messageId?: string;      // FK to messages (optional)
  filename: string;        // Original filename
  mimeType: string;        // MIME type
  size: number;            // Bytes
  storagePath: string;     // Server storage path
  thumbnailPath?: string;  // For images
  createdAt: Date;
}
```

### 5.7 Entity Relationship Diagram

```
┌──────────────┐       ┌──────────────┐       ┌──────────────┐
│    users     │       │    rooms     │       │ participants │
├──────────────┤       ├──────────────┤       ├──────────────┤
│ id (PK)      │◀──────│ id (PK)      │◀──────│ id (PK)      │
│ username     │       │ type         │       │ room_id (FK) │──▶ rooms
│ password_hash│       │ name         │       │ user_id (FK) │──▶ users
│ display_name │       │ settings     │       │ role         │
│ avatar_url   │       │ created_at   │       │ joined_at    │
│ public_key   │       │ updated_at   │       │ last_read_at │
│ created_at   │       └──────────────┘       └──────────────┘
│ updated_at   │
│ last_seen_at │       ┌──────────────┐
└──────────────┘       │   messages   │
                       ├──────────────┤
┌──────────────┐       │ id (PK)      │
│message_edits │       │ room_id (FK) │──▶ rooms
├──────────────┤       │ author_id    │──▶ users
│ id (PK)      │       │ content      │
│ message_id   │──▶ messages  │ message_type │
│ old_content  │       │ parent_id    │──▶ messages (self)
│ edited_at    │       │ edited_at    │
│ editor_id    │──▶ users  │ deleted_at   │
└──────────────┘       │ sequence_num │
                       │ created_at   │
┌──────────────┐       │ updated_at   │
│file_attach.  │       └──────────────┘
├──────────────┤
│ id (PK)      │
│ room_id (FK) │──▶ rooms
│ uploader_id  │──▶ users
│ message_id   │──▶ messages
│ filename     │
│ mime_type    │
│ size         │
│ storage_path │
│ created_at   │
└──────────────┘
```

---

## 6. API Reference

### 6.1 Authentication Endpoints

#### POST /api/auth/register

Register a new user account.

**Request:**
```json
{
  "username": "alice",
  "password": "SecurePass123",
  "display_name": "Alice Smith"
}
```

**Response (201):**
```json
{
  "user_id": "550e8400-e29b-41d4-a716-446655440000",
  "username": "alice",
  "display_name": "Alice Smith",
  "access_token": "eyJhbGciOiJIUzI1NiIs...",
  "refresh_token": "eyJhbGciOiJIUzI1NiIs...",
  "expires_in": 900
}
```

#### POST /api/auth/login

Authenticate and receive tokens.

**Request:**
```json
{
  "username": "alice",
  "password": "SecurePass123"
}
```

**Response (200):**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIs...",
  "refresh_token": "eyJhbGciOiJIUzI1NiIs...",
  "expires_in": 900,
  "user": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "username": "alice",
    "display_name": "Alice Smith",
    "avatar_url": null,
    "created_at": "2026-04-01T10:00:00Z"
  }
}
```

#### POST /api/auth/refresh

Refresh an expired access token.

**Headers:** `Authorization: Bearer <refresh_token>`

**Response (200):**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIs...",
  "refresh_token": "eyJhbGciOiJIUzI1NiIs...",
  "expires_in": 900
}
```

### 6.2 User Endpoints

#### GET /api/users/:id

Get user profile information.

**Response (200):**
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "username": "alice",
  "display_name": "Alice Smith",
  "avatar_url": "https://chatta.example.com/avatars/alice.png",
  "public_key": null,
  "created_at": "2026-04-01T10:00:00Z"
}
```

#### PATCH /api/users/:id

Update user profile.

**Request:**
```json
{
  "display_name": "Alice J. Smith",
  "avatar_url": "https://chatta.example.com/avatars/new.png"
}
```

### 6.3 Room Endpoints

#### GET /api/rooms

List all rooms the authenticated user is a member of.

**Query Parameters:**
| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| type | string | - | Filter by room type (dm/group) |
| include_unread | boolean | true | Include unread message counts |

**Response (200):**
```json
{
  "rooms": [
    {
      "id": "room-general",
      "type": "group",
      "name": "General",
      "settings": {
        "allow_invites": true,
        "require_approval": false,
        "retention_days": 0
      },
      "unread_count": 5,
      "last_message": {
        "content": "See you tomorrow!",
        "author": "bob",
        "created_at": "2026-04-03T10:00:00Z"
      },
      "created_at": "2026-04-01T10:00:00Z"
    }
  ]
}
```

#### POST /api/rooms

Create a new room.

**Request (DM):**
```json
{
  "type": "dm",
  "participant_ids": ["user-bob"]
}
```

**Request (Group):**
```json
{
  "type": "group",
  "name": "Development Team",
  "participant_ids": ["user-bob", "user-charlie"],
  "settings": {
    "allow_invites": true,
    "require_approval": false,
    "retention_days": 0
  }
}
```

#### GET /api/rooms/:id

Get room details.

#### GET /api/rooms/:id/members

List room members.

#### POST /api/rooms/:id/members

Add a member to the room (admin/owner only).

#### DELETE /api/rooms/:id/members/:userId

Remove a member from the room (admin/owner only).

### 6.4 Message Endpoints

#### GET /api/rooms/:id/messages

Fetch message history with cursor-based pagination.

**Query Parameters:**
| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| cursor | integer | - | Sequence number for pagination |
| limit | integer | 50 | Number of messages (max 100) |
| before | boolean | true | Fetch messages before cursor |

**Response (200):**
```json
{
  "messages": [
    {
      "id": "uuid",
      "room_id": "room-general",
      "author_id": "user-alice",
      "content": "Hello, world!",
      "message_type": "text",
      "parent_id": null,
      "edited_at": null,
      "deleted_at": null,
      "sequence_num": 42,
      "created_at": "2026-04-03T10:00:00Z",
      "author": {
        "id": "user-alice",
        "username": "alice",
        "display_name": "Alice Smith"
      }
    }
  ],
  "has_more": true,
  "next_cursor": 41
}
```

#### GET /api/messages/:id/replies

Fetch thread replies for a parent message.

#### POST /api/rooms/:id/messages

Send a new message (WebSocket preferred for real-time).

**Request:**
```json
{
  "content": "Hello, world!",
  "message_type": "text",
  "parent_id": null
}
```

#### PATCH /api/messages/:id

Edit a message (author only).

**Request:**
```json
{
  "content": "Updated message content"
}
```

#### DELETE /api/messages/:id

Delete a message (author only, soft delete).

### 6.5 File Endpoints

#### POST /api/upload

Upload a file attachment.

**Request:** `multipart/form-data`

**Response (201):**
```json
{
  "file_id": "uuid",
  "url": "/api/files/uuid",
  "thumbnail_url": "/api/files/uuid/thumb",
  "mime_type": "image/png",
  "size": 1024000,
  "filename": "screenshot.png"
}
```

#### GET /api/files/:id

Download a file.

#### GET /api/files/:id/thumb

Download file thumbnail (images only).

### 6.6 WebSocket Events

#### Client → Server

| Event | Payload | Description |
|-------|---------|-------------|
| `auth` | `{ token }` | Authenticate WebSocket connection |
| `join_room` | `{ room_id }` | Join a room for real-time updates |
| `leave_room` | `{ room_id }` | Leave a room |
| `send_message` | `{ room_id, content, parent_id? }` | Send a message |
| `edit_message` | `{ message_id, new_content }` | Edit a message |
| `delete_message` | `{ message_id }` | Delete a message |
| `typing_start` | `{ room_id }` | Start typing indicator |
| `typing_stop` | `{ room_id }` | Stop typing indicator |
| `heartbeat` | `{ device_id }` | Heartbeat for presence |
| `presence_update` | `{ status?, custom_status? }` | Update presence status |
| `offer` | `{ room_id, target_id, sdp }` | WebRTC offer |
| `answer` | `{ room_id, target_id, sdp }` | WebRTC answer |
| `ice_candidate` | `{ room_id, target_id, candidate }` | ICE candidate |

#### Server → Client

| Event | Payload | Description |
|-------|---------|-------------|
| `auth_ok` | `{ user_id, username }` | Authentication successful |
| `auth_error` | `{ error, message }` | Authentication failed |
| `message` | `Message` | New message received |
| `message_edited` | `{ message_id, new_content, edited_at }` | Message was edited |
| `message_deleted` | `{ message_id, deleted_at }` | Message was deleted |
| `presence_update` | `{ user_id, status, ... }` | User presence changed |
| `typing` | `{ user_id, room_id, is_typing }` | User typing status |
| `offer` | `{ room_id, from_id, sdp }` | WebRTC offer received |
| `answer` | `{ room_id, from_id, sdp }` | WebRTC answer received |
| `ice_candidate` | `{ room_id, from_id, candidate }` | ICE candidate received |
| `heartbeat_ack` | `{ timestamp, server_time }` | Heartbeat acknowledgment |
| `error` | `{ code, message }` | Error occurred |

### 6.7 Error Response Format

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Username must be between 3 and 50 characters",
    "details": [
      {
        "field": "username",
        "issue": "too_short",
        "min": 3,
        "actual": 2
      }
    ],
    "request_id": "req-abc123"
  }
}
```

---

## 7. Real-Time Protocol Specification

### 7.1 Transport Selection Matrix

| Scenario | Transport | Fallback | Notes |
|----------|-----------|----------|-------|
| DM (2 users, P2P available) | WebRTC Data Channel | WebSocket | Lowest latency |
| DM (2 users, P2P blocked) | WebSocket relay | - | TURN or server relay |
| Group chat (3+ users) | WebSocket relay | - | Server broadcast |
| Presence updates | WebSocket | - | Connection state |
| Typing indicators | WebSocket | - | Loss-tolerant |
| File transfer (DM) | WebRTC Data Channel | HTTP upload | P2P preferred |
| Message history | REST API | - | Paginated fetch |

### 7.2 WebRTC Data Channel Setup

```
WebRTC Connection Flow (DM):

Client A                              Signaling Server                              Client B
   │                                        │                                          │
   │── 1. WS Connect + Auth ───────────────▶│                                          │
   │                                        │                                          │
   │                                        │◀──────── 2. WS Connect + Auth ───────────│
   │                                        │                                          │
   │── 3. Create RTCPeerConnection ────────▶│                                          │
   │   (with ICE servers)                   │                                          │
   │                                        │                                          │
   │── 4. Create Data Channel ────────────▶│                                          │
   │   "messages" (reliable, ordered)       │                                          │
   │   "presence" (unreliable, unordered)   │                                          │
   │                                        │                                          │
   │── 5. Create Offer ──────────────────▶│                                          │
   │   SDP Offer + ICE candidates           │                                          │
   │                                        │                                          │
   │── 6. send_signal(offer) ─────────────▶│                                          │
   │                                        │── 7. forward_signal(offer) ────────────▶│
   │                                        │                                          │
   │                                        │◀── 8. send_signal(answer) ──────────────│
   │                                        │   SDP Answer + ICE candidates            │
   │◀── 9. forward_signal(answer) ─────────│                                          │
   │                                        │                                          │
   │── 10. ICE Connectivity Checks ────────┼─────────────────────────────────────────▶│
   │    (STUN binding requests)             │                                          │
   │                                        │                                          │
   │◀════════════ 11. Data Channel Open ════╪══════════════════════════════════════════│
   │                                        │                                          │
   │── 12. Messages flow P2P ──────────────┼─────────────────────────────────────────▶│
   │                                        │                                          │
```

### 7.3 WebSocket Message Protocol

```json
// All WebSocket messages follow this envelope:
{
  "id": "uuid",           // Unique message ID (client-generated)
  "type": "string",       // Event type
  "timestamp": 1712188800000,  // Unix milliseconds
  "payload": {}           // Event-specific data
}

// Server responses include:
{
  "id": "uuid",           // Echoes client message ID
  "type": "string",       // Response type
  "timestamp": 1712188800000,
  "payload": {},
  "status": "ok|error",   // Request status
  "error": {              // Only present on error
    "code": "string",
    "message": "string"
  }
}
```

### 7.4 Message Delivery Guarantee

```
At-Least-Once Delivery Protocol:

Sender                    Server                    Receiver
  │                        │                          │
  │── MSG {id:123} ───────▶│                          │
  │                        │── MSG {id:123} ─────────▶│
  │                        │                          │
  │                        │◀── ACK {id:123} ─────────│
  │◀── ACK {id:123} ───────│                          │
  │                        │                          │
  │   (timeout: 5s, no ACK)│                          │
  │── RETRY {id:123} ─────▶│                          │
  │                        │── MSG {id:123} ─────────▶│
  │                        │◀── ACK {id:123} ─────────│
  │◀── ACK {id:123} ───────│                          │
  │                        │                          │
  │   (max retries: 3)     │                          │
  │   If still no ACK:     │                          │
  │   Mark as undelivered  │                          │
  │   Queue for retry on   │                          │
  │   receiver reconnect   │                          │
```

---

## 8. Error Handling

### 8.1 Error Categories

| Category | HTTP Status | Description | Examples |
|----------|-------------|-------------|----------|
| Client Error | 4xx | Invalid request | Validation, auth, not found |
| Server Error | 5xx | Internal failure | Database, panic, timeout |
| WebSocket Error | Close codes | Connection issues | Protocol error, going away |
| WebRTC Error | Error events | P2P issues | ICE failure, channel error |

### 8.2 HTTP Error Responses

| Status | Code | Description | Recovery |
|--------|------|-------------|----------|
| 400 | VALIDATION_ERROR | Request validation failed | Fix input and retry |
| 401 | UNAUTHORIZED | Missing or invalid auth | Re-authenticate |
| 401 | TOKEN_EXPIRED | JWT has expired | Refresh token |
| 403 | FORBIDDEN | Insufficient permissions | No recovery (contact admin) |
| 404 | NOT_FOUND | Resource not found | No recovery |
| 409 | CONFLICT | Resource conflict | Retry with different input |
| 429 | RATE_LIMITED | Too many requests | Wait and retry |
| 500 | INTERNAL_ERROR | Server error | Retry with backoff |
| 503 | SERVICE_UNAVAILABLE | Service temporarily down | Retry with backoff |

### 8.3 WebSocket Close Codes

| Code | Name | Description | Client Action |
|------|------|-------------|---------------|
| 1000 | Normal Closure | Clean disconnect | No action needed |
| 1001 | Going Away | Server shutdown | Reconnect with backoff |
| 1002 | Protocol Error | Protocol violation | Report error, reconnect |
| 1006 | Abnormal Closure | Connection dropped | Reconnect immediately |
| 1008 | Policy Violation | Policy violation | Do not reconnect |
| 1011 | Internal Error | Server error | Reconnect with backoff |
| 4001 | Auth Failed | Authentication failed | Re-authenticate |
| 4002 | Rate Limited | Too many messages | Wait and retry |
| 4003 | Room Full | Room capacity reached | Leave room |

### 8.4 WebRTC Error Handling

| Error | Cause | Recovery |
|-------|-------|----------|
| ICE Failed | NAT traversal failed | Fallback to WebSocket relay |
| Data Channel Error | Channel closed | Recreate channel |
| Peer Connection Failed | Connection lost | Re-establish P2P |
| DTLS Error | Encryption failure | Reconnect |

### 8.5 Retry Strategy

```
Exponential Backoff with Jitter:

Attempt  Delay Range
1        1s ± 0.5s
2        2s ± 1s
3        4s ± 2s
4        8s ± 4s
5        16s ± 8s
6+       30s ± 15s (capped)

Formula: delay = min(30s, base * 2^(attempt-1)) * (0.5 + random())
```

### 8.6 Error Recovery Flow

```
Error Recovery Decision Tree:

Error Occurred
     │
     ▼
┌─────────────┐
│ Is it a     │
│ network     │
│ error?      │
└──────┬──────┘
       │ Yes           │ No
       ▼               ▼
┌─────────────┐  ┌─────────────┐
│ Is WebSocket│  │ Is it a     │
│ connected?  │  │ validation  │
└──────┬──────┘  │ error?      │
       │ Yes     └──────┬──────┘
       ▼                │ Yes           │ No
┌─────────────┐         ▼               ▼
│ Retry via   │  ┌─────────────┐  ┌─────────────┐
│ WebSocket   │  │ Fix input   │  │ Log error,  │
│             │  │ and retry   │  │ return 500  │
└─────────────┘  └─────────────┘  └─────────────┘
       │ No
       ▼
┌─────────────┐
│ Reconnect   │
│ WebSocket   │
└─────────────┘
```

---

## 9. Security

### 9.1 Authentication

#### JWT Token Structure

```json
{
  "header": {
    "alg": "HS256",
    "typ": "JWT"
  },
  "payload": {
    "user_id": "550e8400-e29b-41d4-a716-446655440000",
    "username": "alice",
    "roles": ["user"],
    "session_id": "sess-abc123",
    "iat": 1712188800,
    "exp": 1712189700,
    "jti": "token-uuid"
  }
}
```

#### Token Lifecycle

```
Token Lifecycle:

┌─────────────────┐
│  Access Token   │  TTL: 15 minutes
│  (short-lived)  │  Used for: API requests, WS auth
└────────┬────────┘
         │ Expired
         ▼
┌─────────────────┐
│ Refresh Token   │  TTL: 7 days
│  (long-lived)   │  Used for: Getting new access token
└────────┬────────┘
         │ Expired or Revoked
         ▼
┌─────────────────┐
│  Re-login       │  User must re-authenticate
│  Required       │  with username/password
└─────────────────┘
```

#### Password Security

| Requirement | Implementation |
|-------------|----------------|
| Hashing | bcrypt with cost factor 12 |
| Minimum Length | 8 characters |
| Complexity | At least 1 uppercase, 1 number |
| Storage | Never store plaintext passwords |
| Transmission | Always over HTTPS/WSS |

### 9.2 Authorization

#### Access Control Matrix

| Resource | Action | Owner | Admin | Member | Non-Member |
|----------|--------|-------|-------|--------|------------|
| Room | View | ✅ | ✅ | ✅ | ❌ |
| Room | Edit settings | ✅ | ✅ | ❌ | ❌ |
| Room | Delete | ✅ | ❌ | ❌ | ❌ |
| Room | Add member | ✅ | ✅ | ❌ | ❌ |
| Room | Remove member | ✅ | ✅ | ❌ | ❌ |
| Message | View | ✅ | ✅ | ✅ | ❌ |
| Message | Send | ✅ | ✅ | ✅ | ❌ |
| Message | Edit (own) | ✅ | ✅ | ✅ | ❌ |
| Message | Delete (own) | ✅ | ✅ | ✅ | ❌ |
| Message | Delete (any) | ✅ | ❌ | ❌ | ❌ |
| File | Upload | ✅ | ✅ | ✅ | ❌ |
| File | Download | ✅ | ✅ | ✅ | ❌ |

#### DM Access Control

```
DM Access Check:

1. User requests DM content
2. Server verifies:
   a. User is authenticated
   b. Room type is "dm"
   c. User is a participant in the DM
3. If all checks pass → return content
4. If any check fails → return 403 Forbidden
```

### 9.3 Transport Security

| Component | Protocol | Encryption | Notes |
|-----------|----------|------------|-------|
| REST API | HTTPS | TLS 1.3 | Required |
| WebSocket | WSS | TLS 1.3 | Required |
| WebRTC | DTLS 1.2+ | DTLS | Mandatory, built-in |
| Database | TLS | TLS 1.3 | In-transit encryption |
| File Storage | HTTPS | TLS 1.3 | If using S3 |

### 9.4 Input Validation

| Input | Validation | Max Length | Sanitization |
|-------|------------|------------|--------------|
| Username | Alphanumeric + underscore | 50 chars | Trim, lowercase |
| Password | Min 8 chars, complexity | 128 chars | None (hash directly) |
| Display Name | Any UTF-8 | 100 chars | Trim |
| Message Content | Valid UTF-8 | 4096 chars | Strip control chars |
| Room Name | Any UTF-8 | 100 chars | Trim |
| File Upload | MIME type check | 10MB | Type validation |

### 9.5 Rate Limiting

| Endpoint | Limit | Window | Action on Exceed |
|----------|-------|--------|-----------------|
| POST /api/auth/login | 5 | 1 minute | 429 Too Many Requests |
| POST /api/auth/register | 3 | 1 minute | 429 Too Many Requests |
| POST /api/rooms/:id/messages | 100 | 1 minute | Drop message + warn |
| WebSocket connections | 10 | 1 minute | 429 + close connection |
| File uploads | 20 | 1 minute | 429 Too Many Requests |

### 9.6 CORS Policy

```
Allowed Origins:
- https://chatta.example.com
- https://www.chatta.example.com
- http://localhost:5173 (development)

Allowed Methods:
- GET, POST, PATCH, DELETE, OPTIONS

Allowed Headers:
- Authorization, Content-Type

Exposed Headers:
- X-Request-ID

Credentials: true
Max Age: 86400 (24 hours)
```

---

## 10. Performance Requirements

### 10.1 Latency Targets

| Operation | Target (P50) | Target (P95) | Target (P99) |
|-----------|-------------|-------------|-------------|
| DM message delivery (P2P) | 50ms | 100ms | 200ms |
| Group message delivery (relay) | 100ms | 200ms | 500ms |
| Message history load (50 msgs) | 200ms | 500ms | 1s |
| Presence update propagation | 100ms | 300ms | 500ms |
| Typing indicator propagation | 50ms | 200ms | 500ms |
| WebRTC connection setup | 200ms | 500ms | 1s |
| WebSocket connection setup | 50ms | 100ms | 200ms |
| Authentication | 100ms | 300ms | 500ms |

### 10.2 Throughput Targets

| Operation | Target | Notes |
|-----------|--------|-------|
| Messages per second (single server) | 10,000 | Text messages |
| Concurrent WebSocket connections | 10,000 | Per server |
| Concurrent WebRTC connections | 1,000 | Per server (signaling only) |
| Database writes per second | 5,000 | Message inserts |
| Database reads per second | 50,000 | History fetches |

### 10.3 Resource Targets

| Resource | Target | Notes |
|----------|--------|-------|
| Memory per WebSocket connection | <15KB | Go goroutine + buffer |
| Memory per WebRTC peer | <500KB | pion/webrtc overhead |
| CPU per 1000 connections | <5% | Idle, 8-core server |
| Database connections | <100 | With PgBouncer pooling |
| File storage per user | <100MB | Average usage |

### 10.4 Scalability Targets

| Metric | Single Server | With Redis | With Sharding |
|--------|--------------|------------|---------------|
| Concurrent users | 10,000 | 50,000 | 500,000+ |
| Messages/day | 10M | 50M | 500M+ |
| Rooms | 10,000 | 100,000 | Unlimited |
| Storage | 100GB | 1TB | Unlimited |

---

## 11. Deployment Architecture

### 11.1 Development Environment

```
Local Development:

┌─────────────────────────────────────────┐
│           Developer Machine              │
│                                          │
│  ┌──────────────┐  ┌──────────────────┐ │
│  │  Frontend    │  │    Backend       │ │
│  │  (Vite dev   │  │    (Go run)      │ │
│  │   server)    │  │                  │ │
│  │  :5173       │  │    :8080         │ │
│  └──────────────┘  └──────────────────┘ │
│                          │               │
│                  ┌───────▼───────┐       │
│                  │  PostgreSQL   │       │
│                  │  (Docker)     │       │
│                  │  :5432        │       │
│                  └───────────────┘       │
│                                          │
│  Start: ./start                          │
└─────────────────────────────────────────┘
```

### 11.2 Docker Compose (Staging)

```yaml
version: '3.8'

services:
  backend:
    build:
      context: .
      dockerfile: deploy/Dockerfile.backend
    ports:
      - "8080:8080"
    environment:
      - DATABASE_URL=postgres://chatta:password@db:5432/chatta
      - JWT_SECRET=${JWT_SECRET}
      - TURN_USERNAME=${TURN_USERNAME}
      - TURN_CREDENTIAL=${TURN_CREDENTIAL}
    depends_on:
      - db
    restart: unless-stopped

  frontend:
    build:
      context: .
      dockerfile: deploy/Dockerfile.frontend
    ports:
      - "3000:3000"
    environment:
      - PUBLIC_API_URL=http://backend:8080
      - PUBLIC_WS_URL=ws://backend:8080/ws
    depends_on:
      - backend
    restart: unless-stopped

  db:
    image: postgres:15-alpine
    environment:
      - POSTGRES_USER=chatta
      - POSTGRES_PASSWORD=password
      - POSTGRES_DB=chatta
    volumes:
      - pgdata:/var/lib/postgresql/data
      - ./backend/migrations:/docker-entrypoint-initdb.d
    ports:
      - "5432:5432"
    restart: unless-stopped

  turn:
    image: coturn/coturn:latest
    ports:
      - "3478:3478"
      - "3478:3478/udp"
      - "5349:5349"
      - "5349:5349/udp"
      - "49152-65535:49152-65535/udp"
    environment:
      - TURN_USERNAME=${TURN_USERNAME}
      - TURN_CREDENTIAL=${TURN_CREDENTIAL}
      - TURN_REALM=chatta.example.com
    restart: unless-stopped

volumes:
  pgdata:
```

### 11.3 Production Deployment

```
Production Architecture:

┌─────────────────────────────────────────────────────────┐
│                    Internet                              │
└──────────────────────┬──────────────────────────────────┘
                       │
              ┌────────▼────────┐
              │   CDN / WAF     │
              │  (CloudFlare)   │
              └────────┬────────┘
                       │
              ┌────────▼────────┐
              │  Load Balancer  │
              │  (nginx/ALB)    │
              └────────┬────────┘
                       │
        ┌──────────────┼──────────────┐
        │              │              │
  ┌─────▼─────┐  ┌────▼─────┐  ┌─────▼─────┐
  │ Go Server │  │ Go Server│  │ Go Server │
  │  (Node 1) │  │ (Node 2) │  │ (Node 3)  │
  └─────┬─────┘  └────┬─────┘  └─────┬─────┘
        │              │              │
  ┌─────▼──────────────▼──────────────▼─────┐
  │          Redis Cluster (3 nodes)         │
  └─────────────────┬───────────────────────┘
                    │
  ┌─────────────────▼───────────────────────┐
  │     PostgreSQL (Primary + 2 Replicas)    │
  └─────────────────────────────────────────┘

  ┌──────────────┐     ┌──────────────┐
  │  S3 (Files)  │     │  TURN Server │
  │              │     │  (coturn)    │
  └──────────────┘     └──────────────┘
```

---

## 12. Testing Strategy

### 12.1 Test Pyramid

```
                    ┌─────────┐
                   │  E2E    │  ← Playwright (frontend)
                  │  Tests  │     Integration tests
                 └───────────┘
                ┌─────────────┐
               │ Integration │  ← Go test + testcontainers
              │   Tests     │     Service-level tests
             └───────────────┘
            ┌─────────────────┐
           │    Unit Tests   │  ← Vitest (frontend)
          │                 │     Go test (backend)
         └───────────────────┘
```

### 12.2 Frontend Tests

| Test Type | Framework | Coverage Target | Examples |
|-----------|-----------|-----------------|----------|
| Unit | Vitest | 80% | Components, stores, utils |
| Component | Svelte Testing Library | 70% | MessageList, MessageInput |
| E2E | Playwright | Critical paths | Login → Chat → Send message |

### 12.3 Backend Tests

| Test Type | Framework | Coverage Target | Examples |
|-----------|-----------|-----------------|----------|
| Unit | go test | 80% | Services, models, utils |
| Integration | go test + testcontainers | 70% | Repositories, handlers |
| Load | k6 | Performance targets | WebSocket connections, message throughput |

### 12.4 Test Scenarios

#### Critical Path E2E Tests

1. **User Registration and Login**
   - Register new user
   - Login with credentials
   - Token refresh
   - Invalid credentials handling

2. **DM Flow**
   - User A creates DM with User B
   - User A sends message
   - User B receives message in real-time
   - User A edits message
   - User B sees edited message
   - User A deletes message
   - User B sees deleted message

3. **Group Chat Flow**
   - User A creates group chat
   - User A invites Users B, C
   - All users send messages
   - Messages appear for all participants
   - Thread creation and replies

4. **Presence Flow**
   - User connects → appears online
   - User inactive 5min → appears away
   - User disconnects → appears offline
   - Multi-device aggregation

5. **Access Control**
   - Non-member cannot view room messages
   - Non-participant cannot view DM
   - Non-author cannot edit/delete messages
   - Admin can manage room members

---

## 13. Observability

### 13.1 Logging

```
Structured Log Format (JSON):

{
  "timestamp": "2026-04-03T10:00:00.000Z",
  "level": "info",
  "service": "chatta-backend",
  "request_id": "req-abc123",
  "user_id": "user-alice",
  "event": "message_sent",
  "room_id": "room-general",
  "message_id": "msg-uuid",
  "duration_ms": 5,
  "transport": "webrtc"
}
```

### 13.2 Metrics

```
Prometheus Metrics:

# HTTP
http_requests_total{method, path, status}
http_request_duration_seconds{method, path}

# WebSocket
websocket_connections_active
websocket_messages_sent_total{type}
websocket_messages_received_total{type}
websocket_connection_duration_seconds

# WebRTC
webrtc_peer_connections_active
webrtc_data_channels_open
webrtc_ice_connection_state{state}
webrtc_bytes_sent_total
webrtc_bytes_received_total

# Messages
messages_sent_total{transport, room_type}
messages_edited_total
messages_deleted_total
message_delivery_latency_seconds{transport}

# Presence
presence_online_users
presence_status_changes_total{from, to}

# Database
db_connections_active
db_queries_total{operation}
db_query_duration_seconds{operation}
```

### 13.3 Health Checks

```
GET /health

Response (200):
{
  "status": "healthy",
  "version": "2.0.0",
  "uptime_seconds": 86400,
  "checks": {
    "database": {
      "status": "healthy",
      "latency_ms": 2
    },
    "websocket": {
      "status": "healthy",
      "active_connections": 1234
    },
    "webrtc": {
      "status": "healthy",
      "active_peers": 567
    }
  }
}
```

---

## 14. Migration and Compatibility

### 14.1 Database Migrations

```
Migration Strategy:

1. All migrations are versioned SQL files
2. Migrations run on application startup
3. Migrations are idempotent (safe to re-run)
4. Backward compatible (no breaking changes)
5. Rollback scripts provided

Migration File Naming:
001_initial_schema.sql
002_add_file_attachments.sql
003_add_message_reactions.sql
```

### 14.2 API Versioning

```
API Versioning Strategy:

- URL path versioning: /api/v1/...
- Current version: v1
- Breaking changes require new version
- Old versions supported for 6 months
- Deprecation notices in response headers

Response Headers:
X-API-Version: v1
X-API-Deprecated: true (if applicable)
X-API-Sunset: 2026-10-03 (if deprecated)
```

### 14.3 Browser Compatibility

| Browser | Minimum Version | Notes |
|---------|----------------|-------|
| Chrome | 100+ | Full support |
| Firefox | 100+ | Full support |
| Safari | 15.4+ | WebRTC data channels supported |
| Edge | 100+ | Full support (Chromium) |
| iOS Safari | 15.4+ | WebRTC support, background limitations |
| Chrome Android | 100+ | Full support |

---

## 15. Glossary

| Term | Definition |
|------|------------|
| **DM** | Direct Message - private conversation between two users |
| **GC** | Group Chat - conversation with 3+ participants |
| **P2P** | Peer-to-Peer - direct communication between clients |
| **WebRTC** | Web Real-Time Communication - browser API for P2P communication |
| **ICE** | Interactive Connectivity Establishment - NAT traversal protocol |
| **STUN** | Session Traversal Utilities for NAT - discovers public IP |
| **TURN** | Traversal Using Relays around NAT - relays traffic when P2P fails |
| **SDP** | Session Description Protocol - describes WebRTC connection parameters |
| **DTLS** | Datagram TLS - encryption for WebRTC data channels |
| **SCTP** | Stream Control Transmission Protocol - transport for WebRTC data channels |
| **WebSocket** | Full-duplex communication protocol over TCP |
| **JWT** | JSON Web Token - stateless authentication token |
| **CRDT** | Conflict-free Replicated Data Type - data structure for distributed consistency |
| **SFU** | Selective Forwarding Unit - server that forwards media streams |
| **TURN** | Server that relays WebRTC traffic when direct connection fails |
| **Tombstone** | Soft delete marker - indicates a record is deleted but retained |
| **Cursor** | Pagination marker - used for efficient history fetching |

---

## 16. Appendices

### 16.1 ADR Index

| ADR | Title | Status | Date |
|-----|-------|--------|------|
| [ADR-001](./docs/adr/ADR-001-realtime-protocol.md) | Real-Time Protocol Selection | Accepted | 2026-04-03 |
| [ADR-002](./docs/adr/ADR-002-message-storage.md) | Message Storage Strategy | Accepted | 2026-04-03 |
| [ADR-003](./docs/adr/ADR-003-presence-system.md) | Presence System Design | Proposed | 2026-04-03 |

### 16.2 Related Documents

| Document | Location | Description |
|----------|----------|-------------|
| SOTA Research | [docs/research/REALTIME_CHAT_SOTA.md](./docs/research/REALTIME_CHAT_SOTA.md) | State-of-the-art analysis |
| PRD | [PRD.md](./PRD.md) | Product requirements |
| PLAN | [PLAN.md](./PLAN.md) | Implementation roadmap |
| Functional Requirements | [FUNCTIONAL_REQUIREMENTS.md](./FUNCTIONAL_REQUIREMENTS.md) | Detailed requirements |
| ADR Log | [ADR.md](./ADR.md) | Architecture decision log |

### 16.3 Change Log

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0.0 | 2024-09-30 | Initial | Original SPEC.md |
| 2.0.0 | 2026-04-03 | Architecture Team | Comprehensive rewrite with ADRs, SOTA research, full API reference |

---

*This specification is maintained by the Phenotype Architecture Team. For questions or proposed changes, reference the relevant ADR or create a new ADR following the established process.*