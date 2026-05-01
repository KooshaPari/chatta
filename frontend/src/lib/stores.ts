/**
 * Svelte stores for chatta frontend
 */

import { writable, derived, type Writable, type Readable } from 'svelte/store';
import type { User, Message, Chat, Presence, ConnectionState } from './types';
import { getStoredUser, getToken } from './auth';

// ==================== User Store ====================

/**
 * Current user store
 */
function createUserStore() {
	const { subscribe, set, update }: Writable<User | null> = writable(getStoredUser());

	return {
		subscribe,
		set,
		update,
		setUser: (user: User | null) => set(user),
		clearUser: () => set(null),
		updateUser: (updates: Partial<User>) => {
			update((current) => (current ? { ...current, ...updates } : null));
		},
	};
}

export const user = createUserStore();

/**
 * Is user authenticated
 */
export const isAuthenticated: Readable<boolean> = derived(
	user,
	($user) => $user !== null && getToken() !== null
);

// ==================== Messages Store ====================

/**
 * Messages store with helper functions
 */
function createMessagesStore() {
	const { subscribe, set, update }: Writable<Message[]> = writable([]);

	return {
		subscribe,
		set,
		addMessage: (message: Message) => {
			update((messages) => {
				// Avoid duplicates
				if (messages.some((m) => m.uuid === message.uuid)) {
					return messages;
				}
				return [...messages, message];
			});
		},
		addMessages: (newMessages: Message[]) => {
			update((messages) => {
				const existingIds = new Set(messages.map((m) => m.uuid));
				const unique = newMessages.filter((m) => !existingIds.has(m.uuid));
				return [...messages, ...unique];
			});
		},
		updateMessage: (uuid: string, updates: Partial<Message>) => {
			update((messages) =>
				messages.map((m) => (m.uuid === uuid ? { ...m, ...updates } : m))
			);
		},
		deleteMessage: (uuid: string) => {
			update((messages) => messages.filter((m) => m.uuid !== uuid));
		},
		clearMessages: () => set([]),
	};
}

export const messages = createMessagesStore();

// ==================== Chats Store ====================

/**
 * Chats store
 */
function createChatsStore() {
	const { subscribe, set, update }: Writable<Chat[]> = writable([]);

	return {
		subscribe,
		set,
		addChat: (chat: Chat) => {
			update((chats) => {
				if (chats.some((c) => c.uuid === chat.uuid)) {
					return chats;
				}
				return [...chats, chat];
			});
		},
		updateChat: (uuid: string, updates: Partial<Chat>) => {
			update((chats) =>
				chats.map((c) => (c.uuid === uuid ? { ...c, ...updates } : c))
			);
		},
		deleteChat: (uuid: string) => {
			update((chats) => chats.filter((c) => c.uuid !== uuid));
		},
		clearChats: () => set([]),
	};
}

export const chats = createChatsStore();

// ==================== Active Chat Store ====================

/**
 * Currently active chat/channel
 */
export const activeChannel: Writable<string> = writable('0000');

/**
 * Current chat object
 */
export const currentChat: Writable<Chat | null> = writable(null);

// ==================== Presence Store ====================

/**
 * Presence store for tracking online users
 */
function createPresenceStore() {
	const { subscribe, set, update }: Writable<Map<string, Presence>> = writable(new Map());

	return {
		subscribe,
		setPresence: (presence: Presence) => {
			update((map) => {
				const newMap = new Map(map);
				newMap.set(presence.userId, presence);
				return newMap;
			});
		},
		removePresence: (userId: string) => {
			update((map) => {
				const newMap = new Map(map);
				newMap.delete(userId);
				return newMap;
			});
		},
		clearPresence: () => set(new Map()),
	};
}

export const presence = createPresenceStore();

/**
 * Online users derived from presence
 */
export const onlineUsers: Readable<User[]> = derived(
	presence,
	($presence) => Array.from($presence.values())
		.filter((p) => p.status === 'online')
		.map((p) => ({ uuid: p.userId, username: '' } as User))
);

// ==================== Connection Store ====================

/**
 * WebSocket connection state
 */
export const connectionState: Writable<ConnectionState> = writable('disconnected');

/**
 * Is connected
 */
export const isConnected: Readable<boolean> = derived(
	connectionState,
	($state) => $state === 'connected'
);

// ==================== UI State Stores ====================

/**
 * Sidebar visibility
 */
export const sidebarOpen: Writable<boolean> = writable(false);

/**
 * Modal states
 */
export const editModalOpen: Writable<boolean> = writable(false);
export const threadModalOpen: Writable<boolean> = writable(false);

/**
 * Selected message for editing/threading
 */
export const selectedMessage: Writable<Message | null> = writable(null);

/**
 * Video call state
 */
export const isInCall: Writable<boolean> = writable(false);

// ==================== Typing Store ====================

/**
 * Typing users store
 */
function createTypingStore() {
	const { subscribe, set, update }: Writable<Map<string, Set<string>>> = writable(new Map());

	return {
		subscribe,
		setTyping: (userId: string, channel: string, isTyping: boolean) => {
			update((map) => {
				const newMap = new Map(map);
				if (isTyping) {
					const channelUsers = newMap.get(channel) || new Set();
					channelUsers.add(userId);
					newMap.set(channel, channelUsers);
				} else {
					const channelUsers = newMap.get(channel);
					if (channelUsers) {
						channelUsers.delete(userId);
						if (channelUsers.size === 0) {
							newMap.delete(channel);
						}
					}
				}
				return newMap;
			});
		},
		clearChannel: (channel: string) => {
			update((map) => {
				const newMap = new Map(map);
				newMap.delete(channel);
				return newMap;
			});
		},
		clearAll: () => set(new Map()),
	};
}

export const typingUsers = createTypingStore();
