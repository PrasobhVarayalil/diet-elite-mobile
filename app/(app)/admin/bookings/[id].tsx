import { AppHeader } from '@/components/ui/AppHeader';
import { BookingActions } from '@/components/bookings/BookingActions';
import { BookingStatusBadge } from '@/components/bookings/BookingStatusBadge';
import { colors, formatDateTime, spacing } from '@/constants/theme';
import { apiGet, apiPost } from '@/src/lib/api-client';
import { apiRoutes } from '@/src/lib/api-routes';
import type { BookingListItem } from '@/src/types/bookings';
import { Stack, useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, StyleSheet, Text, View } from 'react-native';

export default function AdminBookingShowScreen() {
    const { id } = useLocalSearchParams<{ id: string }>();
    const [loading, setLoading] = useState(true);
    const [booking, setBooking] = useState<BookingListItem | null>(null);
    const [acting, setActing] = useState(false);

    const load = useCallback(async () => {
        if (!id) {
            return;
        }
        setLoading(true);
        const result = await apiGet<{ booking?: BookingListItem }>(apiRoutes.admin.bookings.show(id));
        if (result.ok && result.data?.booking) {
            setBooking(result.data.booking);
        }
        setLoading(false);
    }, [id]);

    useEffect(() => {
        load();
    }, [load]);

    async function runAction(kind: 'approve' | 'reject' | 'cancel' | 'complete') {
        if (!id) {
            return;
        }
        setActing(true);
        const paths = {
            approve: apiRoutes.admin.bookings.approve(id),
            reject: apiRoutes.admin.bookings.reject(id),
            cancel: apiRoutes.admin.bookings.cancel(id),
            complete: apiRoutes.admin.bookings.complete(id),
        };
        const result = await apiPost(paths[kind], kind === 'complete' ? { note: null } : {});
        setActing(false);
        if (result.ok) {
            Alert.alert('Done', result.message);
            load();
        } else {
            Alert.alert('Error', result.message);
        }
    }

    if (loading) {
        return (
            <View style={styles.center}>
                <ActivityIndicator color={colors.brandDark} />
            </View>
        );
    }

    return (
        <View style={styles.root}>
            <Stack.Screen options={{ headerShown: false }} />
            <AppHeader subtitle={formatDateTime(booking?.scheduled_at ?? '')} title="Booking" />
            <ScrollView contentContainerStyle={styles.content}>
                <Text style={styles.value}>{booking?.user?.name ?? 'Client'}</Text>
                {booking ? (
                    <BookingStatusBadge isExpiredRequest={booking.is_expired_request} status={booking.status} />
                ) : null}
                <BookingActions
                    booking={booking ?? { id: '', scheduled_at: '', status: '' }}
                    loading={acting}
                    onApprove={booking?.can_approve ? () => runAction('approve') : undefined}
                    onReject={booking?.can_reject ? () => runAction('reject') : undefined}
                    onDismiss={booking?.can_dismiss ? () => runAction('reject') : undefined}
                    onComplete={booking?.can_complete ? () => runAction('complete') : undefined}
                    onCancel={booking?.can_cancel ? () => runAction('cancel') : undefined}
                />
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    root: { flex: 1, backgroundColor: colors.background },
    center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
    content: { padding: spacing.lg, gap: spacing.sm },
    value: { fontSize: 18, fontWeight: '700', color: colors.text },
});
