/**
 * Constants for chatta frontend
 */

/**
 * Application-wide constants
 */
export const APP_NAME = 'chatta';
export const APP_VERSION = '1.0.0';
export const APP_DESCRIPTION = 'Real-time chat application';

/**
 * API configuration
 */
export const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';
export const API_TIMEOUT = 30000;

/**
 * API endpoints
 */
export const API_ENDPOINTS = {
	// Auth
	auth: {
		login: '/backend/login',
		signup: '/backend/signup',
		logout: '/backend/logout',
		refresh: '/backend/refresh',
	},
	// Chat
	chat: {
		chats: '/backend/chats',
		chat: (id: string) => `/backend/chats/${id}`,
		dm: '/backend/dm',
		thread: '/backend/thread',
		messages: '/backend/messages',
	},
	// Users
	users: {
		list: '/backend/users',
		profile: (id: string) => `/backend/users/${id}`,
		presence: '/backend/presence',
	},
	// WebSocket
	ws: {
		default: '/backend/ws',
		channel: (channel: string) => `/backend/ws?channel=${channel}`,
	},
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
 * Chat types
 */
export const CHAT_TYPES = {
	THREAD: 'thread',
	DM: 'dm',
	GC: 'gc',
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
 * Presence statuses
 */
export const PRESENCE_STATUS = {
	ONLINE: 'online',
	AWAY: 'away',
	OFFLINE: 'offline',
} as const;

/**
 * Connection states
 */
export const CONNECTION_STATE = {
	DISCONNECTED: 'disconnected',
	CONNECTING: 'connecting',
	CONNECTED: 'connected',
	ERROR: 'error',
} as const;

/**
 * Maximum lengths
 */
export const MAX_MESSAGE_LENGTH = 4000;
export const MAX_TOKENS_SUGGESTION = 2000;
export const MAX_USERNAME_LENGTH = 50;
export const MAX_CHAT_NAME_LENGTH = 100;

/**
 * Timeouts (in milliseconds)
 */
export const REQUEST_TIMEOUT = 30000;
export const DEBOUNCE_DELAY = 300;
export const TYPING_INDICATOR_TIMEOUT = 3000;
export const RECONNECT_DELAY = 1000;
export const MAX_RECONNECT_ATTEMPTS = 5;

/**
 * Storage keys
 */
export const STORAGE_KEYS = {
	TOKEN: 'token',
	USER: 'user',
	THEME: 'theme',
	SETTINGS: 'settings',
	PREFERENCES: 'preferences',
} as const;

/**
 * WebSocket message types
 */
export const WS_MESSAGE_TYPES = {
	MESSAGE: 'message',
	EDIT: 'edit',
	DELETE: 'delete',
	TYPING: 'typing',
	PRESENCE: 'presence',
	JOIN: 'join',
	LEAVE: 'leave',
	ERROR: 'error',
} as const;

/**
 * Default channel (general chat)
 */
export const DEFAULT_CHANNEL = '0000';

/**
 * RTC Configuration
 */
export const RTC_CONFIG = {
	ICE_SERVERS: [
		{ urls: 'stun:stun.l.google.com:19302' },
		{ urls: 'stun:stun1.l.google.com:19302' },
	],
	ICE_TRANSPORT_POLICY: 'all' as RTCIceTransportPolicy,
	BUNDLE_POLICY: 'balanced' as RTCBundlePolicy,
	RTCOfferOptions: {
		offerToReceiveAudio: true,
		offerToReceiveVideo: true,
	},
};

/**
 * UI Constants
 */
export const UI = {
	MODAL_TRANSITION_DURATION: 200,
	SIDEBAR_TRANSITION_DURATION: 750,
	MESSAGE_ANIMATION_DURATION: 1000,
	TOAST_DURATION: 5000,
	DEBOUNCE_MS: 300,
} as const;

/**
 * Pagination defaults
 */
export const PAGINATION = {
	DEFAULT_PAGE: 1,
	DEFAULT_LIMIT: 20,
	MAX_LIMIT: 100,
} as const;
