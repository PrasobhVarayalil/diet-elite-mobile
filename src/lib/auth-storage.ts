import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

const TOKEN_KEY = 'diet_elite_auth_token';

function webStorage(): Storage | null {
    if (typeof globalThis !== 'undefined' && 'localStorage' in globalThis) {
        return globalThis.localStorage;
    }

    return null;
}

async function secureStoreAvailable(): Promise<boolean> {
    if (Platform.OS === 'web') {
        return false;
    }

    try {
        return await SecureStore.isAvailableAsync();
    } catch {
        return false;
    }
}

export async function getStoredToken(): Promise<string | null> {
    const web = webStorage();
    if (web) {
        return web.getItem(TOKEN_KEY);
    }

    try {
        if (!(await secureStoreAvailable())) {
            return null;
        }

        return await SecureStore.getItemAsync(TOKEN_KEY);
    } catch {
        return null;
    }
}

export async function setStoredToken(token: string): Promise<void> {
    const web = webStorage();
    if (web) {
        web.setItem(TOKEN_KEY, token);
        return;
    }

    if (!(await secureStoreAvailable())) {
        throw new Error('Secure storage is not available on this device.');
    }

    await SecureStore.setItemAsync(TOKEN_KEY, token);
}

export async function clearStoredToken(): Promise<void> {
    const web = webStorage();
    if (web) {
        web.removeItem(TOKEN_KEY);
        return;
    }

    try {
        if (await secureStoreAvailable()) {
            await SecureStore.deleteItemAsync(TOKEN_KEY);
        }
    } catch {
        // Ignore — token already cleared in memory.
    }
}
