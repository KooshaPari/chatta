/**
 * LocalStorage utilities for chatta frontend
 */

/**
 * Get item from localStorage with type safety
 */
export function getItem<T>(key: string): T | null {
	if (typeof localStorage === 'undefined') {
		return null;
	}

	const item = localStorage.getItem(key);
	if (!item) {
		return null;
	}

	try {
		return JSON.parse(item) as T;
	} catch {
		// Return as string if not valid JSON
		return item as unknown as T;
	}
}

/**
 * Set item in localStorage
 */
export function setItem<T>(key: string, value: T): void {
	if (typeof localStorage === 'undefined') {
		return;
	}

	if (typeof value === 'string') {
		localStorage.setItem(key, value);
	} else {
		localStorage.setItem(key, JSON.stringify(value));
	}
}

/**
 * Remove item from localStorage
 */
export function removeItem(key: string): void {
	if (typeof localStorage !== 'undefined') {
		localStorage.removeItem(key);
	}
}

/**
 * Check if key exists in localStorage
 */
export function hasItem(key: string): boolean {
	if (typeof localStorage === 'undefined') {
		return false;
	}
	return localStorage.getItem(key) !== null;
}

/**
 * Clear all items from localStorage
 */
export function clear(): void {
	if (typeof localStorage !== 'undefined') {
		localStorage.clear();
	}
}

/**
 * Get all keys from localStorage
 */
export function getAllKeys(): string[] {
	if (typeof localStorage === 'undefined') {
		return [];
	}
	return Object.keys(localStorage);
}

/**
 * Session storage utilities (cleared on browser close)
 */

/**
 * Get item from sessionStorage
 */
export function sessionGet<T>(key: string): T | null {
	if (typeof sessionStorage === 'undefined') {
		return null;
	}

	const item = sessionStorage.getItem(key);
	if (!item) {
		return null;
	}

	try {
		return JSON.parse(item) as T;
	} catch {
		return item as unknown as T;
	}
}

/**
 * Set item in sessionStorage
 */
export function sessionSet<T>(key: string, value: T): void {
	if (typeof sessionStorage === 'undefined') {
		return;
	}

	if (typeof value === 'string') {
		sessionStorage.setItem(key, value);
	} else {
		sessionStorage.setItem(key, JSON.stringify(value));
	}
}

/**
 * Remove item from sessionStorage
 */
export function sessionRemove(key: string): void {
	if (typeof sessionStorage !== 'undefined') {
		sessionStorage.removeItem(key);
	}
}

/**
 * Clear sessionStorage
 */
export function sessionClear(): void {
	if (typeof sessionStorage !== 'undefined') {
		sessionStorage.clear();
	}
}
