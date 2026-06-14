import Constants from 'expo-constants';

/**
 * Laravel API origin (no trailing slash).
 * Set EXPO_PUBLIC_API_URL in .env — see .env.example.
 */
export function apiBaseUrl(): string {
    const fromEnv = process.env.EXPO_PUBLIC_API_URL?.trim();
    if (fromEnv) {
        return fromEnv.replace(/\/$/, '');
    }

    const extra = Constants.expoConfig?.extra as { apiUrl?: string } | undefined;
    if (extra?.apiUrl) {
        return extra.apiUrl.replace(/\/$/, '');
    }

    return 'http://localhost:8000';
}

export function apiUrl(path: string): string {
    const base = apiBaseUrl();
    return path.startsWith('/') ? `${base}${path}` : `${base}/${path}`;
}
