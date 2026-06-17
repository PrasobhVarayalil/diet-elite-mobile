import { AdminListScreen } from '@/components/admin/AdminListScreen';
import { adminListStyles } from '@/components/admin/admin-list-styles';
import { Button } from '@/components/ui/Button';
import { apiGet } from '@/src/lib/api-client';
import { apiRoutes } from '@/src/lib/api-routes';
import { appHref } from '@/src/lib/navigation';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { Pressable, Text } from 'react-native';

type UserRow = {
    id: string;
    name: string;
    email: string;
    role: string;
    role_label?: string;
    is_active?: boolean;
    member_code?: string;
};

export default function AdminUsersScreen() {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [users, setUsers] = useState<UserRow[]>([]);
    const [error, setError] = useState<string | null>(null);

    const load = useCallback(async () => {
        setLoading(true);
        const result = await apiGet<{ users?: UserRow[] }>(apiRoutes.admin.users.index);
        if (result.ok) {
            setUsers(result.data?.users ?? []);
            setError(null);
        } else {
            setError(result.message);
        }
        setLoading(false);
    }, []);

    useFocusEffect(useCallback(() => { load(); }, [load]));

    return (
        <AdminListScreen
            actions={<Button label="Add user" onPress={() => router.push(appHref('/(app)/admin/users/form'))} />}
            data={users}
            keyExtractor={(item) => item.id}
            ListHeaderComponent={error ? <Text style={adminListStyles.error}>{error}</Text> : null}
            loading={loading}
            subtitle="Customers & staff"
            title="Users"
            renderItem={({ item }) => (
                <Pressable
                    onPress={() => router.push(appHref(`/(app)/admin/users/${item.id}`))}
                    style={adminListStyles.card}
                >
                    <Text style={adminListStyles.title}>{item.name}</Text>
                    <Text style={adminListStyles.meta}>
                        {item.role_label ?? item.role} · {item.email}
                        {item.member_code ? ` · ${item.member_code}` : ''}
                    </Text>
                    <Text style={adminListStyles.meta}>{item.is_active === false ? 'Inactive' : 'Active'}</Text>
                </Pressable>
            )}
        />
    );
}
