import { AppScreen } from '@/components/ui/AppScreen';
import { BookingStatusBadge } from '@/components/bookings/BookingStatusBadge';
import { BookingActions } from '@/components/bookings/BookingActions';
import { colors, formatDateTime, spacing } from '@/constants/theme';
import { useAuth } from '@/src/context/auth-context';
import { apiGet, apiPost } from '@/src/lib/api-client';
import { apiRoutes } from '@/src/lib/api-routes';
import { isAdmin, isCustomer, isDietitian } from '@/src/lib/user-access';
import type { BookingListItem } from '@/src/types/bookings';
import { Stack, useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Alert, StyleSheet, Text } from 'react-native';

export default function BookingDetailScreen() {
    const { user } = useAuth();
    const { id } = useLocalSearchParams<{ id: string }>();
    const [loading, setLoading] = useState(true);
    const [acting, setActing] = useState(false);
    const [booking, setBooking] = useState<BookingListItem | null>(null);
    const [error, setError] = useState<string | null>(null);

    const load = useCallback(async () => {
        if (!id) {
            return;
        }
        setLoading(true);
        let path: string;
        if (isDietitian(user)) {
            path = apiRoutes.dietitian.appointmentShow(id);
        } else if (isAdmin(user)) {
            path = apiRoutes.admin.bookings.show(id);
        } else {
            setError('Booking details are not available for your role.');
            setLoading(false);
            return;
        }
        const result = await apiGet<{ booking?: BookingListItem }>(path);
        if (result.ok && result.data?.booking) {
            setBooking(result.data.booking);
            setError(null);
        } else {
            setError(result.ok ? 'Could not load booking.' : result.message);
        }
        setLoading(false);
    }, [id, user]);

    useEffect(() => {
        load();
    }, [load]);

    async function runAction(kind: 'approve' | 'reject' | 'cancel' | 'complete') {
        if (!id || !booking) {
            return;
        }
        setActing(true);
        let path: string;
        let body: Record<string, unknown> = {};
        if (isDietitian(user)) {
            const routes = {
                approve: apiRoutes.dietitian.appointmentApprove(id),
                reject: apiRoutes.dietitian.appointmentReject(id),
                cancel: apiRoutes.dietitian.appointmentCancel(id),
                complete: apiRoutes.dietitian.appointmentComplete(id),
            };
            path = routes[kind];
            if (kind === 'cancel') {
                body = { reason: 'Cancelled from mobile app' };
            }
        } else if (isAdmin(user)) {
            const routes = {
                approve: apiRoutes.admin.bookings.approve(id),
                reject: apiRoutes.admin.bookings.reject(id),
                cancel: apiRoutes.admin.bookings.cancel(id),
                complete: apiRoutes.admin.bookings.complete(id),
            };
            path = routes[kind];
        } else {
            setActing(false);
            return;
        }
        const result = await apiPost(path, body);
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
            <AppScreen loading showLogo={false} subtitle="Appointment details" title="Booking" />
        );
    }

    return (
        <>
            <Stack.Screen options={{ headerShown: false }} />
            <AppScreen
                scroll
                showLogo={false}
                subtitle="Appointment details"
                title={booking?.user?.name ?? 'Booking'}
            >
                {error ? <Text style={styles.error}>{error}</Text> : null}
                {booking ? (
                    <>
                        <Text style={styles.when}>{formatDateTime(booking.scheduled_at)}</Text>
                        <BookingStatusBadge isExpiredRequest={booking.is_expired_request} status={booking.status} />
                        <Text ellipsizeMode="tail" numberOfLines={2} style={styles.meta}>
                            {isCustomer(user)
                                ? booking.dietitian?.name
                                : booking.user?.name ?? 'Client'}
                        </Text>
                        <BookingActions
                            booking={booking}
                            loading={acting}
                            onApprove={booking.can_approve ? () => runAction('approve') : undefined}
                            onReject={booking.can_reject ? () => runAction('reject') : undefined}
                            onDismiss={booking.can_dismiss ? () => runAction('reject') : undefined}
                            onComplete={booking.can_complete ? () => runAction('complete') : undefined}
                            onCancel={
                                booking.can_cancel && (isDietitian(user) || isAdmin(user))
                                    ? () => runAction('cancel')
                                    : undefined
                            }
                        />
                    </>
                ) : null}
            </AppScreen>
        </>
    );
}

const styles = StyleSheet.create({
    when: { fontSize: 18, fontWeight: '700', color: colors.text },
    meta: { fontSize: 15, color: colors.textMuted },
    error: { color: colors.error },
});
