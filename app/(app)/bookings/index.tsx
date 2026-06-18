import { AppHeader } from '@/components/ui/AppHeader';
import { BookingStatusBadge } from '@/components/bookings/BookingStatusBadge';
import { BookingActions } from '@/components/bookings/BookingActions';
import { Button } from '@/components/ui/Button';
import { PromptModal } from '@/components/ui/PromptModal';
import { colors, formatDateTime, shadow, spacing } from '@/constants/theme';
import { useAuth } from '@/src/context/auth-context';
import { apiGet, apiPost } from '@/src/lib/api-client';
import { apiRoutes } from '@/src/lib/api-routes';
import { appHref } from '@/src/lib/navigation';
import { customerHasActivePlan } from '@/src/lib/role-nav';
import { isAdvisor, isCustomer, isDietitian } from '@/src/lib/user-access';
import type { BookingListItem, BookingsIndexResponse } from '@/src/types/bookings';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    FlatList,
    Pressable,
    RefreshControl,
    ScrollView,
    StyleSheet,
    Text,
    View,
} from 'react-native';

type DietitianFilter = 'upcoming' | 'pending' | 'expired_pending' | 'today' | 'past';

const DIETITIAN_FILTERS: { id: DietitianFilter; label: string }[] = [
    { id: 'upcoming', label: 'Upcoming' },
    { id: 'pending', label: 'Needs approval' },
    { id: 'expired_pending', label: 'Expired' },
    { id: 'today', label: 'Today' },
    { id: 'past', label: 'Past' },
];

function BookingRow({
    item,
    onCancel,
    onApprove,
    onReject,
    onDismiss,
    onComplete,
    onOpen,
    showClient,
    allowCancel,
    acting,
}: {
    item: BookingListItem;
    onCancel: (item: BookingListItem) => void;
    onApprove: (item: BookingListItem) => void;
    onReject: (item: BookingListItem) => void;
    onDismiss: (item: BookingListItem) => void;
    onComplete: (item: BookingListItem) => void;
    onOpen: (item: BookingListItem) => void;
    showClient?: boolean;
    allowCancel?: boolean;
    acting?: boolean;
}) {
    return (
        <Pressable onPress={() => onOpen(item)} style={styles.card}>
            <Text style={styles.when}>{formatDateTime(item.scheduled_at)}</Text>
            <Text style={styles.dietitian}>
                {showClient ? item.user?.name ?? 'Client' : item.dietitian?.name ?? 'Dietitian'}
            </Text>
            {!showClient && item.dietitian?.title ? (
                <Text style={styles.meta}>{item.dietitian.title}</Text>
            ) : null}
            <BookingStatusBadge isExpiredRequest={item.is_expired_request} status={item.status} />
            <BookingActions
                booking={item}
                loading={acting}
                onApprove={item.can_approve ? () => onApprove(item) : undefined}
                onReject={item.can_reject ? () => onReject(item) : undefined}
                onDismiss={item.can_dismiss ? () => onDismiss(item) : undefined}
                onComplete={item.can_complete ? () => onComplete(item) : undefined}
                onCancel={allowCancel && item.can_cancel ? () => onCancel(item) : undefined}
            />
        </Pressable>
    );
}

export default function BookingsScreen() {
    const router = useRouter();
    const { user } = useAuth();
    const params = useLocalSearchParams<{ filter?: string }>();
    const dietitianView = isDietitian(user);
    const advisorView = isAdvisor(user);
    const [filter, setFilter] = useState<DietitianFilter>(
        (params.filter as DietitianFilter) || 'upcoming',
    );
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [actingId, setActingId] = useState<string | null>(null);
    const [cancelTarget, setCancelTarget] = useState<BookingListItem | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [bookings, setBookings] = useState<BookingListItem[]>([]);

    useEffect(() => {
        if (params.filter && DIETITIAN_FILTERS.some((f) => f.id === params.filter)) {
            setFilter(params.filter as DietitianFilter);
        }
    }, [params.filter]);

    const load = useCallback(async (isRefresh = false) => {
        if (isRefresh) {
            setRefreshing(true);
        } else {
            setLoading(true);
        }

        let path: string;
        if (dietitianView) {
            path = `${apiRoutes.dietitian.appointments}?filter=${filter}`;
        } else if (advisorView) {
            path = apiRoutes.advisor.bookings;
        } else {
            path = apiRoutes.bookings.index;
        }

        const result = await apiGet<BookingsIndexResponse | { bookings?: BookingListItem[] }>(path);

        if (result.ok && result.data) {
            const list =
                'bookings' in result.data && result.data.bookings
                    ? Array.isArray(result.data.bookings)
                        ? result.data.bookings
                        : (result.data.bookings.data ?? [])
                    : [];
            setBookings(list);
            setError(null);
        } else {
            setError(result.ok ? 'Could not load bookings.' : result.message);
        }

        setLoading(false);
        setRefreshing(false);
    }, [advisorView, dietitianView, filter]);

    useEffect(() => {
        load();
    }, [load]);

    async function runDietitianAction(
        item: BookingListItem,
        kind: 'approve' | 'reject' | 'cancel' | 'complete',
        reason?: string,
    ) {
        setActingId(item.id);
        const routes = {
            approve: apiRoutes.dietitian.appointmentApprove(item.id),
            reject: apiRoutes.dietitian.appointmentReject(item.id),
            cancel: apiRoutes.dietitian.appointmentCancel(item.id),
            complete: apiRoutes.dietitian.appointmentComplete(item.id),
        };
        const body = kind === 'cancel' ? { reason: reason || 'Cancelled from mobile app' } : {};
        const result = await apiPost(routes[kind], body);
        setActingId(null);
        if (result.ok) {
            load(true);
        } else {
            Alert.alert('Error', result.message);
        }
    }

    function onCancel(item: BookingListItem) {
        setCancelTarget(item);
    }

    async function confirmCancel(reason: string) {
        const item = cancelTarget;
        setCancelTarget(null);
        if (!item) {
            return;
        }

        const cancelReason = reason || 'Cancelled from mobile app';
        if (dietitianView) {
            await runDietitianAction(item, 'cancel', cancelReason);
            return;
        }

        const result = await apiPost(apiRoutes.bookings.cancel(item.id), { reason: cancelReason });
        if (result.ok) {
            load(true);
        } else {
            Alert.alert('Error', result.message);
        }
    }

    function openBooking(item: BookingListItem) {
        if (dietitianView) {
            router.push(appHref(`/(app)/bookings/${item.id}`));
        }
    }

    const title = dietitianView ? 'Appointments' : advisorView ? 'First consults' : 'Bookings';
    const subtitle = dietitianView
        ? 'Manage client sessions'
        : advisorView
          ? 'First consultation bookings you created'
          : 'Consultations with your dietitian';

    if (loading) {
        return (
            <View style={styles.wrap}>
                <AppHeader subtitle={subtitle} title={title} />
                <View style={styles.center}>
                    <ActivityIndicator size="large" color={colors.brandDark} />
                </View>
            </View>
        );
    }

    return (
        <View style={styles.wrap}>
            <AppHeader subtitle={subtitle} title={title} />
            {dietitianView ? (
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chips}>
                    {DIETITIAN_FILTERS.map((chip) => (
                        <Pressable
                            key={chip.id}
                            onPress={() => setFilter(chip.id)}
                            style={[styles.chip, filter === chip.id && styles.chipActive]}
                        >
                            <Text style={[styles.chipText, filter === chip.id && styles.chipTextActive]}>
                                {chip.label}
                            </Text>
                        </Pressable>
                    ))}
                </ScrollView>
            ) : null}
            {dietitianView ? (
                <View style={styles.toolbar}>
                    <Button
                        label="Book for client"
                        onPress={() => router.push(appHref('/(app)/bookings/staff-create'))}
                    />
                </View>
            ) : null}
            {isCustomer(user) && customerHasActivePlan(user) ? (
                <View style={styles.toolbar}>
                    <Button label="Book consultation" onPress={() => router.push('/(app)/bookings/create')} />
                </View>
            ) : null}
            {advisorView ? (
                <View style={styles.toolbar}>
                    <Button
                        label="Book first consult"
                        onPress={() => router.push(appHref('/(app)/advisor/bookings/create'))}
                    />
                </View>
            ) : null}
            <FlatList
                contentContainerStyle={styles.list}
                data={bookings}
                keyExtractor={(item) => item.id}
                ListEmptyComponent={
                    <View style={styles.empty}>
                        <Text style={styles.emptyTitle}>
                            {dietitianView ? 'No appointments' : advisorView ? 'No first consults' : 'No bookings yet'}
                        </Text>
                        <Text style={styles.emptyBody}>
                            {dietitianView
                                ? filter === 'pending'
                                    ? 'No requests waiting for your approval.'
                                    : filter === 'expired_pending'
                                      ? 'No expired requests in this list.'
                                      : 'Sessions matching this filter appear here.'
                                : advisorView
                                  ? 'Book a first consultation for a new customer.'
                                  : 'Book a consultation with your dietitian once you have an active plan.'}
                        </Text>
                    </View>
                }
                ListHeaderComponent={error ? <Text style={styles.error}>{error}</Text> : null}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => load(true)} />}
                renderItem={({ item }) => (
                    <BookingRow
                        acting={actingId === item.id}
                        allowCancel={isCustomer(user) || dietitianView}
                        item={item}
                        onApprove={(b) => runDietitianAction(b, 'approve')}
                        onCancel={onCancel}
                        onComplete={(b) => runDietitianAction(b, 'complete')}
                        onOpen={openBooking}
                        onReject={(b) => runDietitianAction(b, 'reject')}
                        onDismiss={(b) => runDietitianAction(b, 'reject')}
                        showClient={dietitianView || advisorView}
                    />
                )}
                style={styles.listFlex}
            />
            <PromptModal
                confirmLabel="Cancel booking"
                message="Add an optional reason for cancelling this consultation."
                onCancel={() => setCancelTarget(null)}
                onConfirm={(reason) => void confirmCancel(reason)}
                title="Cancel booking"
                visible={cancelTarget !== null}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    wrap: {
        flex: 1,
        backgroundColor: colors.background,
    },
    chips: {
        flexGrow: 0,
        paddingHorizontal: spacing.lg,
        paddingVertical: spacing.sm,
        marginBottom: spacing.xs,
    },
    chip: {
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.sm,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: colors.border,
        marginRight: spacing.sm,
        backgroundColor: colors.card,
    },
    chipActive: {
        backgroundColor: colors.brandDark,
        borderColor: colors.brandDark,
    },
    chipText: {
        fontSize: 13,
        fontWeight: '600',
        color: colors.textMuted,
    },
    chipTextActive: {
        color: colors.white,
    },
    toolbar: {
        padding: spacing.lg,
        paddingBottom: spacing.sm,
    },
    center: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    listFlex: { flex: 1, minHeight: 0 },
    list: {
        paddingHorizontal: spacing.lg,
        paddingBottom: spacing.lg,
    },
    card: {
        backgroundColor: colors.card,
        borderRadius: 16,
        padding: spacing.md,
        marginBottom: spacing.sm,
        borderWidth: 1,
        borderColor: colors.border,
        gap: 6,
        ...shadow.card,
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
