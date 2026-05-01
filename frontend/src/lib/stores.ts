// Store exports for chatta frontend
import { writable, type Writable } from 'svelte/store';

// User store type
export interface User {
    id?: string;
    name?: string;
    email?: string;
    avatar?: string;
}

// User writable store - export for use throughout the app
export const user: Writable<User | null> = writable(null);
