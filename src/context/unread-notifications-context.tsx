import { apiGet } from '@/src/lib/api-client';
import { apiRoutes } from '@/src/lib/api-routes';
import {
    createContext,
    useCallback,
    useContext,
    useEffect,
    useMemo,
    useState,
    type ReactNode,
} from 'react';
import { AppState, type AppStateStatus } from 'react-native';

type UnreadNotificationsContextValue = {
    unreadCount: number;
    refreshUnread: () => Promise<void>;
    setUnreadCount: (count: number) => void;
};

const UnreadNotificationsContext = createContext<UnreadNotificationsContextValue | null>(null);

const POLL_MS = 60_000;

export function UnreadNotificationsProvider({ children }: { children: ReactNode }) {
    const [unreadCount, setUnreadCount] = useState(0);

    const refreshUnread = useCallback(async () => {
        const result = await apiGet<{ unread_count?: number }>(apiRoutes.notifications.index);
        if (result.ok && result.data) {
            setUnreadCount(result.data.unread_count ?? 0);
        }
    }, []);

    useEffect(() => {
        void refreshUnread();
        const interval = setInterval(() => {
            void refreshUnread();
        }, POLL_MS);

        return () => clearInterval(interval);
    }, [refreshUnread]);

    useEffect(() => {
        function onAppState(next: AppStateStatus) {
            if (next === 'active') {
                void refreshUnread();
            }
        }

        const sub = AppState.addEventListener('change', onAppState);
        return () => sub.remove();
    }, [refreshUnread]);

    const value = useMemo(
        () => ({ unreadCount, refreshUnread, setUnreadCount }),
        [unreadCount, refreshUnread],
    );

    return (
        <UnreadNotificationsContext.Provider value={value}>{children}</UnreadNotificationsContext.Provider>
    );
}

export function useUnreadNotifications(): UnreadNotificationsContextValue {
    const ctx = useContext(UnreadNotificationsContext);
    if (!ctx) {
        throw new Error('useUnreadNotifications must be used within UnreadNotificationsProvider');
    }
    return ctx;
}

export function useUnreadNotificationsOptional(): UnreadNotificationsContextValue | null {
    return useContext(UnreadNotificationsContext);
}
