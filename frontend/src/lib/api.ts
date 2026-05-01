/**
 * API client utilities for chatta frontend
 */

import type { ApiResponse, Chat, Message, User } from './types';
import { API_BASE_URL, REQUEST_TIMEOUT } from './constants';

/**
 * Custom error class for API errors
 */
export class ApiError extends Error {
	constructor(
		message: string,
		public statusCode: number,
		public response?: ApiResponse<unknown>
	) {
		super(message);
		this.name = 'ApiError';
	}
}

/**
 * Request options for API calls
 */
interface RequestOptions extends RequestInit {
	params?: Record<string, string | number | boolean>;
}

/**
 * Get auth token from storage
 */
function getAuthToken(): string | null {
	if (typeof localStorage !== 'undefined') {
		return localStorage.getItem('token');
	}
	return null;
}

/**
 * Build URL with query parameters
 */
function buildUrl(endpoint: string, params?: Record<string, string | number | boolean>): string {
	const url = new URL(endpoint, API_BASE_URL);
	if (params) {
		Object.entries(params).forEach(([key, value]) => {
			url.searchParams.append(key, String(value));
		});
	}
	return url.toString();
}

/**
 * Generic API request handler
 */
async function request<T>(
	endpoint: string,
	options: RequestOptions = {}
): Promise<ApiResponse<T>> {
	const token = getAuthToken();
	const url = buildUrl(endpoint, options.params);

	const headers: Record<string, string> = {
		'Content-Type': 'application/json',
		...(options.headers as Record<string, string> || {}),
	};

	if (token) {
		headers['Authorization'] = `Bearer ${token}`;
	}

	const controller = new AbortController();
	const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT);

	try {
		const response = await fetch(url, {
			...options,
			headers,
			signal: controller.signal,
		});

		clearTimeout(timeoutId);

		const data = await response.json();

		if (!response.ok) {
			throw new ApiError(data.error || 'Request failed', response.status, data);
		}

		return {
			success: true,
			data,
		};
	} catch (error) {
		clearTimeout(timeoutId);

		if (error instanceof ApiError) {
			throw error;
		}

		if (error instanceof Error) {
			if (error.name === 'AbortError') {
				throw new ApiError('Request timeout', 408);
			}
			throw new ApiError(error.message, 0);
		}

		throw new ApiError('Unknown error', 0);
	}
}

/**
 * GET request
 */
export async function get<T>(endpoint: string, params?: Record<string, string | number | boolean>): Promise<T> {
	const response = await request<T>(endpoint, { method: 'GET', params });
	return response.data as T;
}

/**
 * POST request
 */
export async function post<T>(endpoint: string, body: unknown): Promise<T> {
	const response = await request<T>(endpoint, {
		method: 'POST',
		body: JSON.stringify(body),
	});
	return response.data as T;
}

/**
 * PUT request
 */
export async function put<T>(endpoint: string, body: unknown): Promise<T> {
	const response = await request<T>(endpoint, {
		method: 'PUT',
		body: JSON.stringify(body),
	});
	return response.data as T;
}

/**
 * PATCH request
 */
export async function patch<T>(endpoint: string, body: unknown): Promise<T> {
	const response = await request<T>(endpoint, {
		method: 'PATCH',
		body: JSON.stringify(body),
	});
	return response.data as T;
}

/**
 * DELETE request
 */
export async function del<T>(endpoint: string): Promise<T> {
	const response = await request<T>(endpoint, { method: 'DELETE' });
	return response.data as T;
}

// ==================== API Specific Functions ====================

/**
 * Login user
 */
export async function login(username: string, password: string): Promise<{ token: string; user: User }> {
	return post('/backend/login', { username, password });
}

/**
 * Signup user
 */
export async function signup(username: string, password: string): Promise<{ token: string; user: User }> {
	return post('/backend/signup', { username, password });
}

/**
 * Get all messages
 */
export async function getMessages(): Promise<Message[]> {
	return get('/backend/messages');
}

/**
 * Get messages for a specific chat
 */
export async function getChatMessages(chatId: string): Promise<{ messages: Message[] }> {
	return get(`/backend/chats/${chatId}`);
}

/**
 * Get all chats
 */
export async function getChats(): Promise<Chat[]> {
	return get('/backend/chats');
}

/**
 * Create a direct message conversation
 */
export async function createDM(chat: Partial<Chat>): Promise<Chat> {
	return post('/backend/dm', chat);
}

/**
 * Create a thread
 */
export async function createThread(chat: Partial<Chat>): Promise<Chat> {
	return post('/backend/thread', chat);
}

/**
 * Delete a message (mark as deleted)
 */
export async function deleteMessage(message: Message): Promise<void> {
	await post('/backend/messages/delete', message);
}
