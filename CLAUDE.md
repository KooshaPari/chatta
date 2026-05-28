# chatta

WebRTC-based real-time chat application supporting messages, threads, DMs, and group chats.

## Stack
- Language: Svelte (frontend), Go/other (backend)
- Key deps: WebRTC, SvelteKit
- Structure: Monorepo with `frontend/` and `backend/`

## Structure
- `frontend/`: Svelte-based UI
- `backend/`: Server handling signaling and message persistence
- `start`: Development startup script

## Key Patterns
- WebRTC peer-to-peer communication with signaling server
- By-user protections on DMs and group chats
- Feature: threads, message editing/deletion, viewing history

## Adding New Functionality
- Frontend features go in `frontend/src/`
- Backend endpoints go in `backend/`
- Run `./start` to launch both services for local development
