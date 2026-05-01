/**
 * Constants for chatta frontend
 */

/**
 * Application-wide constants
 */
export const APP_NAME = 'chatta';
export const APP_VERSION = '1.0.0';

/**
 * API endpoints
 */
export const API_ENDPOINTS = {
	CHAT: '/api/chat',
	AUTH: '/api/auth',
	MESSAGES: '/api/messages',
	USERS: '/api/users',
} as const;

/**
 * Chat message types
 */
export const MESSAGE_TYPES = {
	USER: 'user',
	ASSISTANT: 'assistant',
	SYSTEM: 'system',
	ERROR: 'error',
} as const;

/**
 * Chat status
 */
export const CHAT_STATUS = {
	IDLE: 'idle',
	LOADING: 'loading',
	ERROR: 'error',
	SUCCESS: 'success',
} as const;

/**
 * Maximum lengths
 */
export const MAX_MESSAGE_LENGTH = 4000;
export const MAX_TOKENS_SUGGESTION = 2000;

/**
 * Timeouts (in milliseconds)
 */
export const REQUEST_TIMEOUT = 30000;
export const DEBOUNCE_DELAY = 300;
