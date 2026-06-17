import { AdminListScreen } from '@/components/admin/AdminListScreen';
import { adminListStyles } from '@/components/admin/admin-list-styles';
import { Button } from '@/components/ui/Button';
import { formatInrFromPaise } from '@/constants/theme';
import { apiDelete, apiGet } from '@/src/lib/api-client';
import { apiRoutes } from '@/src/lib/api-routes';
import { appHref } from '@/src/lib/navigation';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { Alert, Pressable, Text, View } from 'react-native';

type PlanRow = {
    id: string;
    name: string;
    price_paise?: number;
    is_active?: boolean;
    enrollments_count?: number;
    can_delete?: boolean;
};

export default function AdminPlansScreen() {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [plans, setPlans] = useState<PlanRow[]>([]);
    const [error, setError] = useState<string | null>(null);

    const load = useCallback(async () => {
        setLoading(true);
        const result = await apiGet<{ plans?: PlanRow[] }>(apiRoutes.admin.plans.index);
        if (result.ok) {
            setPlans(result.data?.plans ?? []);
            setError(null);
        } else {
            setError(result.message);
        }
        setLoading(false);
    }, []);

    useFocusEffect(useCallback(() => { load(); }, [load]));

    async function onDelete(plan: PlanRow) {
        Alert.alert('Delete plan', `Remove "${plan.name}"?`, [
            { text: 'Cancel', style: 'cancel' },
            {
                text: 'Delete',
                style: 'destructive',
                onPress: async () => {
                    const result = await apiDelete(apiRoutes.admin.plans.destroy(plan.id));
                    if (result.ok) {
                        load();
                    } else {
                        Alert.alert('Could not delete', result.message);
                    }
                },
            },
        ]);
    }

    return (
        <AdminListScreen
            actions={<Button label="Add plan" onPress={() => router.push(appHref('/(app)/admin/plans/form'))} />}
            data={plans}
            keyExtractor={(item) => item.id}
            ListEmptyComponent={<Text style={adminListStyles.empty}>No plans yet.</Text>}
            ListHeaderComponent={error ? <Text style={adminListStyles.error}>{error}</Text> : null}
            loading={loading}
            subtitle="Manage diet programs"
            title="Diet plans"
            renderItem={({ item }) => (
                <View style={adminListStyles.card}>
                    <Pressable onPress={() => router.push(appHref(`/(app)/admin/plans/${item.id}`))} style={adminListStyles.cardBody}>
                        <Text style={adminListStyles.title}>{item.name}</Text>
                        <Text style={adminListStyles.meta}>
                            {formatInrFromPaise(item.price_paise ?? 0)} · {item.enrollments_count ?? 0} enrollments ·{' '}
                            {item.is_active ? 'Active' : 'Inactive'}
                        </Text>
                    </Pressable>
                    <View style={adminListStyles.row}>
                        <Button label="Edit" onPress={() => router.push(appHref(`/(app)/admin/plans/form?id=${item.id}`))} />
                        {item.can_delete ? <Button label="Delete" onPress={() => onDelete(item)} variant="secondary" /> : null}
                    </View>
                </View>
            )}
        />
    );
}
