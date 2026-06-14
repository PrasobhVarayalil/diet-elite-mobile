import { Button } from '@/components/ui/Button';
import { colors, spacing } from '@/constants/theme';
import { apiGet, apiPost } from '@/src/lib/api-client';
import { apiRoutes } from '@/src/lib/api-routes';
import type { BookingListItem, BookingsIndexResponse } from '@/src/types/bookings';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    FlatList,
    Pressable,
    RefreshControl,
    StyleSheet,
    Text,
    View,
} from 'react-native';

function formatWhen(iso: string): string {
    try {
        return new Date(iso).toLocaleString(undefined, {
            dateStyle: 'medium',
            timeStyle: 'short',
        });
    } catch {
        return iso;
    }
}

function BookingRow({
    item,
    onCancel,
}: {
    item: BookingListItem;
    onCancel: (item: BookingListItem) => void;
}) {
    return (
        <View style={styles.card}>
            <Text style={styles.when}>{formatWhen(item.scheduled_at)}</Text>
            <Text style={styles.dietitian}>{item.dietitian?.name ?? 'Dietitian'}</Text>
            {item.dietitian?.title ? <Text style={styles.meta}>{item.dietitian.title}</Text> : null}
            <Text style={styles.status}>{item.status.replace(/_/g, ' ')}</Text>
            {item.can_cancel ? (
                <Pressable onPress={() => onCancel(item)} style={styles.cancelLink}>
                    <Text style={styles.cancelText}>Cancel booking</Text>
                </Pressable>
            ) : null}
        </View>
    );
}

export default function BookingsScreen() {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [bookings, setBookings] = useState<BookingListItem[]>([]);

    const load = useCallback(async (isRefresh = false) => {
        if (isRefresh) {
            setRefreshing(true);
        } else {
            setLoading(true);
        }

        const result = await apiGet<BookingsIndexResponse>(apiRoutes.bookings.index);

        if (result.ok && result.data) {
            setBookings(result.data.bookings?.data ?? []);
            setError(null);
        } else {
            setError(result.ok ? 'Could not load bookings.' : result.message);
        }

        setLoading(false);
        setRefreshing(false);
    }, []);

    useEffect(() => {
        load();
    }, [load]);

    function onCancel(item: BookingListItem) {
        Alert.alert('Cancel booking', 'Cancel this consultation?', [
            { text: 'Keep', style: 'cancel' },
            {
                text: 'Cancel booking',
                style: 'destructive',
                onPress: async () => {
                    const result = await apiPost(apiRoutes.bookings.cancel(item.id), {
                        reason: 'Cancelled from mobile app',
                    });
                    if (result.ok) {
                        load(true);
                    } else {
                        Alert.alert('Error', result.message);
                    }
                },
            },
        ]);
    }

    if (loading) {
        return (
            <View style={styles.center}>
                <ActivityIndicator size="large" color={colors.brandDark} />
            </View>
        );
    }

    return (
        <View style={styles.wrap}>
            <View style={styles.toolbar}>
                <Button label="Book consultation" onPress={() => router.push('/(app)/bookings/create')} />
            </View>
            <FlatList
                contentContainerStyle={styles.list}
                data={bookings}
                keyExtractor={(item) => item.id}
                ListEmptyComponent={
                    <View style={styles.empty}>
                        <Text style={styles.emptyTitle}>No bookings yet</Text>
                        <Text style={styles.emptyBody}>
                            Book a consultation with your dietitian once you have an active plan.
                        </Text>
                    </View>
                }
                ListHeaderComponent={error ? <Text style={styles.error}>{error}</Text> : null}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => load(true)} />}
                renderItem={({ item }) => <BookingRow item={item} onCancel={onCancel} />}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    wrap: {
        flex: 1,
        backgroundColor: colors.background,
    },
    toolbar: {
        padding: spacing.lg,
        paddingBottom: spacing.sm,
    },
    center: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: colors.background,
    },
    list: {
        paddingHorizontal: spacing.lg,
        paddingBottom: spacing.lg,
    },
    card: {
        backgroundColor: colors.card,
        borderRadius: 12,
        padding: spacing.md,
        marginBottom: spacing.sm,
        borderWidth: 1,
        borderColor: colors.border,
        gap: 4,
    },
    when: {
        fontSize: 16,
        fontWeight: '700',
        color: colors.text,
    },
    dietitian: {
        fontSize: 15,
        color: colors.text,
    },
    meta: {
        fontSize: 13,
        color: colors.textMuted,
    },
    status: {
        fontSize: 13,
        fontWeight: '600',
        color: colors.brandDark,
        textTransform: 'capitalize',
        marginTop: 4,
    },
    cancelLink: {
        marginTop: spacing.sm,
    },
    cancelText: {
        color: colors.error,
        fontSize: 14,
        fontWeight: '600',
    },
    empty: {
        padding: spacing.lg,
        gap: spacing.sm,
    },
    emptyTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: colors.text,
    },
    emptyBody: {
        fontSize: 14,
        color: colors.textMuted,
        lineHeight: 20,
    },
    error: {
        color: colors.error,
        marginBottom: spacing.sm,
    },
});
