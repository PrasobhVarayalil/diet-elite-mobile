import { AppHeader } from '@/components/ui/AppHeader';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { colors, formatDateTime, spacing } from '@/constants/theme';
import { apiGet, apiPost } from '@/src/lib/api-client';
import { apiRoutes } from '@/src/lib/api-routes';
import { useCallback, useEffect, useState } from 'react';
import {
    ActivityIndicator,
    FlatList,
    Pressable,
    RefreshControl,
    StyleSheet,
    Text,
    View,
} from 'react-native';

type Notification = {
    id: string;
    title: string;
    body?: string | null;
    read_at?: string | null;
    created_at?: string | null;
};

export default function NotificationsScreen() {
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [items, setItems] = useState<Notification[]>([]);
    const [unread, setUnread] = useState(0);
    const [error, setError] = useState<string | null>(null);
    const [acting, setActing] = useState(false);

    const load = useCallback(async (isRefresh = false) => {
        if (isRefresh) {
            setRefreshing(true);
        } else {
            setLoading(true);
        }
        const result = await apiGet<{ notifications?: Notification[]; unread_count?: number }>(
            apiRoutes.notifications.index,
        );
        if (result.ok && result.data) {
            setItems(result.data.notifications ?? []);
            setUnread(result.data.unread_count ?? 0);
            setError(null);
        } else {
            setError(result.ok ? 'Could not load notifications.' : result.message);
        }
        setLoading(false);
        setRefreshing(false);
    }, []);

    useEffect(() => {
        load();
    }, [load]);

    async function markRead(id: string) {
        await apiPost(apiRoutes.notifications.read(id), {});
        load(true);
    }

    async function markAllRead() {
        setActing(true);
        await apiPost(apiRoutes.notifications.readAll, {});
        setActing(false);
        load(true);
    }

    async function clearAll() {
        setActing(true);
        await apiPost(apiRoutes.notifications.clearAll, {});
        setActing(false);
        load(true);
    }

    return (
        <View style={styles.root}>
            <AppHeader subtitle={unread > 0 ? `${unread} unread` : 'All caught up'} title="Notifications" />
            <View style={styles.toolbar}>
                <Button label="Mark all read" loading={acting} onPress={markAllRead} variant="secondary" />
                <Button label="Clear all" loading={acting} onPress={clearAll} variant="secondary" />
            </View>
            {loading ? (
                <ActivityIndicator color={colors.brandDark} style={{ marginTop: 40 }} />
            ) : (
                <FlatList
                    contentContainerStyle={styles.list}
                    data={items}
                    keyExtractor={(item) => item.id}
                    ListEmptyComponent={<Text style={styles.empty}>No notifications yet.</Text>}
                    ListHeaderComponent={error ? <Text style={styles.error}>{error}</Text> : null}
                    refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => load(true)} />}
                    renderItem={({ item }) => (
                        <Pressable
                            onPress={() => !item.read_at && markRead(item.id)}
                            style={[styles.row, !item.read_at && styles.unread]}
                        >
                            <View style={{ flex: 1, gap: 4 }}>
                                <Text style={styles.title}>{item.title}</Text>
                                {item.body ? <Text style={styles.body}>{item.body}</Text> : null}
                                <Text style={styles.time}>{formatDateTime(item.created_at)}</Text>
                            </View>
                            {!item.read_at ? <Badge label="New" tone="warning" /> : null}
                        </Pressable>
                    )}
                />
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    root: { flex: 1, backgroundColor: colors.background },
    toolbar: { flexDirection: 'row', gap: spacing.sm, paddingHorizontal: spacing.lg, paddingBottom: spacing.sm },
    list: { padding: spacing.lg, gap: spacing.sm },
    row: {
        backgroundColor: colors.card,
        borderRadius: 14,
        padding: spacing.md,
        borderWidth: 1,
        borderColor: colors.border,
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.sm,
        marginBottom: spacing.sm,
    },
    unread: { borderColor: colors.chart3, backgroundColor: colors.warningBg },
    title: { fontSize: 16, fontWeight: '700', color: colors.text },
    body: { fontSize: 14, color: colors.textMuted, lineHeight: 20 },
    time: { fontSize: 12, color: colors.textMuted },
    empty: { color: colors.textMuted, textAlign: 'center', marginTop: spacing.lg },
    error: { color: colors.error, marginBottom: spacing.sm },
});
