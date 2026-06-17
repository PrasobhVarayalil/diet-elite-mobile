import { AdminListScreen } from '@/components/admin/AdminListScreen';
import { adminListStyles } from '@/components/admin/admin-list-styles';
import { Button } from '@/components/ui/Button';
import { apiDelete, apiGet } from '@/src/lib/api-client';
import { apiRoutes } from '@/src/lib/api-routes';
import { appHref } from '@/src/lib/navigation';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { Alert, Pressable, Text, View } from 'react-native';

type CategoryRow = { id: string; name: string; slug?: string; is_active?: boolean; diet_plans_count?: number };

export default function AdminCategoriesScreen() {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [items, setItems] = useState<CategoryRow[]>([]);
    const [error, setError] = useState<string | null>(null);

    const load = useCallback(async () => {
        setLoading(true);
        const result = await apiGet<{ categories?: CategoryRow[] }>(apiRoutes.admin.categories.index);
        if (result.ok) {
            setItems(result.data?.categories ?? []);
            setError(null);
        } else {
            setError(result.message);
        }
        setLoading(false);
    }, []);

    useFocusEffect(useCallback(() => { load(); }, [load]));

    function onDelete(item: CategoryRow) {
        Alert.alert('Delete category', `Remove "${item.name}"?`, [
            { text: 'Cancel', style: 'cancel' },
            {
                text: 'Delete',
                style: 'destructive',
                onPress: async () => {
                    const result = await apiDelete(apiRoutes.admin.categories.destroy(item.id));
                    if (result.ok) {
                        load();
                    } else {
                        Alert.alert('Error', result.message);
                    }
                },
            },
        ]);
    }

    return (
        <AdminListScreen
            actions={<Button label="Add category" onPress={() => router.push(appHref('/(app)/admin/categories/form'))} />}
            data={items}
            keyExtractor={(item) => item.id}
            ListHeaderComponent={error ? <Text style={adminListStyles.error}>{error}</Text> : null}
            loading={loading}
            subtitle="Plan categories"
            title="Categories"
            renderItem={({ item }) => (
                <View style={adminListStyles.card}>
                    <Pressable
                        onPress={() => router.push(appHref(`/(app)/admin/categories/form?id=${item.id}`))}
                        style={adminListStyles.cardBody}
                    >
                        <Text style={adminListStyles.title}>{item.name}</Text>
                        <Text style={adminListStyles.meta}>
                            {item.diet_plans_count ?? 0} plans · {item.is_active ? 'Active' : 'Inactive'}
                        </Text>
                    </Pressable>
                    <Button label="Delete" onPress={() => onDelete(item)} variant="secondary" />
                </View>
            )}
        />
    );
}
