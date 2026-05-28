/**
 * Shared utilities for chatta frontend
 */

/**
 * Format a date for display
 */
export function formatDate(date: Date | string): string {
	const d = typeof date === 'string' ? new Date(date) : date;
	return d.toLocaleDateString('en-US', {
		year: 'numeric',
		month: 'short',
		day: 'numeric',
	});
}

/**
 * Format a relative time (e.g., "2 hours ago")
 */
export function formatRelativeTime(date: Date | string): string {
	const d = typeof date === 'string' ? new Date(date) : date;
	const now = new Date();
	const diffMs = now.getTime() - d.getTime();
	const diffSec = Math.floor(diffMs / 1000);
	const diffMin = Math.floor(diffSec / 60);
	const diffHour = Math.floor(diffMin / 60);
	const diffDay = Math.floor(diffHour / 24);

	if (diffSec < 60) return 'just now';
	if (diffMin < 60) return `${diffMin} minute${diffMin === 1 ? '' : 's'} ago`;
	if (diffHour < 24) return `${diffHour} hour${diffHour === 1 ? '' : 's'} ago`;
	if (diffDay < 7) return `${diffDay} day${diffDay === 1 ? '' : 's'} ago`;
	return formatDate(d);
}

/**
 * Format time for message timestamps
 */
export function formatTime(date: Date | string): string {
	const d = typeof date === 'string' ? new Date(date) : date;
	return d.toLocaleTimeString('en-US', {
		hour: '2-digit',
		minute: '2-digit',
	});
}

/**
 * Format date and time for messages
 */
export function formatDateTime(date: Date | string): string {
	const d = typeof date === 'string' ? new Date(date) : date;
	return `${formatDate(d)} ${formatTime(d)}`;
}

/**
 * Truncate text with ellipsis
 */
export function truncate(text: string, maxLength: number): string {
	if (text.length <= maxLength) return text;
	return text.slice(0, maxLength - 3) + '...';
}

/**
 * Truncate text in the middle
 */
export function truncateMiddle(text: string, maxLength: number): string {
	if (text.length <= maxLength) return text;
	const half = Math.floor((maxLength - 3) / 2);
	return text.slice(0, half) + '...' + text.slice(-half);
}

/**
 * Validate email format
 */
export function isValidEmail(email: string): boolean {
	const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
	return emailRegex.test(email);
}

/**
 * Validate username format
 */
export function isValidUsername(username: string): boolean {
	// Alphanumeric, underscore, 3-20 chars
	const usernameRegex = /^[a-zA-Z0-9_]{3,20}$/;
	return usernameRegex.test(username);
}

/**
 * Generate a random ID
 */
export function generateId(): string {
	return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
}

/**
 * Generate a short ID
 */
export function generateShortId(): string {
	return Math.random().toString(36).substring(2, 10);
}

/**
 * Debounce function
 */
export function debounce<T extends (...args: unknown[]) => unknown>(
	fn: T,
	delay: number
): (...args: Parameters<T>) => void {
	let timeoutId: ReturnType<typeof setTimeout>;
	return (...args: Parameters<T>) => {
		clearTimeout(timeoutId);
		timeoutId = setTimeout(() => fn(...args), delay);
	};
}

/**
 * Throttle function
 */
export function throttle<T extends (...args: unknown[]) => unknown>(
	fn: T,
	delay: number
): (...args: Parameters<T>) => void {
	let lastCall = 0;
	return (...args: Parameters<T>) => {
		const now = Date.now();
		if (now - lastCall >= delay) {
			lastCall = now;
			fn(...args);
		}
	};
}

/**
 * Deep clone an object
 */
export function deepClone<T>(obj: T): T {
	return JSON.parse(JSON.stringify(obj));
}

/**
 * Check if two arrays are equal
 */
export function arraysEqual<T>(a: T[], b: T[]): boolean {
	if (a.length !== b.length) return false;
	return a.every((val, index) => val === b[index]);
}

/**
 * Get initials from a name
 */
export function getInitials(name: string): string {
	return name
		.split(' ')
		.map((n) => n[0])
		.join('')
		.toUpperCase()
		.slice(0, 2);
}

/**
 * Capitalize first letter
 */
export function capitalize(str: string): string {
	return str.charAt(0).toUpperCase() + str.slice(1);
}

/**
 * Convert string to kebab-case
 */
export function toKebabCase(str: string): string {
	return str
		.replace(/([a-z])([A-Z])/g, '$1-$2')
		.replace(/[\s_]+/g, '-')
		.toLowerCase();
}

/**
 * Convert string to camelCase
 */
export function toCamelCase(str: string): string {
	return str
		.replace(/[-_\s]+(.)?/g, (_, c) => (c ? c.toUpperCase() : ''))
		.replace(/^(.)/, (_, c) => c.toLowerCase());
}

/**
 * Sleep/delay utility
 */
export function sleep(ms: number): Promise<void> {
	return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Parse JSON safely
 */
export function safeJsonParse<T>(str: string, fallback: T): T {
	try {
		return JSON.parse(str) as T;
	} catch {
		return fallback;
	}
}

/**
 * Check if value is empty
 */
export function isEmpty(value: unknown): boolean {
	if (value == null) return true;
	if (typeof value === 'string') return value.trim() === '';
	if (Array.isArray(value)) return value.length === 0;
	if (typeof value === 'object') return Object.keys(value).length === 0;
	return false;
}

/**
 * Group array by key
 */
export function groupBy<T, K extends keyof T>(array: T[], key: K): Map<T[K], T[]> {
	return array.reduce((map, item) => {
		const group = item[key];
		const existing = map.get(group) || [];
		return map.set(group, [...existing, item]);
	}, new Map<T[K], T[]>());
}

/**
 * Unique array by key
 */
export function uniqueBy<T, K extends keyof T>(array: T[], key: K): T[] {
	const seen = new Set();
	return array.filter((item) => {
		const value = item[key];
		if (seen.has(value)) return false;
		seen.add(value);
		return true;
	});
}

/**
 * Sort array by key
 */
export function sortBy<T, K extends keyof T>(
	array: T[],
	key: K,
	order: 'asc' | 'desc' = 'asc'
): T[] {
	return [...array].sort((a, b) => {
		const aVal = a[key];
		const bVal = b[key];
		if (aVal < bVal) return order === 'asc' ? -1 : 1;
		if (aVal > bVal) return order === 'asc' ? 1 : -1;
		return 0;
	});
}

// ==================== URL/Route Helpers ====================

/**
 * Get WebSocket URL
 */
export function getWebSocketUrl(path: string = '/backend/ws', token?: string): string {
	const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
	const host = window.location.host;
	const url = `${protocol}//${host}${path}`;
	if (token) {
		const separator = path.includes('?') ? '&' : '?';
		return `${url}${separator}token=${token}`;
	}
	return url;
}

/**
 * Navigate to URL with optional query params
 */
export function buildUrl(path: string, params?: Record<string, string | number | boolean>): string {
	const url = new URL(path, window.location.origin);
	if (params) {
		Object.entries(params).forEach(([key, value]) => {
			url.searchParams.append(key, String(value));
		});
	}
	return url.toString();
}

// ==================== Validation Helpers ====================

/**
 * Validate password strength
 */
export function validatePassword(password: string): { valid: boolean; errors: string[] } {
	const errors: string[] = [];

	if (password.length < 8) {
		errors.push('Password must be at least 8 characters');
	}
	if (!/[A-Z]/.test(password)) {
		errors.push('Password must contain at least one uppercase letter');
	}
	if (!/[a-z]/.test(password)) {
		errors.push('Password must contain at least one lowercase letter');
	}
	if (!/[0-9]/.test(password)) {
		errors.push('Password must contain at least one number');
	}

	return {
		valid: errors.length === 0,
		errors,
	};
}

/**
 * Escape HTML to prevent XSS
 */
export function escapeHtml(text: string): string {
	const map: Record<string, string> = {
		'&': '&amp;',
		'<': '&lt;',
		'>': '&gt;',
		'"': '&quot;',
		"'": '&#039;',
	};
	return text.replace(/[&<>"']/g, (m) => map[m]);
}

/**
 * Strip HTML tags
 */
export function stripHtml(html: string): string {
	return html.replace(/<[^>]*>/g, '');
}

/**
 * Copy text to clipboard
 */
export async function copyToClipboard(text: string): Promise<boolean> {
	try {
		await navigator.clipboard.writeText(text);
		return true;
	} catch {
		// Fallback for older browsers
		const textarea = document.createElement('textarea');
		textarea.value = text;
		textarea.style.position = 'fixed';
		textarea.style.opacity = '0';
		document.body.appendChild(textarea);
		textarea.select();
		try {
			document.execCommand('copy');
			return true;
		} catch {
			return false;
		} finally {
			document.body.removeChild(textarea);
		}
	}
}
