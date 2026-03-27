# PRD — chatta

## Overview

chatta is a WebRTC-based real-time chat application. It supports peer-to-peer messaging, group threads, direct messages (DMs), message editing/deletion, and history browsing — all with per-user access protections.

## Epics

### E1 — Real-Time Messaging

| Story | Description | Acceptance Criteria |
|-------|-------------|---------------------|
| E1.1 | Users can send text messages in real time | Message appears on recipient side within 200ms on local network |
| E1.2 | Users can edit sent messages | Edited message updates in place for all participants |
| E1.3 | Users can delete sent messages | Deleted message is removed from view for all participants |
| E1.4 | Users can view message history | Prior messages load on channel/thread open |

### E2 — Threads and Channels

| Story | Description | Acceptance Criteria |
|-------|-------------|---------------------|
| E2.1 | Users can create named threads | Thread appears in sidebar; others can join |
| E2.2 | Users can reply within a thread | Thread reply is scoped to that thread context |

### E3 — Direct Messages

| Story | Description | Acceptance Criteria |
|-------|-------------|---------------------|
| E3.1 | Users can initiate DMs with another user | DM opens private channel between two users |
| E3.2 | DMs are protected per-user | User A cannot read User B's DMs |

### E4 — Authentication and User Management

| Story | Description | Acceptance Criteria |
|-------|-------------|---------------------|
| E4.1 | Users register and log in | Auth flow completes; session persists |
| E4.2 | Per-user protections enforced on DMs and GCs | Unauthorized access returns 403 |

## Non-Goals

- End-to-end encryption (planned future)
- File/media sharing
- Video/audio calls (WebRTC data channel only for MVP)
- Mobile app
