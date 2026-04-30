# ADR-003: Presence System Design

**Document ID:** PHENOTYPE_CHATTA_ADR_003  
**Status:** Proposed  
**Last Updated:** 2026-04-03  
**Author:** Phenotype Architecture Team  
**Supersedes:** N/A  
**Related ADRs:** [ADR-001](./ADR-001-realtime-protocol.md), [ADR-002](./ADR-002-message-storage.md)

---

## Table of Contents

1. [Context](#context)
2. [Decision](#decision)
3. [Consequences](#consequences)
4. [Technical Details](#technical-details)
5. [Alternatives Considered](#alternatives-considered)
6. [Implementation Notes](#implementation-notes)
7. [Cross-References](#cross-references)

---

## Context

chatta requires a presence system to indicate user availability (online, away, offline) to other users in real time. Presence is a fundamental feature of chat applications, enabling users to know whether their contacts are available for conversation.

### Requirements

| ID | Requirement | Priority | Notes |
|----|-------------|----------|-------|
| R1 | Real-time status updates | Critical | Sub-500ms propagation |
| R2 | Multi-device awareness | High | Aggregate status across devices |
| R3 | Automatic away detection | High | Inactivity-based status change |
| R4 | Manual status override | Medium | User-set "do not disturb" |
| R5 | Room-level presence | Medium | Show which room a user is in |
| R6 | Typing indicator integration | High | Coordinate with typing state |
| R7 | Historical presence data | Low | "Last seen" timestamps |
| R8 | Privacy controls | Medium | Hide online status from specific users |
| R9 | Scalability to 10K users | High | Per-server concurrent users |
| R10 | Low overhead | High | Minimal bandwidth and CPU usage |

### Presence States

```
┌─────────────────────────────────────────────────────────────────┐
│                     Presence State Machine                       │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│                        ┌─────────────┐                          │
│                        │   Offline   │                          │
│                        │  (default)  │                          │
│                        └──────┬──────┘                          │
│                               │                                  │
│                    WebSocket connected                           │
│                               │                                  │
│                               ▼                                  │
│                        ┌─────────────┐                          │
│                   ┌───▶│   Online    │◀──┐                       │
│                   │    │  (active)   │   │                       │
│                   │    └──────┬──────┘   │                       │
│                   │           │          │                       │
│                   │  Inactivity > 5min   │ Activity              │
│                   │           │          │ detected              │
│                   │           ▼          │                       │
│                   │    ┌─────────────┐   │                       │
│                   │    │    Away     │───┘                       │
│                   │    │  (idle)     │                           │
│                   │    └──────┬──────┘                           │
│                   │           │                                  │
│                   │  Inactivity > 30min                          │
│                   │           │                                  │
│                   │           ▼                                  │
│                   │    ┌─────────────┐                          │
│                   └────│  Invisible  │                          │
│                        │  (hidden)   │                          │
│                        └──────┬──────┘                          │
│                               │                                  │
│                   WebSocket disconnected                         │
│                               │                                  │
│                               ▼                                  │
│                        ┌─────────────┐                          │
│                        │   Offline   │                          │
│                        │  (last_seen)│                          │
│                        └─────────────┘                          │
│                                                                  │
│  Additional States (user-set):                                   │
│  - Do Not Disturb: Online but notifications suppressed           │
│  - Custom Status: User-defined text message                      │
└─────────────────────────────────────────────────────────────────┘
```

### Presence Data Model

```typescript
interface Presence {
  userId: string;
  status: 'online' | 'away' | 'offline' | 'dnd' | 'invisible';
  customStatus?: string;
  lastSeenAt: Date;
  activeDevices: DevicePresence[];
  currentRoomId?: string;
  typingInRoomId?: string;
  updatedAt: Date;
}

interface DevicePresence {
  deviceId: string;
  deviceType: 'desktop' | 'mobile' | 'tablet';
  browser: string;
  connectedAt: Date;
  lastActivityAt: Date;
  ipAddress?: string;
}
```

### Current State

The existing ADR.md mentions presence as a Phase 3 feature (P3.4) but does not specify the implementation approach. The WebSocket connection established for signaling (ADR-001) provides a natural foundation for presence detection.

### Presence Propagation Requirements

```
Presence Update Flow:

User A goes online                    User B sees update
       │                                    │
       ▼                                    │
┌──────────────┐                            │
│  WebSocket   │                            │
│  Connected   │                            │
└──────┬───────┘                            │
       │                                    │
       ▼                                    │
┌──────────────┐     ┌──────────────┐       │
│  Presence    │────▶│  Broadcast   │──────▶│
│  Manager     │     │  to Room     │       │
└──────────────┘     └──────────────┘       │
                                            ▼
                                     ┌──────────────┐
                                     │  Client B    │
                                     │  UI Update   │
                                     └──────────────┘

Latency Budget:
- WebSocket message: 1-5ms
- Server processing: 1-2ms
- Broadcast to subscribers: 1-5ms
- Client processing: 5-10ms
- Total: <500ms (P95)
```

---

## Decision

We will implement presence detection using **WebSocket connection state multiplexing** with application-level activity tracking, stored in-memory on the server with optional Redis persistence for horizontal scaling.

### Primary Decision

**WebSocket connection state as the source of truth** for online/offline status, with application-level heartbeat and activity tracking for online/away differentiation.

### Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    Presence System Architecture                  │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │                   Client Layer                            │   │
│  │                                                          │   │
│  │  ┌─────────────┐  ┌─────────────┐  ┌──────────────────┐ │   │
│  │  │  Activity   │  │  Heartbeat  │  │  Status Override │ │   │
│  │  │  Tracker    │  │  (30s)      │  │  (DND, Custom)   │ │   │
│  │  │             │  │             │  │                  │ │   │
│  │  │ • Mouse move│  │ • Ping msg  │  │ • Manual set     │ │   │
│  │  │ • Key press │  │ • Pong resp │  │ • Auto-away      │ │   │
│  │  │ • Scroll    │  │ • Timeout   │  │ • Clear status   │ │   │
│  │  │ • Focus     │  │             │  │                  │ │   │
│  │  └──────┬──────┘  └──────┬──────┘  └────────┬─────────┘ │   │
│  │         │                │                   │           │   │
│  │         └────────────────┼───────────────────┘           │   │
│  │                          ▼                               │   │
│  │                 ┌──────────────┐                         │   │
│  │                 │  WebSocket   │                         │   │
│  │                 │  Connection  │                         │   │
│  │                 └──────┬───────┘                         │   │
│  └────────────────────────┼─────────────────────────────────┘   │
│                           │                                      │
│  ┌────────────────────────┼─────────────────────────────────┐   │
│  │                   Server Layer                            │   │
│  │                           │                               │   │
│  │                    ┌──────▼───────┐                       │   │
│  │                    │  Connection  │                       │   │
│  │                    │  Registry    │                       │   │
│  │                    ├──────────────┤                       │   │
│  │                    │ userID → []  │                       │   │
│  │                    │ Connection   │                       │   │
│  │                    │ Info         │                       │   │
│  │                    └──────┬───────┘                       │   │
│  │                           │                               │   │
│  │                    ┌──────▼───────┐                       │   │
│  │                    │  Presence    │                       │   │
│  │                    │  Manager     │                       │   │
│  │                    ├──────────────┤                       │   │
│  │                    │ • State calc │                       │   │
│  │                    │ • Aggregation│                       │   │
│  │                    │ • Broadcast  │                       │   │
│  │                    │ • Cleanup    │                       │   │
│  │                    └──────┬───────┘                       │   │
│  │                           │                               │   │
│  │                    ┌──────▼───────┐                       │   │
│  │                    │  Room        │                       │   │
│  │                    │  Subscribers │                       │   │
│  │                    ├──────────────┤                       │   │
│  │                    │ roomID → []  │                       │   │
│  │                    │ subscriber   │                       │   │
│  │                    │ IDs          │                       │   │
│  │                    └──────────────┘                       │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │                   Storage Layer (Optional)                │   │
│  │                                                          │   │
│  │  ┌─────────────┐  ┌─────────────┐                       │   │
│  │  │  Redis      │  │ PostgreSQL  │                       │   │
│  │  │  (Scaling)  │  │ (Last Seen) │                       │   │
│  │  │             │  │             │                       │   │
│  │  │ • Presence  │  │ • last_seen │                       │   │
│  │  │   state     │  │ • status    │                       │   │
│  │  │ • Heartbeat │  │ • history   │                       │   │
│  │  │   tracking  │  │   (audit)   │                       │   │
│  │  └─────────────┘  └─────────────┘                       │   │
│  └──────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

### Presence State Calculation

```
Multi-Device Presence Aggregation:

User "alice" connections:
┌──────────────┬──────────┬──────────────┬───────────────┐
│ Device       │ Status   │ Last Activity│ Connection    │
├──────────────┼──────────┼──────────────┼───────────────┤
│ Desktop      │ Online   │ 30s ago      │ Active        │
│ Mobile       │ Away     │ 8min ago     │ Active        │
│ Tablet       │ Offline  │ 2hr ago      │ Disconnected  │
└──────────────┴──────────┴──────────────┴───────────────┘

Aggregation Rules:
1. If ANY device is Online → User is Online
2. If ALL connected devices are Away → User is Away
3. If NO devices connected → User is Offline
4. If user sets DND → Override to DND (regardless of devices)
5. If user sets Invisible → Show as Offline to others

Result: alice is Online (desktop is active)
```

### Go Implementation

```go
package presence

import (
    "sync"
    "time"
)

type Status string

const (
    StatusOnline    Status = "online"
    StatusAway      Status = "away"
    StatusOffline   Status = "offline"
    StatusDND       Status = "dnd"
    StatusInvisible Status = "invisible"
)

const (
    AwayTimeout     = 5 * time.Minute
    OfflineTimeout  = 30 * time.Minute
    HeartbeatInterval = 30 * time.Second
    CleanupInterval = 1 * time.Minute
)

type DeviceInfo struct {
    DeviceID       string
    DeviceType     string
    Browser        string
    ConnectedAt    time.Time
    LastActivityAt time.Time
    LastHeartbeat  time.Time
    Status         Status
    CurrentRoomID  string
    TypingInRoomID string
}

type UserPresence struct {
    UserID        string
    OverrideStatus Status // User-set override (DND, Invisible)
    CustomStatus  string
    Devices       map[string]*DeviceInfo
    LastSeenAt    time.Time
    UpdatedAt     time.Time
}

type PresenceManager struct {
    users       map[string]*UserPresence
    mu          sync.RWMutex
    subscribers map[string]map[string]chan PresenceUpdate // roomID -> userID -> chan
    subMu       sync.RWMutex
    broadcast   chan PresenceUpdate
}

type PresenceUpdate struct {
    UserID         string    `json:"user_id"`
    Status         Status    `json:"status"`
    CustomStatus   string    `json:"custom_status,omitempty"`
    CurrentRoomID  string    `json:"current_room_id,omitempty"`
    TypingInRoomID string    `json:"typing_in_room_id,omitempty"`
    UpdatedAt      time.Time `json:"updated_at"`
}

func NewPresenceManager() *PresenceManager {
    pm := &PresenceManager{
        users:       make(map[string]*UserPresence),
        subscribers: make(map[string]map[string]chan PresenceUpdate),
        broadcast:   make(chan PresenceUpdate, 1000),
    }

    // Start cleanup goroutine
    go pm.cleanupLoop()

    // Start broadcast goroutine
    go pm.broadcastLoop()

    return pm
}

func (pm *PresenceManager) OnConnect(userID string, deviceID string, deviceType string, browser string) {
    pm.mu.Lock()
    defer pm.mu.Unlock()

    user, exists := pm.users[userID]
    if !exists {
        user = &UserPresence{
            UserID:  userID,
            Devices: make(map[string]*DeviceInfo),
        }
        pm.users[userID] = user
    }

    now := time.Now()
    user.Devices[deviceID] = &DeviceInfo{
        DeviceID:       deviceID,
        DeviceType:     deviceType,
        Browser:        browser,
        ConnectedAt:    now,
        LastActivityAt: now,
        LastHeartbeat:  now,
        Status:         StatusOnline,
    }

    // Calculate and broadcast aggregated status
    status := pm.calculateAggregatedStatus(user)
    pm.broadcastUpdate(userID, status)
}

func (pm *PresenceManager) OnDisconnect(userID string, deviceID string) {
    pm.mu.Lock()
    defer pm.mu.Unlock()

    user, exists := pm.users[userID]
    if !exists {
        return
    }

    delete(user.Devices, deviceID)

    if len(user.Devices) == 0 {
        user.LastSeenAt = time.Now()
        pm.broadcastUpdate(userID, StatusOffline)
    } else {
        status := pm.calculateAggregatedStatus(user)
        pm.broadcastUpdate(userID, status)
    }
}

func (pm *PresenceManager) OnActivity(userID string, deviceID string) {
    pm.mu.Lock()
    defer pm.mu.Unlock()

    user, exists := pm.users[userID]
    if !exists {
        return
    }

    device, exists := user.Devices[deviceID]
    if !exists {
        return
    }

    now := time.Now()
    device.LastActivityAt = now
    device.LastHeartbeat = now

    // If device was away, bring it back online
    if device.Status == StatusAway {
        device.Status = StatusOnline
        status := pm.calculateAggregatedStatus(user)
        pm.broadcastUpdate(userID, status)
    }
}

func (pm *PresenceManager) OnHeartbeat(userID string, deviceID string) {
    pm.mu.Lock()
    defer pm.mu.Unlock()

    user, exists := pm.users[userID]
    if !exists {
        return
    }

    device, exists := user.Devices[deviceID]
    if !exists {
        return
    }

    device.LastHeartbeat = time.Now()
}

func (pm *PresenceManager) SetOverrideStatus(userID string, status Status, customStatus string) {
    pm.mu.Lock()
    defer pm.mu.Unlock()

    user, exists := pm.users[userID]
    if !exists {
        return
    }

    user.OverrideStatus = status
    user.CustomStatus = customStatus
    user.UpdatedAt = time.Now()

    pm.broadcastUpdate(userID, status)
}

func (pm *PresenceManager) calculateAggregatedStatus(user *UserPresence) Status {
    // Override takes priority
    if user.OverrideStatus == StatusDND || user.OverrideStatus == StatusInvisible {
        return user.OverrideStatus
    }

    hasOnline := false
    allAway := true

    for _, device := range user.Devices {
        // Check if device should be marked as away
        inactiveTime := time.Since(device.LastActivityAt)
        if inactiveTime > AwayTimeout {
            device.Status = StatusAway
        } else {
            device.Status = StatusOnline
        }

        if device.Status == StatusOnline {
            hasOnline = true
        }
        if device.Status != StatusAway {
            allAway = false
        }
    }

    if hasOnline {
        return StatusOnline
    }
    if allAway && len(user.Devices) > 0 {
        return StatusAway
    }
    return StatusOffline
}

func (pm *PresenceManager) broadcastUpdate(userID string, status Status) {
    user := pm.users[userID]
    update := PresenceUpdate{
        UserID:       userID,
        Status:       status,
        CustomStatus: user.CustomStatus,
        UpdatedAt:    time.Now(),
    }

    select {
    case pm.broadcast <- update:
    default:
        // Broadcast channel full, skip (non-critical)
    }
}

func (pm *PresenceManager) broadcastLoop() {
    for update := range pm.broadcast {
        pm.subMu.RLock()
        // Find all rooms this user is in and broadcast to subscribers
        for roomID, subs := range pm.subscribers {
            for subscriberID, ch := range subs {
                if subscriberID != update.UserID {
                    select {
                    case ch <- update:
                    default:
                        // Subscriber channel full
                    }
                }
            }
        }
        pm.subMu.RUnlock()
    }
}

func (pm *PresenceManager) SubscribeRoom(roomID string, userID string) chan PresenceUpdate {
    pm.subMu.Lock()
    defer pm.subMu.Unlock()

    if _, exists := pm.subscribers[roomID]; !exists {
        pm.subscribers[roomID] = make(map[string]chan PresenceUpdate)
    }

    ch := make(chan PresenceUpdate, 100)
    pm.subscribers[roomID][userID] = ch

    return ch
}

func (pm *PresenceManager) UnsubscribeRoom(roomID string, userID string) {
    pm.subMu.Lock()
    defer pm.subMu.Unlock()

    if subs, exists := pm.subscribers[roomID]; exists {
        if ch, exists := subs[userID]; exists {
            close(ch)
            delete(subs, userID)
        }
        if len(subs) == 0 {
            delete(pm.subscribers, roomID)
        }
    }
}

func (pm *PresenceManager) cleanupLoop() {
    ticker := time.NewTicker(CleanupInterval)
    defer ticker.Stop()

    for range ticker.C {
        pm.cleanup()
    }
}

func (pm *PresenceManager) cleanup() {
    pm.mu.Lock()
    defer pm.mu.Unlock()

    now := time.Now()
    for userID, user := range pm.users {
        for deviceID, device := range user.Devices {
            // Check for heartbeat timeout (connection likely dead)
            if now.Sub(device.LastHeartbeat) > 2*HeartbeatInterval {
                delete(user.Devices, deviceID)
            }
        }

        if len(user.Devices) == 0 {
            user.LastSeenAt = now
            pm.broadcastUpdate(userID, StatusOffline)
        }
    }
}

func (pm *PresenceManager) GetPresence(userID string) PresenceUpdate {
    pm.mu.RLock()
    defer pm.mu.RUnlock()

    user, exists := pm.users[userID]
    if !exists {
        return PresenceUpdate{
            UserID:    userID,
            Status:    StatusOffline,
            UpdatedAt: time.Now(),
        }
    }

    status := pm.calculateAggregatedStatus(user)
    return PresenceUpdate{
        UserID:       userID,
        Status:       status,
        CustomStatus: user.CustomStatus,
        UpdatedAt:    user.UpdatedAt,
    }
}
```

### WebSocket Protocol for Presence

```typescript
// Client → Server
interface PresenceMessage {
  type: 'presence_update';
  payload: {
    status?: 'online' | 'away' | 'dnd' | 'invisible';
    custom_status?: string;
    current_room_id?: string;
    typing_in_room_id?: string;
  };
}

// Server → Client
interface PresenceBroadcast {
  type: 'presence_update';
  payload: {
    user_id: string;
    status: 'online' | 'away' | 'offline' | 'dnd' | 'invisible';
    custom_status?: string;
    current_room_id?: string;
    typing_in_room_id?: string;
    updated_at: string;
  };
}

// Heartbeat
interface HeartbeatMessage {
  type: 'heartbeat';
  payload: {
    device_id: string;
    timestamp: number;
  };
}

interface HeartbeatResponse {
  type: 'heartbeat_ack';
  payload: {
    timestamp: number;
    server_time: number;
  };
}
```

### Client-Side Activity Tracking

```typescript
// lib/presence/activity-tracker.ts
export class ActivityTracker {
  private lastActivity: number = Date.now();
  private heartbeatInterval: ReturnType<typeof setInterval>;
  private awayTimeout: number = 5 * 60 * 1000; // 5 minutes
  private heartbeatPeriod: number = 30 * 1000; // 30 seconds

  constructor(
    private wsManager: WebSocketManager,
    private deviceId: string
  ) {}

  start(): void {
    // Track user activity
    const events = ['mousemove', 'keydown', 'scroll', 'click', 'touchstart'];
    events.forEach(event => {
      window.addEventListener(event, () => this.recordActivity(), { passive: true });
    });

    // Track window focus/blur
    window.addEventListener('focus', () => this.recordActivity());
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') {
        this.recordActivity();
      }
    });

    // Start heartbeat
    this.heartbeatInterval = setInterval(
      () => this.sendHeartbeat(),
      this.heartbeatPeriod
    );

    // Check for away status
    setInterval(() => this.checkAwayStatus(), 10000);
  }

  recordActivity(): void {
    this.lastActivity = Date.now();
  }

  sendHeartbeat(): void {
    this.wsManager.send('heartbeat', {
      device_id: this.deviceId,
      timestamp: Date.now(),
    });
  }

  checkAwayStatus(): void {
    const inactiveTime = Date.now() - this.lastActivity;
    if (inactiveTime > this.awayTimeout) {
      // User is away
      this.wsManager.send('presence_update', {
        status: 'away',
      });
    }
  }

  setStatus(status: 'online' | 'away' | 'dnd' | 'invisible'): void {
    this.wsManager.send('presence_update', { status });
  }

  stop(): void {
    clearInterval(this.heartbeatInterval);
  }
}
```

---

## Consequences

### Positive Consequences

1. **Zero additional infrastructure for MVP:** By leveraging the existing WebSocket connection (established for signaling per ADR-001), presence detection requires no additional servers, ports, or protocols. The connection state IS the presence state.

2. **Accurate online/offline detection:** WebSocket provides immediate notification of disconnections (close events), eliminating the delay and inaccuracy of heartbeat-only presence systems. A dropped connection is detected within seconds via TCP-level keepalive.

3. **Multi-device awareness:** The per-device tracking model accurately represents users connected from multiple devices. The aggregation logic (any device online = user online) matches user expectations from modern chat applications.

4. **Automatic away detection:** Activity tracking (mouse, keyboard, scroll events) combined with a configurable timeout provides automatic away detection without user intervention. This matches the behavior users expect from Slack, Discord, and similar applications.

5. **Low bandwidth overhead:** Heartbeat messages are small (~50 bytes) and sent infrequently (every 30 seconds). For 10,000 concurrent users, this adds ~16KB/s of traffic, which is negligible compared to message traffic.

6. **Graceful degradation:** If the heartbeat mechanism fails, the WebSocket connection state still provides accurate online/offline detection. The heartbeat only refines the online/away distinction.

7. **Extensible design:** The presence manager's subscription model allows efficient room-scoped presence broadcasts. Adding new presence-related features (custom status, room-level presence, typing integration) requires minimal architectural changes.

8. **Privacy support:** The override status mechanism (DND, Invisible) allows users to control their visibility. The Invisible status makes the user appear offline to others while maintaining full functionality.

### Negative Consequences

1. **In-memory state loss on server restart:** The primary presence state is stored in-memory. If the Go server restarts, all presence state is lost and must be rebuilt from WebSocket reconnections. This causes a brief period of incorrect presence data after restart.

2. **Heartbeat false positives:** Network issues can cause heartbeat messages to be delayed or dropped, incorrectly marking an active user as disconnected. The 2x heartbeat interval timeout (60 seconds) provides some tolerance but is not perfect.

3. **Mobile browser limitations:** Mobile browsers aggressively suspend background tabs and WebSocket connections. A user with chatta open on a mobile browser may appear offline even though the app is "open" (just backgrounded). This is a fundamental limitation of mobile browser behavior.

4. **Scalability ceiling:** The in-memory presence manager works well for single-server deployments but requires Redis or similar for horizontal scaling. The per-user, per-device state grows linearly with connections.

5. **Privacy complexity:** Implementing per-user visibility controls (hide from specific users) adds significant complexity to the broadcast logic. Each presence update must be filtered against the recipient's visibility permissions.

6. **Clock skew issues:** The `lastSeenAt` and `updatedAt` timestamps rely on server time. In a multi-server deployment, clock skew between servers can cause incorrect presence ordering and stale data.

7. **Cleanup overhead:** The cleanup goroutine must periodically scan all users and devices to detect stale connections. For large deployments (10K+ users), this scan becomes expensive and may need to be optimized with indexed data structures.

8. **Race conditions in state transitions:** Rapid connect/disconnect events (network flapping) can cause race conditions in the presence state machine. A user may briefly appear online/offline/online in rapid succession, causing UI flicker.

---

## Technical Details

### Redis Scaling Layer (Future)

```go
// When scaling beyond single server, use Redis for presence state
type RedisPresenceStore struct {
    redis *redis.Client
    ttl   time.Duration
}

func (s *RedisPresenceStore) SetDevicePresence(userID, deviceID string, status Status) error {
    key := fmt.Sprintf("presence:%s:%s", userID, deviceID)
    data, _ := json.Marshal(map[string]interface{}{
        "status":  status,
        "updated": time.Now().Unix(),
    })

    return s.redis.Set(
        context.Background(),
        key,
        data,
        s.ttl, // Auto-expire if heartbeat stops
    ).Err()
}

func (s *RedisPresenceStore) GetUserPresence(userID string) (Status, error) {
    // Get all devices for user
    keys, _ := s.redis.Keys(context.Background(),
        fmt.Sprintf("presence:%s:*", userID)).Result()

    hasOnline := false
    for _, key := range keys {
        data, _ := s.redis.Get(context.Background(), key).Result()
        var device map[string]interface{}
        json.Unmarshal([]byte(data), &device)
        if device["status"] == string(StatusOnline) {
            hasOnline = true
            break
        }
    }

    if hasOnline {
        return StatusOnline, nil
    }
    return StatusOffline, nil
}
```

### Database Schema for Last Seen

```sql
-- Persist last seen timestamps (updated on disconnect)
ALTER TABLE users ADD COLUMN last_seen_at TIMESTAMPTZ;
ALTER TABLE users ADD COLUMN presence_status VARCHAR(20) DEFAULT 'offline';

-- Update on disconnect
UPDATE users
SET last_seen_at = NOW(),
    presence_status = 'offline'
WHERE id = $1;

-- Query last seen
SELECT id, username, display_name, last_seen_at, presence_status
FROM users
WHERE id = ANY($1);
```

### Presence WebSocket Events

```
Event Flow:

Client                              Server
  │                                  │
  │── CONNECT (WebSocket) ──────────▶│
  │                                  │
  │◀── presence_update ──────────────│
  │    {user_id: me, status: online} │
  │                                  │
  │── presence_update ──────────────▶│
  │    {status: online}              │
  │                                  │
  │◀── presence_update ──────────────│
  │    {user_id: bob, status: online}│
  │    (bob is in same room)         │
  │                                  │
  │── heartbeat ────────────────────▶│
  │    {device_id: "abc123"}         │
  │                                  │
  │◀── heartbeat_ack ────────────────│
  │    {server_time: 1712188800000}  │
  │                                  │
  │── presence_update ──────────────▶│
  │    {status: dnd,                 │
  │     custom_status: "In a meeting"}│
  │                                  │
  │◀── presence_update ──────────────│
  │    {user_id: me, status: dnd,    │
  │     custom_status: "In a meeting"}│
  │                                  │
  │── DISCONNECT ───────────────────▶│
  │                                  │
  │◀── presence_update ──────────────│
  │    {user_id: me, status: offline}│
  │    (broadcast to room members)   │
```

---

## Alternatives Considered

### Alternative 1: Dedicated Presence Service

**Description:** Run a separate microservice solely for presence management.

**Pros:**
- Independent scaling
- Dedicated resources
- Clear separation of concerns
- Can be shared across services

**Cons:**
- Additional operational complexity
- Network hop for every presence update
- Overkill for MVP scale
- Additional failure domain

**Why Rejected:** The added complexity is not justified for the MVP. Presence can be handled by the existing signaling server.

### Alternative 2: MQTT Last Will and Testament

**Description:** Use MQTT's built-in Last Will feature for offline detection.

**Pros:**
- Built-in offline detection
- Standard protocol feature
- No application-level heartbeat needed

**Cons:**
- Requires MQTT broker
- Last Will only detects broker disconnection
- No granular away detection
- Additional protocol stack

**Why Rejected:** MQTT is not the primary transport protocol (ADR-001). Adding MQTT solely for presence introduces unnecessary infrastructure.

### Alternative 3: Database-Driven Presence

**Description:** Store presence state in PostgreSQL with periodic polling.

**Pros:**
- Persistent across restarts
- Queryable history
- No additional infrastructure

**Cons:**
- Polling overhead
- Higher latency for updates
- Database write amplification
- Not real-time

**Why Rejected:** Polling-based presence is fundamentally at odds with real-time requirements. The latency and database load are unacceptable.

### Alternative 4: SSE for Presence, WebSocket for Messages

**Description:** Use SSE for presence broadcasts and WebSocket for messaging.

**Pros:**
- SSE auto-reconnects
- Simpler presence protocol
- Separation of concerns

**Cons:**
- Two connections per client
- SSE is unidirectional (can't send heartbeats)
- Additional server resources
- Browser connection limits

**Why Rejected:** Maintaining two connections per client is wasteful. WebSocket can handle both presence and messaging efficiently.

---

## Implementation Notes

### Phase 1: Basic Presence (MVP)

1. Implement in-memory presence manager in Go
2. Add WebSocket connection state tracking
3. Implement basic online/offline detection
4. Add presence broadcast to room members
5. Implement client-side activity tracker

### Phase 2: Enhanced Presence

1. Add automatic away detection (activity timeout)
2. Implement multi-device aggregation
3. Add manual status override (DND, custom status)
4. Implement "last seen" persistence in PostgreSQL
5. Add presence history (audit trail)

### Phase 3: Scalable Presence

1. Add Redis layer for horizontal scaling
2. Implement cross-server presence synchronization
3. Add presence privacy controls
4. Implement presence analytics
5. Add rate limiting for presence updates

### Configuration

```go
type PresenceConfig struct {
    // Timeouts
    AwayTimeout        time.Duration // Default: 5 minutes
    CleanupInterval    time.Duration // Default: 1 minute
    HeartbeatInterval  time.Duration // Default: 30 seconds
    HeartbeatTimeout   time.Duration // Default: 60 seconds (2x interval)

    // Limits
    MaxDevicesPerUser  int           // Default: 10
    BroadcastBufferSize int          // Default: 1000
    SubscriberBufferSize int         // Default: 100

    // Privacy
    AllowInvisible     bool          // Default: true
    AllowCustomStatus  bool          // Default: true
    MaxCustomStatusLen int           // Default: 128
}
```

### Monitoring Metrics

```go
// Expose via Prometheus
var (
    presenceOnlineUsers = prometheus.NewGauge(prometheus.GaugeOpts{
        Name: "chatta_presence_online_users",
        Help: "Number of users currently online",
    })

    presenceTotalDevices = prometheus.NewGauge(prometheus.GaugeOpts{
        Name: "chatta_presence_total_devices",
        Help: "Total number of active device connections",
    })

    presenceUpdatesTotal = prometheus.NewCounter(prometheus.CounterOpts{
        Name: "chatta_presence_updates_total",
        Help: "Total number of presence updates broadcast",
    })

    presenceHeartbeatLatency = prometheus.NewHistogram(prometheus.HistogramOpts{
        Name:    "chatta_presence_heartbeat_latency_ms",
        Help:    "Latency of heartbeat responses",
        Buckets: prometheus.ExponentialBuckets(1, 2, 10),
    })
)
```

---

## Cross-References

- **SOTA Research:** [REALTIME_CHAT_SOTA.md](../research/REALTIME_CHAT_SOTA.md) - Presence detection systems section
- **ADR-001:** [ADR-001-realtime-protocol.md](./ADR-001-realtime-protocol.md) - Real-time protocol selection (WebSocket foundation)
- **ADR-002:** [ADR-002-message-storage.md](./ADR-002-message-storage.md) - Message storage strategy (last_seen persistence)
- **SPEC.md:** [../../SPEC.md](../../SPEC.md) - User and Presence data models
- **PRD.md:** [../../PRD.md](../../PRD.md) - P3.4: Presence feature
- **PLAN.md:** [../../PLAN.md](../../PLAN.md) - Phase 3 implementation plan

---

*This ADR was proposed on 2026-04-03 by the Phenotype Architecture Team. Pending review and acceptance.*