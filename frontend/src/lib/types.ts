/**
 * Shared TypeScript interfaces for chatta frontend
 */

/**
 * User entity - represents a chat participant
 */
export interface User {
	uuid: string;
	username: string;
	email?: string;
	avatar?: string;
	createdAt?: Date | string;
}

/**
 * Chat message - core message structure for chat functionality
 */
export interface Message {
	uuid: string;
	content: string;
	channel: string;
	sentAt: Date | string;
	edited: boolean;
	deleted: boolean;
	senderId: string;
	sender: User;
}

/**
 * Chat conversation - represents a chat room or direct message
 */
export interface Chat {
	uuid: string;
	name: string;
	type: ChatType;
	messages: Message[];
	participants: User[];
	createdAt?: Date | string;
	updatedAt?: Date | string;
}

/**
 * Chat types
 */
export type ChatType = 'thread' | 'dm' | 'gc';

/**
 * Presence indicator
 */
export interface Presence {
	userId: string;
	status: PresenceStatus;
	lastSeen?: Date | string;
}

/**
 * Presence status options
 */
export type PresenceStatus = 'online' | 'away' | 'offline';

/**
 * Typing indicator
 */
export interface TypingIndicator {
	userId: string;
	isTyping: boolean;
	channel?: string;
}

/**
 * API response wrapper
 */
export interface ApiResponse<T> {
	data?: T;
	error?: string;
	success: boolean;
	message?: string;
}

/**
 * Auth response from login/signup
 */
export interface AuthResponse {
	token: string;
	user: User;
}

/**
 * WebSocket connection state
 */
export type ConnectionState = 'connecting' | 'connected' | 'disconnected' | 'error';

/**
 * WebSocket message envelope
 */
export interface WSMessage<T = unknown> {
	type: WSMessageType;
	payload: T;
	timestamp?: Date | string;
}

/**
 * WebSocket message types
 */
export type WSMessageType =
	| 'message'
	| 'edit'
	| 'delete'
	| 'typing'
	| 'presence'
	| 'join'
	| 'leave'
	| 'error';

/**
 * Chat session - for session management
 */
export interface ChatSession {
	id: string;
	userId: string;
	channel: string;
	isActive: boolean;
}

/**
 * Thread creation request
 */
export interface ThreadCreateRequest {
	parentMessage: Message;
	name?: string;
}

/**
 * Direct message creation request
 */
export interface DMCreateRequest {
	recipient: User;
	initialMessage?: string;
}

/**
 * Video call configuration
 */
export interface RTCConfiguration {
	iceServers: RTCIceServer[];
}

/**
 * Default RTC configuration
 */
export const DEFAULT_RTC_CONFIG: RTCConfiguration = {
	iceServers: [{ urls: 'stun:stun.l.google.com:19302' }],
};

/**
 * Pagination options for API requests
 */
export interface PaginationOptions {
	page?: number;
	limit?: number;
	sortBy?: string;
	sortOrder?: 'asc' | 'desc';
}

/**
 * Paginated response
 */
export interface PaginatedResponse<T> {
	items: T[];
	total: number;
	page: number;
	limit: number;
	hasMore: boolean;
}
