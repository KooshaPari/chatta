> **Work state:** SCAFFOLD · **Progress:** `████░░░░░░ 40%`
> WebRTC P2P chat (Svelte frontend + signaling backend). Alpha; frontend/backend split present, feature depth still shallow. · updated 2026-06-02

# CHATTA!

[![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![Build](https://github.com/KooshaPari/chatta/actions/workflows/build.yml/badge.svg)](https://github.com/KooshaPari/chatta/actions/workflows/build.yml)
[![TypeScript](https://img.shields.io/badge/typescript-6.x-3178C6.svg?logo=typescript&logoColor=white)](package.json)

**Status:** alpha

**Real-Time Peer-to-Peer Chat** — A WebRTC-based messaging application for direct communication with message threads, group chat, and per-user privacy controls.

## Overview

Chatta is a modern, decentralized chat application built on WebRTC technology, enabling direct peer-to-peer communication with a signaling server backend. It provides a rich messaging experience with support for real-time conversations, message editing/deletion, threaded discussions, and group management.

**Core Mission**: Enable secure, ephemeral peer-to-peer messaging with minimal server dependencies.

## Technology Stack

- **Frontend**: Svelte, SvelteKit, WebRTC API
- **Backend**: Go (or Node.js for signaling server)
- **Architecture**: Client-server with P2P data channels
- **Real-Time**: WebRTC with STUN/TURN negotiation
- **Storage**: Message persistence (optional backend store)

## Key Features

- **Peer-to-Peer Messaging**: Direct communication via WebRTC data channels
- **Message Management**: Send, edit, delete, and history retrieval
- **Threaded Conversations**: Create and manage message threads
- **Direct Messages**: Private one-to-one conversations with encryption
- **Group Chats**: Multi-user conversations with thread support
- **By-User Protections**: Access control and user-level permission management
- **Real-Time Sync**: Live updates across all connected clients

## Quick Start

```bash
# Clone and setup
git clone https://github.com/KooshaPari/Phenotype repos/chatta
cd chatta

# Review governance context
cat CLAUDE.md

# Install dependencies (frontend + backend)
./start

# Development server runs on http://localhost:5173
# Backend signaling on http://localhost:3000
```

## Project Structure

```
chatta/
├── frontend/                  # Svelte UI
│   ├── src/
│   │   ├── components/       # Reusable Svelte components
│   │   ├── routes/           # SvelteKit pages
│   │   ├── lib/              # WebRTC client logic
│   │   └── stores/           # Reactive state management
│   └── package.json
├── backend/                  # Signaling server
│   ├── main.go              # Server entry point
│   ├── signaling/           # WebRTC signaling logic
│   ├── users/               # User management
│   └── go.mod
└── start                    # Development launcher script
```

## Current Status

- ✅ Core WebRTC signaling infrastructure
- ✅ Message send, edit, delete operations
- ✅ Thread creation and management
- ✅ DM functionality with basic user protections
- 🔄 Security hardening for DM/group chats (in progress)
- 🔄 UI/UX improvements and responsive design
- 🔄 User profile management and presence indicators

## Related Phenotype Projects

- **AuthKit** — User authentication and session management
- **cloud** — Cloud deployment infrastructure
- **PhenoObservability** — Observability and monitoring

## Development

```bash
# Start all services
./start

# Frontend only (Svelte dev server)
cd frontend && npm run dev

# Backend only (Go signaling server)
cd backend && go run main.go

# Run tests
cd frontend && npm test
cd backend && go test ./...

# Format and lint
cd frontend && npm run lint
cd backend && gofmt -w . && golangci-lint run
```

## API Reference

### WebRTC Signaling Endpoints

- `POST /api/signal/offer` — Send SDP offer
- `POST /api/signal/answer` — Send SDP answer
- `POST /api/signal/candidate` — Send ICE candidate
- `GET /api/peer/{id}` — Get peer status
- `DELETE /api/peer/{id}` — Close peer connection

### Message Endpoints

- `GET /api/messages/{thread-id}` — Get message history
- `POST /api/messages` — Send message
- `PATCH /api/messages/{id}` — Edit message
- `DELETE /api/messages/{id}` — Delete message

### Thread Management

- `GET /api/threads` — List threads
- `POST /api/threads` — Create thread
- `PATCH /api/threads/{id}` — Update thread
- `DELETE /api/threads/{id}` — Delete thread

## Performance Considerations

- **Latency**: <50ms RTT for signaling, P2P varies by network
- **Throughput**: Depends on WebRTC data channel MTU (typically 16KB)
- **Scalability**: TURN server needed for peer connectivity behind NAT
- **Storage**: Message persistence optional; can use in-memory store

## Security

- **TLS/HTTPS** required for production
- **DTLS-SRTP** for WebRTC data encryption
- **Per-user permissions** enforced on DM/group operations
- **Session tokens** validated server-side

See [docs/SECURITY.md](./docs/SECURITY.md) for detailed threat model.

## Deployment

### Docker

```bash
docker-compose up -d
# Opens http://localhost:5173 (frontend)
# Backend on localhost:3000
```

### Kubernetes

See [k8s/](./k8s/) for Helm charts and deployment manifests.

### Fly.io

```bash
fly deploy
```

## Troubleshooting

**"Connection failed"**
- Check STUN/TURN server configuration
- Verify firewall allows WebRTC ports
- Review browser console for peer connection errors

**"Messages not syncing"**
- Ensure signaling server is running
- Check backend logs for data channel errors
- Verify message endpoints are accessible

**"UI not loading"**
- Confirm frontend dev server is running on :5173
- Clear browser cache (`Ctrl+Shift+Delete`)
- Check browser console for JavaScript errors

## Governance

- **Status**: Active Development
- **Type**: Real-Time Communication Platform
- **Stack**: Svelte + Go
- **Part of**: Phenotype Ecosystem
- **Testing**: All code requires unit tests
- **Quality**: Zero linting errors required

## References

- **WebRTC**: MDN Web Docs
- **SvelteKit**: Official documentation
- **Signaling**: IETF standards-based
- **Related**: AuthKit integration for user management

## License

MIT — see [LICENSE](./LICENSE).

---

**Last Updated**: 2026-04-25 | **Status**: Active Development
