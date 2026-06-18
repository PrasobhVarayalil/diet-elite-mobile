import { AdminListScreen } from '@/components/admin/AdminListScreen';
import { adminListStyles } from '@/components/admin/admin-list-styles';
import { BookingStatusBadge } from '@/components/bookings/BookingStatusBadge';
import { Button } from '@/components/ui/Button';
import { formatDateTime } from '@/constants/theme';
import { apiGet } from '@/src/lib/api-client';
import { apiRoutes } from '@/src/lib/api-routes';
import { appHref } from '@/src/lib/navigation';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { Pressable, Text, View } from 'react-native';

type BookingRow = {
    id: string;
    scheduled_at: string;
    status: string;
    is_expired_request?: boolean;
    user?: { name: string };
    dietitian?: { name: string };
};

export default function AdminBookingsScreen() {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [bookings, setBookings] = useState<BookingRow[]>([]);

    const load = useCallback(async () => {
        setLoading(true);
        const result = await apiGet<{ bookings?: { data?: BookingRow[] } }>(apiRoutes.admin.bookings.index);
        if (result.ok) {
            setBookings(result.data?.bookings?.data ?? []);
        }
        setLoading(false);
    }, []);

    useFocusEffect(useCallback(() => { load(); }, [load]));

    return (
        <AdminListScreen
            actions={
                <Button
                    label="Create booking"
                    onPress={() => router.push(appHref('/(app)/admin/bookings/create'))}
                />
            }
            data={bookings}
            keyExtractor={(item) => item.id}
            loading={loading}
            subtitle="All appointments"
            title="Bookings"
            renderItem={({ item }) => (
                <Pressable
                    onPress={() => router.push(appHref(`/(app)/admin/bookings/${item.id}`))}
                    style={adminListStyles.card}
                >
                    <Text style={adminListStyles.title}>{item.user?.name ?? 'Client'}</Text>
                    <Text style={adminListStyles.meta}>{formatDateTime(item.scheduled_at)}</Text>
                    <View style={adminListStyles.metaRow}>
                        <Text style={adminListStyles.meta}>{item.dietitian?.name ?? 'Dietitian'}</Text>
                        <BookingStatusBadge isExpiredRequest={item.is_expired_request} status={item.status} />
                    </View>
                </Pressable>
            )}
        />
    );
}
