import { useAuth } from '@/src/context/auth-context';
import { useMessageRoutes } from '@/src/hooks/use-message-routes';
import { apiGet } from '@/src/lib/api-client';
import { customerNeedsActivePlan } from '@/src/lib/user-access';
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

type UnreadMessagesContextValue = {
    unreadTotal: number;
    refreshUnread: () => Promise<void>;
    setUnreadTotal: (count: number) => void;
};

const UnreadMessagesContext = createContext<UnreadMessagesContextValue | null>(null);

export function UnreadMessagesProvider({ children }: { children: ReactNode }) {
    const { user } = useAuth();
    const messageRoutes = useMessageRoutes(user);
    const [unreadTotal, setUnreadTotal] = useState(0);

    const canFetch = Boolean(messageRoutes?.index) && !customerNeedsActivePlan(user);

    const refreshUnread = useCallback(async () => {
        if (!canFetch || !messageRoutes?.index) {
            setUnreadTotal(0);
            return;
        }

        const result = await apiGet<{ unread_total?: number }>(messageRoutes.index);
        if (result.ok && result.data) {
            setUnreadTotal(result.data.unread_total ?? 0);
        }
    }, [canFetch, messageRoutes?.index]);

    useEffect(() => {
        void refreshUnread();
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
        () => ({ unreadTotal, refreshUnread, setUnreadTotal }),
        [unreadTotal, refreshUnread],
    );

    return <UnreadMessagesContext.Provider value={value}>{children}</UnreadMessagesContext.Provider>;
}

export function useUnreadMessages(): UnreadMessagesContextValue {
    const ctx = useContext(UnreadMessagesContext);
    if (!ctx) {
        throw new Error('useUnreadMessages must be used within UnreadMessagesProvider');
    }
    return ctx;
}

/** Safe when provider may be absent (e.g. tests). */
export function useUnreadMessagesOptional(): UnreadMessagesContextValue | null {
    return useContext(UnreadMessagesContext);
}
