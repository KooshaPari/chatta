/**
 * WebSocket management utilities for chatta frontend
 */

import { writable, type Writable } from 'svelte/store';
import type { Message, WSMessage, WSMessageType, ConnectionState } from './types';

/**
 * WebSocket store state
 */
export interface WSState {
	connectionState: ConnectionState;
	lastError: string | null;
}

/**
 * WebSocket event handlers
 */
export interface WSEventHandlers {
	onMessage?: (message: Message) => void;
	onEdit?: (message: Message) => void;
	onDelete?: (messageId: string) => void;
	onTyping?: (userId: string, isTyping: boolean) => void;
	onPresence?: (userId: string, status: 'online' | 'away' | 'offline') => void;
	onError?: (error: Event) => void;
	onStateChange?: (state: ConnectionState) => void;
}

/**
 * Create a WebSocket connection manager
 */
export function createWebSocketManager() {
	let ws: WebSocket | null = null;
	let reconnectAttempts = 0;
	let reconnectTimeout: ReturnType<typeof setTimeout> | null = null;
	const maxReconnectAttempts = 5;
	const reconnectDelay = 1000;

	const state: Writable<WSState> = writable({
		connectionState: 'disconnected',
		lastError: null,
	});

	let handlers: WSEventHandlers = {};

	/**
	 * Get WebSocket URL with protocol
	 */
	function getWebSocketUrl(path: string, token: string): string {
		const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
		const host = window.location.host;
		return `${protocol}//${host}${path}?token=${token}`;
	}

	/**
	 * Update connection state
	 */
	function setConnectionState(connectionState: ConnectionState, error?: string) {
		state.update((s) => ({
			...s,
			connectionState,
			lastError: error || null,
		}));
		handlers.onStateChange?.(connectionState);
	}

	/**
	 * Process incoming WebSocket message
	 */
	function processMessage(event: MessageEvent) {
		try {
			const data = JSON.parse(event.data) as Message;

			// Determine message type based on flags
			if (data.deleted) {
				handlers.onDelete?.(data.uuid);
			} else if (data.edited) {
				handlers.onEdit?.(data);
			} else {
				handlers.onMessage?.(data);
			}
		} catch (err) {
			console.error('Failed to parse WebSocket message:', err);
		}
	}

	/**
	 * Connect to WebSocket server
	 */
	function connect(token: string, channel?: string): void {
		if (ws) {
			disconnect();
		}

		const path = channel ? `/backend/ws?channel=${channel}` : '/backend/ws';
		const url = getWebSocketUrl(path, token);

		setConnectionState('connecting');

		try {
			ws = new WebSocket(url);

			ws.onopen = () => {
				console.log('WebSocket connected');
				setConnectionState('connected');
				reconnectAttempts = 0;
			};

			ws.onmessage = processMessage;

			ws.onerror = (error) => {
				console.error('WebSocket error:', error);
				setConnectionState('error', 'Connection error');
				handlers.onError?.(error);
			};

			ws.onclose = () => {
				console.log('WebSocket disconnected');
				setConnectionState('disconnected');
				attemptReconnect(token);
			};
		} catch (err) {
			setConnectionState('error', String(err));
		}
	}

	/**
	 * Attempt to reconnect with exponential backoff
	 */
	function attemptReconnect(token: string): void {
		if (reconnectAttempts >= maxReconnectAttempts) {
			console.error('Max reconnection attempts reached');
			return;
		}

		if (reconnectTimeout) {
			clearTimeout(reconnectTimeout);
		}

		const delay = reconnectDelay * Math.pow(2, reconnectAttempts);
		reconnectAttempts++;

		console.log(`Attempting reconnect in ${delay}ms (attempt ${reconnectAttempts})`);

		reconnectTimeout = setTimeout(() => {
			connect(token);
		}, delay);
	}

	/**
	 * Disconnect from WebSocket server
	 */
	function disconnect(): void {
		if (reconnectTimeout) {
			clearTimeout(reconnectTimeout);
			reconnectTimeout = null;
		}

		if (ws) {
			ws.onclose = null;
			ws.onerror = null;
			ws.onmessage = null;
			ws.onopen = null;
			ws.close();
			ws = null;
		}

		setConnectionState('disconnected');
	}

	/**
	 * Send a message through WebSocket
	 */
	function send(data: unknown): boolean {
		if (ws && ws.readyState === WebSocket.OPEN) {
			ws.send(JSON.stringify(data));
			return true;
		}
		return false;
	}

	/**
	 * Send a chat message
	 */
	function sendMessage(message: Message): boolean {
		return send(message);
	}

	/**
	 * Send typing indicator
	 */
	function sendTyping(channel: string, isTyping: boolean): boolean {
		return send({
			type: 'typing' as WSMessageType,
			payload: { channel, isTyping },
			timestamp: new Date().toISOString(),
		});
	}

	/**
	 * Send a presence update
	 */
	function sendPresence(status: 'online' | 'away' | 'offline'): boolean {
		return send({
			type: 'presence' as WSMessageType,
			payload: { status },
			timestamp: new Date().toISOString(),
		});
	}

	/**
	 * Set event handlers
	 */
	function on(h: WSEventHandlers): void {
		handlers = h;
	}

	/**
	 * Clear event handlers
	 */
	function off(): void {
		handlers = {};
	}

	/**
	 * Check if WebSocket is connected
	 */
	function isConnected(): boolean {
		return ws !== null && ws.readyState === WebSocket.OPEN;
	}

	return {
		state: { subscribe: state.subscribe },
		connect,
		disconnect,
		send,
		sendMessage,
		sendTyping,
		sendPresence,
		on,
		off,
		isConnected,
	};
}

/**
 * Create a singleton WebSocket manager instance
 */
export const wsManager = createWebSocketManager();
