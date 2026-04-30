# ADR-002: Message Storage Strategy

**Document ID:** PHENOTYPE_CHATTA_ADR_002  
**Status:** Accepted  
**Last Updated:** 2026-04-03  
**Author:** Phenotype Architecture Team  
**Supersedes:** N/A  
**Related ADRs:** [ADR-001](./ADR-001-realtime-protocol.md), [ADR-003](./ADR-003-presence-system.md)

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

chatta requires a persistent storage mechanism for chat messages. Unlike ephemeral P2P communication, users expect message history to be available across sessions, devices, and reconnections.

### Requirements

| ID | Requirement | Priority | Notes |
|----|-------------|----------|-------|
| R1 | Durable message persistence | Critical | Messages survive server restarts |
| R2 | Message history retrieval | Critical | Paginated fetch on room open |
| R3 | Message editing support | High | In-place updates with audit trail |
| R4 | Message deletion support | High | Soft delete with tombstones |
| R5 | Thread/reply support | High | Parent-child message relationships |
| R6 | Full-text search | Medium | Search across message content |
| R7 | Access control enforcement | Critical | Server-side room membership checks |
| R8 | Message ordering | Critical | Deterministic ordering within rooms |
| R9 | Scalability to 1M+ messages | Medium | Per-room message volume |
| R10 | Backup and recovery | High | Disaster recovery capability |

### Constraints

- Backend is Go (database driver ecosystem)
- Must support real-time notifications on new messages
- Must enforce per-room access controls at the storage layer
- MVP scope: single-server deployment initially
- No external search engine for MVP

### Data Volume Estimates

```
Message Volume Projections:

Small deployment (100 users):
- Messages/day: ~5,000
- Messages/year: ~1.8M
- Storage/year: ~500MB (text only)

Medium deployment (10,000 users):
- Messages/day: ~500,000
- Messages/year: ~180M
- Storage/year: ~50GB (text only)

Large deployment (100,000 users):
- Messages/day: ~5M
- Messages/year: ~1.8B
- Storage/year: ~500GB (text only)
```

### Access Patterns

```
Read/Write Pattern Analysis:

Write Operations:
- INSERT message:     70% of writes
- UPDATE (edit):      15% of writes
- UPDATE (soft del):  10% of writes
- UPDATE (metadata):   5% of writes

Read Operations:
- SELECT recent msgs:  50% of reads (pagination)
- SELECT by ID:        20% of reads (edit/delete context)
- SELECT threads:      15% of reads (thread replies)
- Full-text search:    10% of reads
- SELECT count:         5% of reads (unread counts)

Pattern: Write-heavy during active hours, read-heavy on room open
```

---

## Decision

We will use **PostgreSQL** as the primary message storage engine with the following design:

### Primary Decision

**PostgreSQL** for all message storage, leveraging its ACID compliance, full-text search capabilities, and LISTEN/NOTIFY for real-time notifications.

### Schema Design

```sql
-- Core message table
CREATE TABLE messages (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    room_id       UUID NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
    author_id     UUID NOT NULL REFERENCES users(id),
    content       TEXT NOT NULL CHECK (char_length(content) <= 4096),
    message_type  VARCHAR(20) NOT NULL DEFAULT 'text'
                    CHECK (message_type IN ('text', 'system', 'file', 'image')),
    parent_id     UUID REFERENCES messages(id) ON DELETE SET NULL,
    edited_at     TIMESTAMPTZ,
    deleted_at    TIMESTAMPTZ,  -- Soft delete (tombstone)
    sequence_num  BIGINT NOT NULL,  -- Per-room ordering
    created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Per-room sequence counter
CREATE TABLE room_sequences (
    room_id  UUID PRIMARY KEY REFERENCES rooms(id) ON DELETE CASCADE,
    seq      BIGINT NOT NULL DEFAULT 0
);

-- Full-text search index
ALTER TABLE messages ADD COLUMN search_vector tsvector
    GENERATED ALWAYS AS (
        setweight(to_tsvector('english', content), 'A')
    ) STORED;

CREATE INDEX idx_messages_search ON messages USING GIN(search_vector);

-- Core indexes
CREATE INDEX idx_messages_room_seq ON messages(room_id, sequence_num DESC);
CREATE INDEX idx_messages_room_created ON messages(room_id, created_at DESC);
CREATE INDEX idx_messages_author ON messages(author_id);
CREATE INDEX idx_messages_parent ON messages(parent_id) WHERE parent_id IS NOT NULL;
CREATE INDEX idx_messages_deleted ON messages(deleted_at) WHERE deleted_at IS NOT NULL;

-- Edit history (audit trail)
CREATE TABLE message_edits (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    message_id  UUID NOT NULL REFERENCES messages(id) ON DELETE CASCADE,
    old_content TEXT NOT NULL,
    edited_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    editor_id   UUID NOT NULL REFERENCES users(id)
);

-- Message delivery tracking (for ACK-based delivery)
CREATE TABLE message_delivery (
    message_id  UUID NOT NULL REFERENCES messages(id) ON DELETE CASCADE,
    user_id     UUID NOT NULL REFERENCES users(id),
    delivered_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    read_at     TIMESTAMPTZ,
    PRIMARY KEY (message_id, user_id)
);
```

### Schema Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                      Database Schema                             │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────────┐     ┌──────────────┐     ┌──────────────┐    │
│  │    users     │     │    rooms     │     │  participants │    │
│  ├──────────────┤     ├──────────────┤     ├──────────────┤    │
│  │ id (PK)      │     │ id (PK)      │     │ id (PK)      │    │
│  │ username     │     │ type         │     │ room_id (FK) │───▶│
│  │ password_hash│     │ name         │     │ user_id (FK) │───▶│
│  │ display_name │     │ settings     │     │ role         │    │
│  │ public_key   │     │ created_at   │     │ joined_at    │    │
│  │ created_at   │     └──────┬───────┘     │ last_read_at │    │
│  └──────┬───────┘            │             └──────────────┘    │
│         │                    │                                  │
│         │              ┌─────▼───────┐                          │
│         │              │  messages   │                          │
│         │              ├─────────────┤                          │
│         │              │ id (PK)     │                          │
│         │              │ room_id(FK) │───▶                      │
│         │              │ author_id   │───▶                      │
│         │              │ content     │                          │
│         │              │ message_type│                          │
│         │              │ parent_id   │──┐ (self-ref for threads)│
│         │              │ edited_at   │  │                       │
│         │              │ deleted_at  │  │                       │
│         │              │ sequence_num│  │                       │
│         │              │ created_at  │  │                       │
│         │              └─────────────┘  │                       │
│         │                               │                       │
│         │              ┌────────────────┘                       │
│         │              │                                        │
│         │    ┌─────────▼─────────┐                              │
│         │    │  message_edits    │                              │
│         │    ├───────────────────┤                              │
│         │    │ id (PK)           │                              │
│         │    │ message_id (FK)───│──────▶                       │
│         │    │ old_content       │                              │
│         │    │ edited_at         │                              │
│         │    │ editor_id (FK)───▶│──────▶                       │
│         │    └───────────────────┘                              │
│         │                                                       │
│         │    ┌───────────────────┐                              │
│         │    │ message_delivery  │                              │
│         │    ├───────────────────┤                              │
│         │    │ message_id (FK)───│──────▶                       │
│         │    │ user_id (FK) ─────│──────▶                       │
│         │    │ delivered_at      │                              │
│         │    │ read_at           │                              │
│         │    └───────────────────┘                              │
└─────────────────────────────────────────────────────────────────┘
```

### Message Ordering Strategy

```
Per-Room Sequence Numbering:

Room "general":
┌────────────┬──────────────┬──────────┬─────────────┐
│ message_id │ sequence_num │ content  │ created_at  │
├────────────┼──────────────┼──────────┼─────────────┤
│ uuid-001   │ 1            │ "Hello"  │ 10:00:00.000│
│ uuid-002   │ 2            │ "Hi!"    │ 10:00:00.001│
│ uuid-003   │ 3            │ "How..." │ 10:00:00.001│
│ uuid-004   │ 4            │ "Fine"   │ 10:00:00.002│
└────────────┴──────────────┴──────────┴─────────────┘

Sequence generation (atomic):
UPDATE room_sequences SET seq = seq + 1 WHERE room_id = $1 RETURNING seq;
→ Returns next sequential number, guaranteed unique per room
```

### Soft Delete Implementation

```sql
-- Soft delete (tombstone)
UPDATE messages
SET deleted_at = NOW(),
    content = '[message deleted]',
    updated_at = NOW()
WHERE id = $1 AND author_id = $2 AND deleted_at IS NULL;

-- Hard delete (admin only, after retention period)
DELETE FROM messages
WHERE deleted_at < NOW() - INTERVAL '90 days';

-- Query excludes soft-deleted by default
SELECT * FROM messages
WHERE room_id = $1
  AND deleted_at IS NULL
ORDER BY sequence_num DESC
LIMIT 50;
```

### Real-Time Notifications via LISTEN/NOTIFY

```go
package store

import (
    "context"
    "database/sql"
    "encoding/json"
    "fmt"

    "github.com/lib/pq"
)

type MessageStore struct {
    db       *sql.DB
    listener *pq.Listener
}

func (s *MessageStore) StartListening(ctx context.Context, handler func(Message)) error {
    s.listener = pq.NewListener(s.connString, 10*time.Second, time.Minute, nil)

    if err := s.listener.Listen("new_message"); err != nil {
        return err
    }

    go func() {
        for {
            select {
            case <-ctx.Done():
                return
            case notification := <-s.listener.Notify:
                var msg Message
                if err := json.Unmarshal([]byte(notification.Extra), &msg); err != nil {
                    continue
                }
                handler(msg)
            }
        }
    }()

    return nil
}

func (s *MessageStore) CreateMessage(ctx context.Context, msg *Message) error {
    return s.db.QueryRowContext(ctx, `
        WITH next_seq AS (
            UPDATE room_sequences SET seq = seq + 1
            WHERE room_id = $1 RETURNING seq
        ),
        inserted AS (
            INSERT INTO messages (id, room_id, author_id, content, message_type,
                                  parent_id, sequence_num, created_at, updated_at)
            VALUES ($2, $1, $3, $4, $5, $6, (SELECT seq FROM next_seq),
                    NOW(), NOW())
            RETURNING id, room_id, author_id, content, message_type,
                      parent_id, sequence_num, created_at, updated_at
        )
        SELECT * FROM inserted
    `, msg.RoomID, msg.ID, msg.AuthorID, msg.Content, msg.MessageType,
        msg.ParentID).Scan(
        &msg.ID, &msg.RoomID, &msg.AuthorID, &msg.Content, &msg.MessageType,
        &msg.ParentID, &msg.SequenceNum, &msg.CreatedAt, &msg.UpdatedAt,
    )

    // Notify listeners
    msgJSON, _ := json.Marshal(msg)
    _, err := s.db.ExecContext(ctx, "NOTIFY new_message, $1", msgJSON)
    return err
}
```

### Pagination Strategy

```go
// Cursor-based pagination (preferred over OFFSET)
func (s *MessageStore) GetMessages(ctx context.Context, roomID string, cursor int64, limit int) ([]Message, error) {
    query := `
        SELECT id, room_id, author_id, content, message_type,
               parent_id, edited_at, deleted_at, sequence_num, created_at
        FROM messages
        WHERE room_id = $1
          AND deleted_at IS NULL
          AND sequence_num < $2
        ORDER BY sequence_num DESC
        LIMIT $3
    `

    rows, err := s.db.QueryContext(ctx, query, roomID, cursor, limit)
    if err != nil {
        return nil, err
    }
    defer rows.Close()

    var messages []Message
    for rows.Next() {
        var msg Message
        err := rows.Scan(&msg.ID, &msg.RoomID, &msg.AuthorID, &msg.Content,
            &msg.MessageType, &msg.ParentID, &msg.EditedAt, &msg.DeletedAt,
            &msg.SequenceNum, &msg.CreatedAt)
        if err != nil {
            return nil, err
        }
        messages = append(messages, msg)
    }

    // Reverse to return oldest-first (chronological)
    for i, j := 0, len(messages)-1; i < j; i, j = i+1, j-1 {
        messages[i], messages[j] = messages[j], messages[i]
    }

    return messages, nil
}
```

---

## Consequences

### Positive Consequences

1. **ACID compliance:** PostgreSQL guarantees atomic message inserts with sequence number generation. No race conditions in message ordering, even under concurrent writes. The `UPDATE ... RETURNING` pattern ensures each message gets a unique, monotonically increasing sequence number per room.

2. **Built-in full-text search:** PostgreSQL's `tsvector`/`tsquery` system provides robust full-text search without external dependencies. The generated column approach keeps the search index automatically synchronized with message content.

3. **Real-time notifications via LISTEN/NOTIFY:** Native PostgreSQL pub/sub eliminates the need for Redis or other message brokers for real-time message distribution. The Go `pq` library provides a clean listener interface.

4. **Soft delete with audit trail:** The `deleted_at` tombstone pattern preserves referential integrity (thread replies still work) while hiding deleted messages from normal queries. The `message_edits` table provides a complete edit history for moderation and audit purposes.

5. **Cursor-based pagination:** Using `sequence_num` as a cursor avoids the performance degradation of OFFSET-based pagination for deep scrollback. Query performance remains constant regardless of how far back in history the user scrolls.

6. **Single database for MVP:** PostgreSQL handles message storage, full-text search, and real-time notifications without requiring additional infrastructure. This reduces operational complexity and cost for the initial deployment.

7. **Referential integrity:** Foreign key constraints ensure that messages cannot reference non-existent rooms or users. CASCADE deletes clean up messages when rooms are deleted. SET NULL on `parent_id` preserves thread replies when parent messages are hard-deleted.

8. **Extensible schema:** The `message_type` enum allows future message types (file, image, system) without schema changes. The `content` field can store JSON for structured messages (e.g., file metadata) while remaining searchable as text.

### Negative Consequences

1. **Write amplification:** Each message insert triggers a sequence number update, a row insert, a search index update, and a NOTIFY event. Under high write loads, this can create I/O bottlenecks. Benchmarking is required to determine the write throughput ceiling.

2. **Connection pooling required:** PostgreSQL has a per-connection memory overhead (~10MB). With 10,000 concurrent WebSocket connections, direct database connections would exhaust server memory. PgBouncer or similar connection pooling is mandatory at scale.

3. **LISTEN/NOTIFY limitations:** PostgreSQL's NOTIFY does not persist notifications. If the Go listener disconnects and reconnects, it misses any notifications sent during the gap. A fallback mechanism (polling or message queue) is needed for reliability.

4. **Full-text search limitations:** PostgreSQL's built-in search is adequate for MVP but lacks advanced features like fuzzy matching, phrase search with proximity, and relevance tuning. Migration to Elasticsearch/OpenSearch may be needed for advanced search requirements.

5. **Single-server bottleneck:** The MVP design assumes a single PostgreSQL instance. Horizontal scaling requires read replicas, sharding, or a distributed database, each with significant architectural implications.

6. **Storage growth:** Without message retention policies, the database will grow unboundedly. The `message_edits` table in particular grows with every edit. Automated archival and cleanup jobs are required.

7. **Sequence number contention:** The `room_sequences` table becomes a hot spot under high write concurrency for active rooms. Each message insert requires an exclusive lock on the sequence row. Partitioning or application-level sequence generation may be needed for very active rooms.

8. **Backup complexity:** Continuous backup (WAL archiving) is required for point-in-time recovery. The backup process must coordinate with the Go application to ensure consistency between in-memory state and database state.

---

## Technical Details

### Go Repository Pattern

```go
package store

import (
    "context"
    "database/sql"
    "time"

    "github.com/google/uuid"
)

type Message struct {
    ID          uuid.UUID
    RoomID      uuid.UUID
    AuthorID    uuid.UUID
    Content     string
    MessageType string
    ParentID    *uuid.UUID
    EditedAt    *time.Time
    DeletedAt   *time.Time
    SequenceNum int64
    CreatedAt   time.Time
    UpdatedAt   time.Time
}

type MessageRepository struct {
    db *sql.DB
}

func NewMessageRepository(db *sql.DB) *MessageRepository {
    return &MessageRepository{db: db}
}

func (r *MessageRepository) Create(ctx context.Context, msg *Message) error {
    if msg.ID == uuid.Nil {
        msg.ID = uuid.New()
    }

    err := r.db.QueryRowContext(ctx, `
        WITH next_seq AS (
            UPDATE room_sequences SET seq = seq + 1
            WHERE room_id = $1 RETURNING seq
        )
        INSERT INTO messages (id, room_id, author_id, content, message_type,
                              parent_id, sequence_num, created_at, updated_at)
        VALUES ($2, $1, $3, $4, $5, $6, (SELECT seq FROM next_seq), NOW(), NOW())
        RETURNING sequence_num, created_at
    `, msg.RoomID, msg.ID, msg.AuthorID, msg.Content, msg.MessageType,
        msg.ParentID).Scan(&msg.SequenceNum, &msg.CreatedAt)

    return err
}

func (r *MessageRepository) Update(ctx context.Context, id uuid.UUID, authorID uuid.UUID, newContent string) error {
    result, err := r.db.ExecContext(ctx, `
        UPDATE messages
        SET content = $1, edited_at = NOW(), updated_at = NOW()
        WHERE id = $2 AND author_id = $3 AND deleted_at IS NULL
    `, newContent, id, authorID)

    if err != nil {
        return err
    }

    rows, _ := result.RowsAffected()
    if rows == 0 {
        return sql.ErrNoRows
    }

    // Record edit history
    _, err = r.db.ExecContext(ctx, `
        INSERT INTO message_edits (message_id, old_content, edited_at, editor_id)
        SELECT $1, content, NOW(), $2 FROM messages WHERE id = $1
    `, id, authorID)

    return err
}

func (r *MessageRepository) Delete(ctx context.Context, id uuid.UUID, authorID uuid.UUID) error {
    result, err := r.db.ExecContext(ctx, `
        UPDATE messages
        SET deleted_at = NOW(), content = '[message deleted]', updated_at = NOW()
        WHERE id = $1 AND author_id = $2 AND deleted_at IS NULL
    `, id, authorID)

    if err != nil {
        return err
    }

    rows, _ := result.RowsAffected()
    if rows == 0 {
        return sql.ErrNoRows
    }

    return nil
}

func (r *MessageRepository) GetThreadReplies(ctx context.Context, parentID uuid.UUID, limit int) ([]Message, error) {
    rows, err := r.db.QueryContext(ctx, `
        SELECT id, room_id, author_id, content, message_type,
               parent_id, edited_at, deleted_at, sequence_num, created_at
        FROM messages
        WHERE parent_id = $1
          AND deleted_at IS NULL
        ORDER BY sequence_num ASC
        LIMIT $2
    `, parentID, limit)

    if err != nil {
        return nil, err
    }
    defer rows.Close()

    var messages []Message
    for rows.Next() {
        var msg Message
        err := rows.Scan(&msg.ID, &msg.RoomID, &msg.AuthorID, &msg.Content,
            &msg.MessageType, &msg.ParentID, &msg.EditedAt, &msg.DeletedAt,
            &msg.SequenceNum, &msg.CreatedAt)
        if err != nil {
            return nil, err
        }
        messages = append(messages, msg)
    }

    return messages, rows.Err()
}
```

### Database Migrations

```sql
-- migrations/001_initial_schema.sql
BEGIN;

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- Users table
CREATE TABLE users (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    username      VARCHAR(50) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    display_name  VARCHAR(100) NOT NULL,
    avatar_url    TEXT,
    public_key    TEXT,
    created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Rooms table
CREATE TABLE rooms (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    type        VARCHAR(20) NOT NULL CHECK (type IN ('dm', 'group')),
    name        VARCHAR(100),
    settings    JSONB NOT NULL DEFAULT '{}',
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Participants table
CREATE TABLE participants (
    id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    room_id      UUID NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
    user_id      UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role         VARCHAR(20) NOT NULL DEFAULT 'member'
                 CHECK (role IN ('owner', 'admin', 'member')),
    joined_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    last_read_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(room_id, user_id)
);

-- Room sequences table
CREATE TABLE room_sequences (
    room_id UUID PRIMARY KEY REFERENCES rooms(id) ON DELETE CASCADE,
    seq     BIGINT NOT NULL DEFAULT 0
);

-- Messages table
CREATE TABLE messages (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    room_id       UUID NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
    author_id     UUID NOT NULL REFERENCES users(id),
    content       TEXT NOT NULL CHECK (char_length(content) <= 4096),
    message_type  VARCHAR(20) NOT NULL DEFAULT 'text'
                  CHECK (message_type IN ('text', 'system', 'file', 'image')),
    parent_id     UUID REFERENCES messages(id) ON DELETE SET NULL,
    edited_at     TIMESTAMPTZ,
    deleted_at    TIMESTAMPTZ,
    sequence_num  BIGINT NOT NULL,
    created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_messages_room_seq ON messages(room_id, sequence_num DESC);
CREATE INDEX idx_messages_author ON messages(author_id);
CREATE INDEX idx_messages_parent ON messages(parent_id) WHERE parent_id IS NOT NULL;
CREATE INDEX idx_participants_user ON participants(user_id);
CREATE INDEX idx_participants_room ON participants(room_id);

-- Full-text search
ALTER TABLE messages ADD COLUMN search_vector tsvector
    GENERATED ALWAYS AS (setweight(to_tsvector('english', content), 'A')) STORED;
CREATE INDEX idx_messages_search ON messages USING GIN(search_vector);

-- Message edits audit table
CREATE TABLE message_edits (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    message_id  UUID NOT NULL REFERENCES messages(id) ON DELETE CASCADE,
    old_content TEXT NOT NULL,
    edited_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    editor_id   UUID NOT NULL REFERENCES users(id)
);

COMMIT;
```

---

## Alternatives Considered

### Alternative 1: SQLite

**Description:** Use SQLite for embedded, file-based storage.

**Pros:**
- Zero configuration
- Single file database
- Excellent Go support (modernc.org/sqlite)
- Low memory footprint

**Cons:**
- No LISTEN/NOTIFY (no real-time notifications)
- Limited concurrency (write serialization)
- No built-in full-text search (requires FTS5 extension)
- No connection pooling (single writer)
- Difficult to scale beyond single server

**Why Rejected:** The lack of real-time notifications and concurrency limitations make SQLite unsuitable for a multi-user real-time chat application.

### Alternative 2: MongoDB

**Description:** Use MongoDB for document-based message storage.

**Pros:**
- Flexible schema
- Native JSON storage
- Good horizontal scaling
- Change streams for real-time

**Cons:**
- No ACID transactions (multi-document)
- Weaker consistency guarantees
- No native full-text search ranking
- Larger operational footprint
- Go driver complexity

**Why Rejected:** Message ordering and consistency requirements are better served by PostgreSQL's ACID guarantees. The document model doesn't provide significant advantages for the structured message data model.

### Alternative 3: Redis + Append-Only File

**Description:** Use Redis as primary storage with AOF persistence.

**Pros:**
- Extremely fast reads/writes
- Native pub/sub
- Simple data structures
- Low latency

**Cons:**
- Not designed for durable storage
- AOF can lose data on crash
- No relational queries
- Memory-bound (all data in RAM)
- No full-text search

**Why Rejected:** Redis is excellent for caching and pub/sub but not suitable as the primary durable message store. Data loss risk and memory constraints make it inappropriate for message persistence.

### Alternative 4: Apache Cassandra

**Description:** Use Cassandra for distributed message storage.

**Pros:**
- Linear horizontal scaling
- High write throughput
- No single point of failure
- Tunable consistency

**Cons:**
- Complex operational requirements
- Overkill for MVP scale
- Eventual consistency (not ideal for message ordering)
- No native full-text search
- Steep learning curve

**Why Rejected:** Cassandra's complexity and eventual consistency model are not justified for the MVP scale. Can be considered if/when horizontal scaling becomes necessary.

---

## Implementation Notes

### Migration Strategy

```
Phase 1: Single PostgreSQL instance
┌──────────────┐
│  Go Server   │
│      │       │
│      ▼       │
│  PostgreSQL  │
│  (Primary)   │
└──────────────┘

Phase 2: Read replicas
┌──────────────┐     ┌──────────────┐
│  Go Server   │────▶│  PostgreSQL  │
│  (Writes)    │     │  (Primary)   │
└──────────────┘     └──────┬───────┘
                            │ Replication
                     ┌──────▼───────┐
                     │  PostgreSQL  │
                     │  (Replica)   │
                     └──────────────┘

Phase 3: Sharding (if needed)
┌──────────────┐     ┌──────────────┐
│  Go Server   │────▶│  Shard 1     │
│  (Router)    │     │  (Rooms A-M) │
└──────────────┘     └──────────────┘
       │             ┌──────────────┐
       └────────────▶│  Shard 2     │
                     │  (Rooms N-Z) │
                     └──────────────┘
```

### Retention Policy

```sql
-- Automated cleanup job (run daily)
-- 1. Hard delete messages older than retention period
DELETE FROM messages
WHERE deleted_at < NOW() - INTERVAL '90 days';

-- 2. Archive old message edits
INSERT INTO message_edits_archive
SELECT * FROM message_edits
WHERE edited_at < NOW() - INTERVAL '30 days';

DELETE FROM message_edits
WHERE edited_at < NOW() - INTERVAL '30 days';

-- 3. Vacuum to reclaim space
VACUUM ANALYZE messages;
VACUUM ANALYZE message_edits;
```

### Backup Strategy

```bash
#!/bin/bash
# Daily logical backup
pg_dump -U chatta -d chatta_db --format=custom \
  --compress=9 \
  --file="/backups/chatta_$(date +%Y%m%d).dump"

# Continuous WAL archiving (in postgresql.conf)
wal_level = replica
archive_mode = on
archive_command = 'cp %p /wal_archive/%f'

# Point-in-time recovery
# 1. Restore latest base backup
# 2. Replay WAL up to desired timestamp
```

---

## Cross-References

- **SOTA Research:** [REALTIME_CHAT_SOTA.md](../research/REALTIME_CHAT_SOTA.md) - Database-driven real-time section
- **ADR-001:** [ADR-001-realtime-protocol.md](./ADR-001-realtime-protocol.md) - Real-time protocol selection (message transport)
- **ADR-003:** [ADR-003-presence-system.md](./ADR-003-presence-system.md) - Presence system design
- **SPEC.md:** [../../SPEC.md](../../SPEC.md) - Data models and API reference
- **PRD.md:** [../../PRD.md](../../PRD.md) - E1.4: View message history

---

*This ADR was accepted on 2026-04-03 by the Phenotype Architecture Team.*