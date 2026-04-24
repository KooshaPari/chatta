# AGENTS.md — chatta

## Project Overview

- **Name**: chatta (Chat Application Platform)
- **Description**: Full-stack chat application with real-time messaging, AI integration, and multi-channel support
- **Location**: `/Users/kooshapari/CodeProjects/Phenotype/repos/chatta`
- **Language Stack**: React 18+, Node.js 20+, Express, Socket.IO, PostgreSQL
- **Published**: Private (Phenotype org)

## Quick Start

```bash
# Navigate to project
cd /Users/kooshapari/CodeProjects/Phenotype/repos/chatta

# Install dependencies
cd backend && npm install
cd ../frontend && npm install

# Set up environment
cp backend/.env.example backend/.env
# Edit .env with your configuration

# Start database
docker-compose up -d postgres

# Run migrations
cd backend && npm run migrate

# Start development servers
cd backend && npm run dev
cd frontend && npm start
```

## Architecture

### Full-Stack Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                     Frontend Layer                               │
│  ┌──────────────────────────────────────────────────────────┐ │
│  │                    React Application                      │ │
│  │                                                              │ │
│  │  ┌─────────────────┐  ┌─────────────────┐              │ │
│  │  │   Chat UI       │  │   Real-time     │              │ │
│  │  │   Components    │  │   Socket Client │              │ │
│  │  │                 │  │                 │              │ │
│  │  │  • MessageList  │  │  • Socket.IO    │              │ │
│  │  │  • InputBox     │  │  • Reconnect    │              │ │
│  │  │  • UserList     │  │  • Event Emit   │              │ │
│  │  └─────────────────┘  └─────────────────┘              │ │
│  │                                                              │ │
│  │  ┌─────────────────┐  ┌─────────────────┐              │ │
│  │  │   State Mgmt    │  │   API Client    │              │ │
│  │  │   (Zustand)     │  │   (Axios/Fetch) │              │ │
│  │  └─────────────────┘  └─────────────────┘              │ │
│  └──────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
            │                   │
            │                   │
            ▼                   ▼
┌─────────────────────────────────────────────────────────────────┐
│                     Backend Layer                                │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐ │
│  │   Express API   │  │   Socket.IO     │  │   AI Service    │ │
│  │   REST Routes   │  │   Real-time     │  │   Integration   │ │
│  └────────┬────────┘  └────────┬────────┘  └────────┬────────┘ │
└───────────┼───────────────────┼───────────────────┼──────────────┘
            │                   │                   │
            └───────────────────┼───────────────────┘
                                │
┌───────────────────────────────▼───────────────────────────────┐
│                     Service Layer                                │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐│
│  │   Message       │  │   Channel       │  │   User          ││
│  │   Service       │  │   Service       │  │   Service       ││
│  └────────┬────────┘  └────────┬────────┘  └────────┬────────┘│
└───────────┼───────────────────┼───────────────────┼───────────────┘
            │                   │                   │
┌───────────▼───────────────────▼───────────────────▼───────────┐
│                     Data Layer                                   │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐│
│  │   PostgreSQL    │  │   Redis         │  │   File Store    ││
│  │   (Primary)     │  │   (Cache/Sess)  │  │   (Uploads)     ││
│  └─────────────────┘  └─────────────────┘  └─────────────────┘│
└─────────────────────────────────────────────────────────────────┘
```

### Real-Time Message Flow

```
┌──────────┐    ┌──────────┐    ┌──────────┐    ┌──────────┐    ┌──────────┐
│  User A  │───▶│ Frontend │───▶│ Socket   │───▶│ Backend  │───▶│ Database │
│  Sends   │    │  Emits   │    │  Server  │    │ Handler  │    │  Store   │
└──────────┘    └──────────┘    └──────────┘    └──────────┘    └──────────┘
     │               │               │               │               │
     │               │               │               │               │
     │               │               │               │               ▼
     │               │               │               │        ┌──────────┐
     │               │               │               │        │ Publish  │
     │               │               │               │        │ Event    │
     │               │               │               │        └──────────┘
     │               │               │               │               │
     ▼               ▼               ▼               ▼               ▼
┌──────────┐    ┌──────────┐    ┌──────────┐    ┌──────────┐    ┌──────────┐
│  User B  │◀───│ Frontend │◀───│ Socket   │◀───│ Backend  │◀───│  Redis   │
│ Receives │    │  Listens │    │  Client  │    │  Pub/Sub │    │  Channel │
└──────────┘    └──────────┘    └──────────┘    └──────────┘    └──────────┘
```

## Quality Standards

### TypeScript Code Quality

- **Formatter**: Prettier with 100 char line length
- **Linter**: ESLint with TypeScript plugin
- **Type Checker**: Strict mode enabled
- **Import Organization**: ESLint import plugin

### Backend Code Quality

- **Formatter**: Prettier
- **Linter**: ESLint
- **Style Guide**: Airbnb JavaScript
- **Tests**: Jest with coverage >80%

### Test Requirements

```bash
# Backend tests
cd backend && npm test

# Frontend tests
cd frontend && npm test

# E2E tests
npm run test:e2e

# Coverage
cd backend && npm run test:coverage
cd frontend && npm run test:coverage
```

## Git Workflow

### Branch Naming

Format: `<type>/<area>/<description>`

Types: `feat`, `fix`, `api`, `ui`, `socket`

Examples:
- `feat/socket/add-typing-indicators`
- `fix/api/handle-message-pagination`
- `ui/components/add-reactions`

### Commit Messages

Format: `<type>(<scope>): <description>`

Examples:
- `feat(messages): add message threading support`
- `fix(socket): resolve disconnect race condition`
- `ui(components): redesign message input`

## File Structure

```
chatta/
├── backend/
│   ├── src/
│   │   ├── server.ts          # Express + Socket.IO setup
│   │   ├── routes/            # API routes
│   │   │   ├── messages.ts
│   │   │   ├── channels.ts
│   │   │   └── users.ts
│   │   ├── services/          # Business logic
│   │   ├── models/            # Database models
│   │   ├── middleware/        # Auth, validation
│   │   └── socket/            # Socket event handlers
│   ├── migrations/            # Database migrations
│   ├── tests/
│   ├── package.json
│   └── .env.example
├── frontend/
│   ├── src/
│   │   ├── components/        # React components
│   │   │   ├── Chat/
│   │   │   ├── Message/
│   │   │   └── UserList/
│   │   ├── hooks/             # Custom hooks
│   │   ├── stores/            # Zustand stores
│   │   ├── services/          # API services
│   │   ├── types/             # TypeScript types
│   │   └── App.tsx
│   ├── public/
│   ├── package.json
│   └── tsconfig.json
├── docker-compose.yml
└── AGENTS.md                  # This file
```

## CLI Commands

```bash
# Backend
cd backend
npm install
npm run dev                  # Development with hot reload
npm run build                # Production build
npm start                    # Run production build
npm test                     # Run tests
npm run migrate              # Run database migrations
npm run migrate:rollback     # Rollback migrations

# Frontend
cd frontend
npm install
npm start                    # Development server
npm run build                # Production build
npm test                     # Run tests
npm run lint                 # ESLint check

# Docker
docker-compose up -d         # Start services
docker-compose down          # Stop services
docker-compose logs -f       # View logs
```

## Configuration

### Backend .env

```env
NODE_ENV=development
PORT=3000

# Database
DATABASE_URL=postgresql://user:pass@localhost:5432/chatta

# Redis
REDIS_URL=redis://localhost:6379

# JWT
JWT_SECRET=your-secret-key
JWT_EXPIRES_IN=7d

# AI Integration
OPENAI_API_KEY=sk-...
AI_ENABLED=true

# Socket.IO
SOCKET_CORS_ORIGIN=http://localhost:3000
```

### Frontend .env

```env
REACT_APP_API_URL=http://localhost:3000/api
REACT_APP_SOCKET_URL=http://localhost:3000
REACT_APP_AI_ENABLED=true
```

## Socket.IO Events

### Client → Server

| Event | Payload | Description |
|-------|---------|-------------|
| `message:send` | `{ content, channelId }` | Send message |
| `typing:start` | `{ channelId }` | Start typing |
| `typing:stop` | `{ channelId }` | Stop typing |
| `channel:join` | `{ channelId }` | Join channel |
| `channel:leave` | `{ channelId }` | Leave channel |

### Server → Client

| Event | Payload | Description |
|-------|---------|-------------|
| `message:received` | `Message` | New message |
| `user:typing` | `{ userId, channelId }` | User typing |
| `user:online` | `{ userId }` | User online |
| `user:offline` | `{ userId }` | User offline |

## Troubleshooting

### Socket connection failing

```bash
# Check Socket.IO server
curl http://localhost:3000/socket.io/

# Check CORS configuration
# Ensure SOCKET_CORS_ORIGIN matches frontend URL

# Monitor connections
redis-cli pubsub channels
```

### Database migration errors

```bash
# Reset database
docker-compose down -v
docker-compose up -d postgres
cd backend && npm run migrate

# Check migration status
npx knex migrate:status
```

### Frontend build failing

```bash
# Clear cache
rm -rf frontend/node_modules frontend/build
npm install
npm start

# Check TypeScript
cd frontend && npx tsc --noEmit
```

## Resources

- [Socket.IO Documentation](https://socket.io/docs/)
- [React Documentation](https://react.dev/)
- [Express.js Guide](https://expressjs.com/)
- [Phenotype Registry](https://github.com/KooshaPari/phenotype-registry)

## Agent Notes

**Critical Implementation Details:**
- Socket rooms for channel isolation
- Message pagination with cursor
- Typing indicators with debounce
- Online status with heartbeat

**Known Gotchas:**
- Socket disconnects on network change
- Large message history needs pagination
- Emoji rendering varies by OS
- File uploads need size limits

**Testing Strategy:**
- Mock Socket.IO for unit tests
- Test with multiple concurrent clients
- Validate message ordering
- Test reconnection behavior
