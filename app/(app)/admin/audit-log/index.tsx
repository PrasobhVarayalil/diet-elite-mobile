import { AdminListScreen } from '@/components/admin/AdminListScreen';
import { adminListStyles } from '@/components/admin/admin-list-styles';
import { formatDateTime } from '@/constants/theme';
import { apiGet } from '@/src/lib/api-client';
import { apiRoutes } from '@/src/lib/api-routes';
import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { Text, View } from 'react-native';

type LogRow = {
    id: string;
    action: string;
    created_at?: string;
    actor?: { name?: string };
};

export default function AdminAuditLogScreen() {
    const [loading, setLoading] = useState(true);
    const [logs, setLogs] = useState<LogRow[]>([]);

    const load = useCallback(async () => {
        setLoading(true);
        const result = await apiGet<{ logs?: LogRow[] }>(apiRoutes.admin.auditLog);
        if (result.ok) {
            setLogs(result.data?.logs ?? []);
        }
        setLoading(false);
    }, []);

    useFocusEffect(useCallback(() => { load(); }, [load]));

    return (
        <AdminListScreen
            data={logs}
            keyExtractor={(item) => item.id}
            loading={loading}
            subtitle="Security trail"
            title="Audit log"
            renderItem={({ item }) => (
                <View style={adminListStyles.card}>
                    <Text style={adminListStyles.title}>{item.action}</Text>
                    <Text style={adminListStyles.meta}>{item.actor?.name ?? 'System'}</Text>
                    <Text style={adminListStyles.meta}>{item.created_at ? formatDateTime(item.created_at) : ''}</Text>
                </View>
            )}
        />
    );
}
