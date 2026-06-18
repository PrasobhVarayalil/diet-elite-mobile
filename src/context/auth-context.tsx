import { apiGet, apiPost, setAuthToken } from '@/src/lib/api-client';
import { apiRoutes } from '@/src/lib/api-routes';
import { clearStoredToken, getStoredToken, setStoredToken } from '@/src/lib/auth-storage';
import type { AuthUser, LoginResponse, MeResponse } from '@/src/types/auth';
import {
    createContext,
    useCallback,
    useContext,
    useEffect,
    useMemo,
    useState,
    type ReactNode,
} from 'react';

export type RegisterPayload = {
    name: string;
    email: string;
    username: string;
    phone?: string;
    password: string;
    password_confirmation: string;
};

type AuthContextValue = {
    user: AuthUser | null;
    bootstrapping: boolean;
    signingIn: boolean;
    registrationEnabled: boolean;
    configLoaded: boolean;
    login: (identifier: string, password: string) => Promise<{ error: string | null; user: AuthUser | null }>;
    register: (
        payload: RegisterPayload,
    ) => Promise<{ error: string | null; user: AuthUser | null; fieldErrors?: Record<string, string> }>;
    logout: () => Promise<void>;
    refreshUser: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<AuthUser | null>(null);
    const [bootstrapping, setBootstrapping] = useState(true);
    const [signingIn, setSigningIn] = useState(false);
    const [registrationEnabled, setRegistrationEnabled] = useState(false);
    const [configLoaded, setConfigLoaded] = useState(false);

    useEffect(() => {
        let cancelled = false;

        (async () => {
            const result = await apiGet<{ registration_enabled?: boolean }>(apiRoutes.config);
            if (!cancelled) {
                setRegistrationEnabled(result.ok ? Boolean(result.data?.registration_enabled) : false);
                setConfigLoaded(true);
            }
        })();

        return () => {
            cancelled = true;
        };
    }, []);

    const refreshUser = useCallback(async () => {
        const result = await apiGet<MeResponse>(apiRoutes.auth.me);
        if (result.ok && result.data?.user) {
            setUser(result.data.user);
            return;
        }

        setUser(null);
        setAuthToken(null);
        await clearStoredToken();
    }, []);

    useEffect(() => {
        let cancelled = false;

        (async () => {
            const token = await getStoredToken();
            if (!token) {
                if (!cancelled) {
                    setBootstrapping(false);
                }
                return;
            }

            setAuthToken(token);
            const result = await apiGet<MeResponse>(apiRoutes.auth.me);
            if (cancelled) {
                return;
            }

            if (result.ok && result.data?.user) {
                setUser(result.data.user);
            } else {
                setAuthToken(null);
                await clearStoredToken();
            }

            setBootstrapping(false);
        })();

        return () => {
            cancelled = true;
        };
    }, []);

    const login = useCallback(async (identifier: string, password: string) => {
        setSigningIn(true);
        try {
            const result = await apiPost<LoginResponse>(apiRoutes.auth.login, {
                identifier: identifier.trim(),
                password,
                create_token: true,
            });

            if (!result.ok) {
                return { error: result.message, user: null };
            }

            const token = result.data?.token;
            const nextUser = result.data?.user;

            if (!token || !nextUser) {
                return { error: 'Login succeeded but no token was returned.', user: null };
            }

            setAuthToken(token);
            await setStoredToken(token);
            setUser(nextUser);

            return { error: null, user: nextUser };
        } finally {
            setSigningIn(false);
        }
    }, []);

    const register = useCallback(async (payload: RegisterPayload) => {
        setSigningIn(true);
        try {
            const result = await apiPost<LoginResponse>(apiRoutes.auth.register, payload);

            if (!result.ok) {
                const fieldErrors: Record<string, string> = {};
                if (result.errors) {
                    for (const [field, messages] of Object.entries(result.errors)) {
                        fieldErrors[field] = messages[0] ?? 'Invalid value.';
                    }
                }

                return {
                    error: result.message,
                    user: null,
                    fieldErrors: Object.keys(fieldErrors).length > 0 ? fieldErrors : undefined,
                };
            }

            const token = result.data?.token;
            const nextUser = result.data?.user;

            if (!token || !nextUser) {
                return { error: 'Registration succeeded but no token was returned.', user: null };
            }

            setAuthToken(token);
            await setStoredToken(token);
            setUser(nextUser);

            return { error: null, user: nextUser };
        } finally {
            setSigningIn(false);
        }
    }, []);

    const logout = useCallback(async () => {
        await apiPost(apiRoutes.auth.logout, {});
        setUser(null);
        setAuthToken(null);
        await clearStoredToken();
    }, []);

    const value = useMemo(
        () => ({
            user,
            bootstrapping,
            signingIn,
            registrationEnabled,
            configLoaded,
            login,
            register,
            logout,
            refreshUser,
        }),
        [user, bootstrapping, signingIn, registrationEnabled, configLoaded, login, register, logout, refreshUser],
    );

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
    const ctx = useContext(AuthContext);
    if (!ctx) {
        throw new Error('useAuth must be used within AuthProvider');
    }

    return ctx;
}
