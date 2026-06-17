import { AdminListScreen } from '@/components/admin/AdminListScreen';
import { adminListStyles } from '@/components/admin/admin-list-styles';
import { Button } from '@/components/ui/Button';
import { apiDelete, apiGet } from '@/src/lib/api-client';
import { apiRoutes } from '@/src/lib/api-routes';
import { appHref } from '@/src/lib/navigation';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { Alert, Pressable, Text, View } from 'react-native';

type RankRow = { id: string; name: string; slug?: string; sort_order?: number; is_active?: boolean; diet_plans_count?: number };

export default function AdminPlanRanksScreen() {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [items, setItems] = useState<RankRow[]>([]);

    const load = useCallback(async () => {
        setLoading(true);
        const result = await apiGet<{ ranks?: RankRow[] }>(apiRoutes.admin.planRanks.index);
        if (result.ok) {
            setItems(result.data?.ranks ?? []);
        }
        setLoading(false);
    }, []);

    useFocusEffect(useCallback(() => { load(); }, [load]));

    return (
        <AdminListScreen
            actions={<Button label="Add rank" onPress={() => router.push(appHref('/(app)/admin/plan-ranks/form'))} />}
            data={items}
            keyExtractor={(item) => item.id}
            loading={loading}
            subtitle="Tier ladder"
            title="Plan ranks"
            renderItem={({ item }) => (
                <View style={adminListStyles.card}>
                    <Pressable
                        onPress={() => router.push(appHref(`/(app)/admin/plan-ranks/form?id=${item.id}`))}
                        style={adminListStyles.cardBody}
                    >
                        <Text style={adminListStyles.title}>{item.name}</Text>
                        <Text style={adminListStyles.meta}>
                            Order {item.sort_order ?? 0} · {item.diet_plans_count ?? 0} plans
                        </Text>
                    </Pressable>
                    <Button
                        label="Delete"
                        variant="secondary"
                        onPress={() =>
                            Alert.alert('Delete rank', `Remove "${item.name}"?`, [
                                { text: 'Cancel', style: 'cancel' },
                                {
                                    text: 'Delete',
                                    style: 'destructive',
                                    onPress: async () => {
                                        const result = await apiDelete(apiRoutes.admin.planRanks.destroy(item.id));
                                        if (result.ok) {
                                            load();
                                        } else {
                                            Alert.alert('Error', result.message);
                                        }
                                    },
                                },
                            ])
                        }
                    />
                </View>
            )}
        />
    );
}
