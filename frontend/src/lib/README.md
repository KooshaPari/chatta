# Chatta Frontend Lib

Shared utilities, types, constants, and stores for the chatta frontend application.

## Modules

### `constants.ts`
Application-wide constants including:
- `APP_NAME`, `APP_VERSION`
- `API_ENDPOINTS` - API route paths
- `MESSAGE_TYPES` - Chat message role types
- `CHAT_STATUS` - Chat state values
- `MAX_MESSAGE_LENGTH`, `REQUEST_TIMEOUT`

### `types.ts`
TypeScript interfaces:
- `User` - User entity
- `Message` - Chat message with role and timestamp
- `Presence` - User presence status
- `TypingIndicator` - Typing state
- `ApiResponse<T>` - Generic API response wrapper
- `ChatSession` - Chat session with messages

### `utils.ts`
Helper functions:
- `formatDate()` - Format date for display
- `formatRelativeTime()` - Format relative time ("2 hours ago")
- `truncate()` - Truncate text with ellipsis
- `isValidEmail()` - Email validation
- `generateId()` - Random ID generation
- `debounce()` - Debounce function
- `API_BASE_URL` - API base URL constant

### `stores.ts`
Svelte stores:
- `user` - Writable store for current user state

## Usage

Import from the barrel export:

```typescript
import { type User, type Message, formatDate, API_ENDPOINTS } from '$lib';
```

Or import specific modules:

```typescript
import { type Message } from '$lib/types';
import { formatRelativeTime } from '$lib/utils';
import { CHAT_STATUS } from '$lib/constants';
```

## Notes

- This lib is designed for shared frontend code across components and routes
- Types should be kept in sync with backend API responses
- Add new utilities here when used in multiple places
