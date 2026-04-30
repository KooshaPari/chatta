# chatta — PLAN.md

## Implementation Roadmap

### Phase 1: Foundation (Week 1)

| Task | Description | Deliverable |
|------|-------------|-------------|
| P1.1 | Project setup | SvelteKit + Go structure |
| P1.2 | UI shell | Chat layout components |
| P1.3 | Backend scaffold | HTTP server, routing |
| P1.4 | Database | Schema, message storage |

### Phase 2: Messaging Core (Week 2)

| Task | Description | Deliverable |
|------|-------------|-------------|
| P2.1 | Message CRUD | Send, edit, delete |
| P2.2 | Chat UI | Message list, input |
| P2.3 | History | Pagination, scrollback |
| P2.4 | Real-time | WebSocket connection |

### Phase 3: Threads & Rooms (Week 3)

| Task | Description | Deliverable |
|------|-------------|-------------|
| P3.1 | Threading | Reply tree UI |
| P3.2 | Room model | DM + GC data model |
| P3.3 | Room management | Create, join, leave |
| P3.4 | Presence | Online/away/offline |

### Phase 4: WebRTC (Week 4)

| Task | Description | Deliverable |
|------|-------------|-------------|
| P4.1 | Signal server | WebSocket signaling |
| P4.2 | P2P connection | WebRTC handshake |
| P4.3 | Media transfer | Message over P2P |
| P4.4 | Fallback | Server relay if P2P fails |

### Phase 5: Polish (Week 5)

| Task | Description | Deliverable |
|------|-------------|-------------|
| P5.1 | Auth | JWT login/signup |
| P5.2 | Security | Access controls |
| P5.3 | File uploads | Image attachments |
| P5.4 | UI polish | Animations, feedback |

---

## Resources

| Role | Allocation |
|------|------------|
| Full-stack Engineer | 1 FTE |

---

## Success Criteria

- [ ] Real-time P2P messaging
- [ ] Edit/delete with sync
- [ ] Thread support
- [ ] DM + Group chat
- [ ] 100ms message delivery
- [ ] Mobile-responsive UI
