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

type AuthContextValue = {
    user: AuthUser | null;
    bootstrapping: boolean;
    signingIn: boolean;
    login: (identifier: string, password: string) => Promise<{ error: string | null; user: AuthUser | null }>;
    logout: () => Promise<void>;
    refreshUser: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<AuthUser | null>(null);
    const [bootstrapping, setBootstrapping] = useState(true);
    const [signingIn, setSigningIn] = useState(false);

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
            login,
            logout,
            refreshUser,
        }),
        [user, bootstrapping, signingIn, login, logout, refreshUser],
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
