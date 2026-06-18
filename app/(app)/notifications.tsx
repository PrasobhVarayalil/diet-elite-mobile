import { AppHeader } from '@/components/ui/AppHeader';
import { Badge } from '@/components/ui/Badge';
import { BrandLoadingScreen } from '@/components/ui/BrandLoadingScreen';
import { Button } from '@/components/ui/Button';
import { colors, formatDateTime, spacing } from '@/constants/theme';
import { useAuth } from '@/src/context/auth-context';
import { useUnreadNotifications } from '@/src/context/unread-notifications-context';
import { apiGet, apiPost } from '@/src/lib/api-client';
import { apiRoutes } from '@/src/lib/api-routes';
import { mobileNotificationRoute, type AppNotification } from '@/src/lib/notification-routes';
import { useCallback, useEffect, useState } from 'react';
import {
    FlatList,
    Pressable,
    RefreshControl,
    StyleSheet,
    Text,
    View,
} from 'react-native';
import { useRouter } from 'expo-router';

export default function NotificationsScreen() {
    const router = useRouter();
    const { user } = useAuth();
    const { unreadCount, refreshUnread, setUnreadCount } = useUnreadNotifications();
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [items, setItems] = useState<AppNotification[]>([]);
    const [error, setError] = useState<string | null>(null);
    const [acting, setActing] = useState(false);

    const load = useCallback(async (isRefresh = false) => {
        if (isRefresh) {
            setRefreshing(true);
        } else {
            setLoading(true);
        }
        const result = await apiGet<{ notifications?: AppNotification[]; unread_count?: number }>(
            apiRoutes.notifications.index,
        );
        if (result.ok && result.data) {
            setItems(result.data.notifications ?? []);
            setUnreadCount(result.data.unread_count ?? 0);
            setError(null);
        } else {
            setError(result.ok ? 'Could not load notifications.' : result.message);
        }
        setLoading(false);
        setRefreshing(false);
    }, [setUnreadCount]);

    useEffect(() => {
        load();
    }, [load]);

    async function openNotification(item: AppNotification) {
        if (!item.read_at) {
            const result = await apiPost(apiRoutes.notifications.read(item.id), {});
            if (result.ok) {
                await refreshUnread();
            }
        }

        const route = mobileNotificationRoute(item, user);
        if (route) {
            router.push(route);
            return;
        }

        load(true);
    }

    async function markAllRead() {
        setActing(true);
        setUnreadCount(0);
        await apiPost(apiRoutes.notifications.readAll, {});
        setActing(false);
        await refreshUnread();
        load(true);
    }

    async function clearAll() {
        setActing(true);
        await apiPost(apiRoutes.notifications.clearAll, {});
        setActing(false);
        await refreshUnread();
        load(true);
    }

    return (
        <View style={styles.root}>
            <AppHeader
                showNotificationBell={false}
                subtitle={unreadCount > 0 ? `${unreadCount} unread` : 'All caught up'}
                title="Notifications"
            />
            <View style={styles.toolbar}>
                <Button label="Mark all read" loading={acting} onPress={() => void markAllRead()} variant="secondary" />
                <Button label="Clear all" loading={acting} onPress={() => void clearAll()} variant="secondary" />
            </View>
            {loading ? (
                <BrandLoadingScreen message="Loading notifications…" />
            ) : (
                <FlatList
                    contentContainerStyle={styles.list}
                    data={items}
                    keyExtractor={(item) => item.id}
                    ListEmptyComponent={<Text style={styles.empty}>No notifications yet.</Text>}
                    ListHeaderComponent={error ? <Text style={styles.error}>{error}</Text> : null}
                    refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => load(true)} />}
                    renderItem={({ item }) => (
                        <Pressable onPress={() => void openNotification(item)} style={styles.card}>
                            <View style={styles.cardHead}>
                                <Text style={[styles.title, !item.read_at && styles.titleUnread]}>{item.title}</Text>
                                {!item.read_at ? <Badge label="New" tone="warning" /> : null}
                            </View>
                            {item.body ? <Text style={styles.body}>{item.body}</Text> : null}
                            {item.created_at ? (
                                <Text style={styles.meta}>{formatDateTime(item.created_at)}</Text>
                            ) : null}
                        </Pressable>
                    )}
                />
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    root: { flex: 1, backgroundColor: colors.background },
    toolbar: {
        flexDirection: 'row',
        gap: spacing.sm,
        paddingHorizontal: spacing.lg,
        paddingBottom: spacing.sm,
    },
    list: { padding: spacing.lg, gap: spacing.sm, paddingBottom: spacing.xl },
    card: {
        backgroundColor: colors.card,
        borderRadius: 12,
        padding: spacing.md,
        borderWidth: 1,
        borderColor: colors.border,
        gap: 4,
        marginBottom: spacing.sm,
    },
    cardHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.sm },
    title: { fontSize: 15, fontWeight: '600', color: colors.text, flex: 1 },
    titleUnread: { fontWeight: '800' },
    body: { fontSize: 14, color: colors.textMuted, lineHeight: 20 },
    meta: { fontSize: 12, color: colors.textMuted },
    empty: { textAlign: 'center', color: colors.textMuted, marginTop: spacing.xl },
    error: { color: colors.error, marginBottom: spacing.sm },
});
