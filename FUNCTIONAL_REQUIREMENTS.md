# Functional Requirements — chatta

## FR-MSG — Messaging

| ID | Requirement | Traces To |
|----|-------------|-----------|
| FR-MSG-001 | The application SHALL deliver text messages to all channel/thread participants in real time | E1.1 |
| FR-MSG-002 | Message delivery latency SHALL be under 200ms on a local network | E1.1 |
| FR-MSG-003 | Users SHALL be able to edit their own sent messages | E1.2 |
| FR-MSG-004 | Edited messages SHALL update in place for all active participants | E1.2 |
| FR-MSG-005 | Users SHALL be able to delete their own sent messages | E1.3 |
| FR-MSG-006 | Deleted messages SHALL be removed from view for all participants | E1.3 |
| FR-MSG-007 | The application SHALL display prior message history on channel/thread open | E1.4 |

## FR-THREAD — Threads and Channels

| ID | Requirement | Traces To |
|----|-------------|-----------|
| FR-THREAD-001 | Users SHALL be able to create named threads | E2.1 |
| FR-THREAD-002 | Created threads SHALL appear in the sidebar for all connected users | E2.1 |
| FR-THREAD-003 | Users SHALL be able to post replies scoped to a specific thread | E2.2 |
| FR-THREAD-004 | Thread replies SHALL not appear in the main channel view | E2.2 |

## FR-DM — Direct Messages

| ID | Requirement | Traces To |
|----|-------------|-----------|
| FR-DM-001 | Users SHALL be able to initiate a DM with any other registered user | E3.1 |
| FR-DM-002 | DM content SHALL only be visible to the two participants | E3.2 |
| FR-DM-003 | Attempting to read another user's DM SHALL return a 403 error | E3.2 |

## FR-AUTH — Authentication

| ID | Requirement | Traces To |
|----|-------------|-----------|
| FR-AUTH-001 | Users SHALL register with a username and password | E4.1 |
| FR-AUTH-002 | Users SHALL log in and receive a persistent session | E4.1 |
| FR-AUTH-003 | All message, thread, and DM endpoints SHALL require authentication | E4.2 |
| FR-AUTH-004 | Per-user access protections SHALL be enforced server-side | E4.2 |

## FR-WEBRTC — WebRTC Transport

| ID | Requirement | Traces To |
|----|-------------|-----------|
| FR-WEBRTC-001 | The application SHALL use WebRTC data channels for real-time message delivery | E1.1 |
| FR-WEBRTC-002 | The application SHALL include a signaling server to coordinate peer connections | E1.1 |
| FR-WEBRTC-003 | The signaling server SHALL be part of the backend service | E1.1 |
