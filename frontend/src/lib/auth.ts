/**
 * Authentication utilities for chatta frontend
 */

import type { User } from './types';
import { login as apiLogin, signup as apiSignup } from './api';

/**
 * Storage keys for auth data
 */
export const AUTH_STORAGE_KEYS = {
	TOKEN: 'token',
	USER: 'user',
} as const;

/**
 * Login user with credentials
 */
export async function login(username: string, password: string): Promise<{ token: string; user: User }> {
	const response = await apiLogin(username, password);
	storeAuthData(response.token, response.user);
	return response;
}

/**
 * Signup new user
 */
export async function signup(username: string, password: string): Promise<{ token: string; user: User }> {
	const response = await apiSignup(username, password);
	storeAuthData(response.token, response.user);
	return response;
}

/**
 * Sign out current user
 */
export function signOut(): void {
	clearAuthData();
}

/**
 * Store authentication data in localStorage
 */
export function storeAuthData(token: string, user: User): void {
	if (typeof localStorage !== 'undefined') {
		localStorage.setItem(AUTH_STORAGE_KEYS.TOKEN, token);
		localStorage.setItem(AUTH_STORAGE_KEYS.USER, JSON.stringify(user));
	}
}

/**
 * Clear authentication data from localStorage
 */
export function clearAuthData(): void {
	if (typeof localStorage !== 'undefined') {
		localStorage.removeItem(AUTH_STORAGE_KEYS.TOKEN);
		localStorage.removeItem(AUTH_STORAGE_KEYS.USER);
	}
}

/**
 * Get stored token
 */
export function getToken(): string | null {
	if (typeof localStorage !== 'undefined') {
		return localStorage.getItem(AUTH_STORAGE_KEYS.TOKEN);
	}
	return null;
}

/**
 * Get stored user
 */
export function getStoredUser(): User | null {
	if (typeof localStorage !== 'undefined') {
		const userStr = localStorage.getItem(AUTH_STORAGE_KEYS.USER);
		if (userStr) {
			try {
				return JSON.parse(userStr) as User;
			} catch {
				return null;
			}
		}
	}
	return null;
}

/**
 * Check if user is authenticated
 */
export function isAuthenticated(): boolean {
	return getToken() !== null;
}

/**
 * Validate token format (basic check)
 */
export function isValidToken(token: string | null): boolean {
	if (!token) return false;
	// JWT tokens have 3 parts separated by dots
	return token.split('.').length === 3;
}

/**
 * Auth guard - redirect to login if not authenticated
 */
export function requireAuth(): User | null {
	const token = getToken();
	const user = getStoredUser();

	if (!token || !isValidToken(token) || !user) {
		return null;
	}

	return user;
}
