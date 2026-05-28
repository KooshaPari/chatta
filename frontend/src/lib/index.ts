/**
 * Barrel export for chatta frontend lib
 * Re-export all public modules
 */

// Types
export type {
	User,
	Message,
	Chat,
	ChatType,
	Presence,
	PresenceStatus,
	TypingIndicator,
	ApiResponse,
	AuthResponse,
	WSMessage,
	WSMessageType,
	ChatSession,
	ThreadCreateRequest,
	DMCreateRequest,
	RTCConfiguration,
	PaginationOptions,
	PaginatedResponse,
	ConnectionState,
} from './types';

export { DEFAULT_RTC_CONFIG } from './types';

// Stores
export {
	user,
	isAuthenticated,
	messages,
	chats,
	activeChannel,
	currentChat,
	presence,
	onlineUsers,
	connectionState,
	isConnected,
	sidebarOpen,
	editModalOpen,
	threadModalOpen,
	selectedMessage,
	isInCall,
	typingUsers,
} from './stores';

// Utils
export {
	formatDate,
	formatRelativeTime,
	formatTime,
	formatDateTime,
	truncate,
	truncateMiddle,
	isValidEmail,
	isValidUsername,
	generateId,
	generateShortId,
	debounce,
	throttle,
	deepClone,
	arraysEqual,
	getInitials,
	capitalize,
	toKebabCase,
	toCamelCase,
	sleep,
	safeJsonParse,
	isEmpty,
	groupBy,
	uniqueBy,
	sortBy,
	getWebSocketUrl,
	buildUrl,
	validatePassword,
	escapeHtml,
	stripHtml,
	copyToClipboard,
} from './utils';

// Constants
export {
	APP_NAME,
	APP_VERSION,
	APP_DESCRIPTION,
	API_BASE_URL,
	API_TIMEOUT,
	API_ENDPOINTS,
	MESSAGE_TYPES,
	CHAT_TYPES,
	CHAT_STATUS,
	PRESENCE_STATUS,
	CONNECTION_STATE,
	MAX_MESSAGE_LENGTH,
	MAX_TOKENS_SUGGESTION,
	MAX_USERNAME_LENGTH,
	MAX_CHAT_NAME_LENGTH,
	REQUEST_TIMEOUT,
	DEBOUNCE_DELAY,
	TYPING_INDICATOR_TIMEOUT,
	RECONNECT_DELAY,
	MAX_RECONNECT_ATTEMPTS,
	STORAGE_KEYS,
	WS_MESSAGE_TYPES,
	DEFAULT_CHANNEL,
	RTC_CONFIG,
	UI,
	PAGINATION,
} from './constants';

// Auth utilities
export {
	login,
	signup,
	signOut,
	storeAuthData,
	clearAuthData,
	getToken,
	getStoredUser,
	isAuthenticated as checkAuth,
	isValidToken,
	requireAuth,
	AUTH_STORAGE_KEYS,
} from './auth';

// API utilities
export {
	ApiError,
	get,
	post,
	put,
	patch,
	del,
	login as apiLogin,
	signup as apiSignup,
	getMessages,
	getChatMessages,
	getChats,
	createDM,
	createThread,
	deleteMessage,
} from './api';

// WebSocket utilities
export {
	createWebSocketManager,
	wsManager,
	type WSState,
	type WSEventHandlers,
} from './websocket';

// Storage utilities
export {
	getItem,
	setItem,
	removeItem,
	hasItem,
	clear,
	getAllKeys,
	sessionGet,
	sessionSet,
	sessionRemove,
	sessionClear,
} from './storage';
