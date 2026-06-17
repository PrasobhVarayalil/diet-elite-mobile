import { AdminListScreen } from '@/components/admin/AdminListScreen';
import { adminListStyles } from '@/components/admin/admin-list-styles';
import { apiGet } from '@/src/lib/api-client';
import { apiRoutes } from '@/src/lib/api-routes';
import { appHref } from '@/src/lib/navigation';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { Pressable, Text } from 'react-native';

type DietitianRow = { id: string; name: string; title?: string; schedule_count?: number };

export default function AdminSchedulesScreen() {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [items, setItems] = useState<DietitianRow[]>([]);

    const load = useCallback(async () => {
        setLoading(true);
        const result = await apiGet<{ dietitians?: DietitianRow[] }>(apiRoutes.admin.schedules.index);
        if (result.ok) {
            setItems(result.data?.dietitians ?? []);
        }
        setLoading(false);
    }, []);

    useFocusEffect(useCallback(() => { load(); }, [load]));

    return (
        <AdminListScreen
            data={items}
            keyExtractor={(item) => item.id}
            loading={loading}
            subtitle="Dietitian shifts"
            title="Schedules"
            renderItem={({ item }) => (
                <Pressable
                    onPress={() => router.push(appHref(`/(app)/admin/schedules/${item.id}`))}
                    style={adminListStyles.card}
                >
                    <Text style={adminListStyles.title}>{item.name}</Text>
                    <Text style={adminListStyles.meta}>
                        {item.title ?? 'Dietitian'} · {item.schedule_count ?? 0} shifts
                    </Text>
                </Pressable>
            )}
        />
    );
}
