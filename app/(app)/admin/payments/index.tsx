import { AdminListScreen } from '@/components/admin/AdminListScreen';
import { adminListStyles } from '@/components/admin/admin-list-styles';
import { formatDateTime, formatInrFromPaise } from '@/constants/theme';
import { apiGet } from '@/src/lib/api-client';
import { apiRoutes } from '@/src/lib/api-routes';
import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { Text, View } from 'react-native';

type PaymentRow = { id: string; amount_paise: number; status_label?: string; created_at?: string; user?: { name: string } };

export default function AdminPaymentsScreen() {
    const [loading, setLoading] = useState(true);
    const [payments, setPayments] = useState<PaymentRow[]>([]);

    const load = useCallback(async () => {
        setLoading(true);
        const result = await apiGet<{ payments?: PaymentRow[] }>(apiRoutes.admin.payments.index);
        if (result.ok) {
            setPayments(result.data?.payments ?? []);
        }
        setLoading(false);
    }, []);

    useFocusEffect(useCallback(() => { load(); }, [load]));

    return (
        <AdminListScreen
            data={payments}
            keyExtractor={(item) => item.id}
            loading={loading}
            subtitle="Platform revenue"
            title="Payments"
            renderItem={({ item }) => (
                <View style={adminListStyles.card}>
                    <Text style={adminListStyles.title}>{formatInrFromPaise(item.amount_paise)}</Text>
                    <Text style={adminListStyles.meta}>
                        {item.user?.name ?? 'Customer'} · {item.status_label ?? 'paid'}
                    </Text>
                    <Text style={adminListStyles.meta}>{item.created_at ? formatDateTime(item.created_at) : ''}</Text>
                </View>
            )}
        />
    );
}
