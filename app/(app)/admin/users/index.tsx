import { AdminListScreen } from '@/components/admin/AdminListScreen';
import { adminListStyles } from '@/components/admin/admin-list-styles';
import { Button } from '@/components/ui/Button';
import { apiGet } from '@/src/lib/api-client';
import { apiRoutes } from '@/src/lib/api-routes';
import { appHref } from '@/src/lib/navigation';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, spacing } from '@/constants/theme';

type UserRow = {
    id: string;
    name: string;
    email: string;
    role: string;
    role_label?: string;
    is_active?: boolean;
    member_code?: string;
};

type StatusFilter = 'all' | 'active' | 'inactive';

const FILTERS: { id: StatusFilter; label: string }[] = [
    { id: 'all', label: 'All' },
    { id: 'active', label: 'Active' },
    { id: 'inactive', label: 'Inactive' },
];

export default function AdminUsersScreen() {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [users, setUsers] = useState<UserRow[]>([]);
    const [error, setError] = useState<string | null>(null);
    const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');

    const load = useCallback(async () => {
        setLoading(true);
        const query = statusFilter === 'all' ? '' : `?status=${statusFilter}`;
        const result = await apiGet<{ users?: UserRow[] }>(`${apiRoutes.admin.users.index}${query}`);
        if (result.ok) {
            setUsers(result.data?.users ?? []);
            setError(null);
        } else {
            setError(result.message);
        }
        setLoading(false);
    }, [statusFilter]);

    useFocusEffect(useCallback(() => { load(); }, [load]));

    return (
        <AdminListScreen
            actions={<Button label="Add user" onPress={() => router.push(appHref('/(app)/admin/users/form'))} />}
            data={users}
            keyExtractor={(item) => item.id}
            ListHeaderComponent={
                <View style={styles.header}>
                    <View style={styles.filters}>
                        {FILTERS.map((filter) => {
                            const selected = statusFilter === filter.id;
                            return (
                                <Pressable
                                    key={filter.id}
                                    onPress={() => setStatusFilter(filter.id)}
                                    style={[styles.chip, selected && styles.chipSelected]}
                                >
                                    <Text style={[styles.chipText, selected && styles.chipTextSelected]}>
                                        {filter.label}
                                    </Text>
                                </Pressable>
                            );
                        })}
                    </View>
                    {error ? <Text style={adminListStyles.error}>{error}</Text> : null}
                </View>
            }
            loading={loading}
            subtitle="Customers & staff"
            title="Users"
            renderItem={({ item }) => (
                <Pressable
                    onPress={() => router.push(appHref(`/(app)/admin/users/${item.id}`))}
                    style={adminListStyles.card}
                >
                    <View style={styles.row}>
                        <Text style={adminListStyles.title}>{item.name}</Text>
                        <View style={[styles.badge, item.is_active === false && styles.badgeInactive]}>
                            <Text style={[styles.badgeText, item.is_active === false && styles.badgeTextInactive]}>
                                {item.is_active === false ? 'Inactive' : 'Active'}
                            </Text>
                        </View>
                    </View>
                    <Text style={adminListStyles.meta}>
                        {item.role_label ?? item.role} · {item.email}
                        {item.member_code ? ` · ${item.member_code}` : ''}
                    </Text>
                </Pressable>
            )}
        />
    );
}

const styles = StyleSheet.create({
    header: { gap: spacing.sm, marginBottom: spacing.sm },
    filters: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs },
    chip: {
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.xs,
        borderRadius: 999,
        borderWidth: 1,
        borderColor: colors.border,
        backgroundColor: colors.card,
    },
    chipSelected: { backgroundColor: colors.brandDark, borderColor: colors.brandDark },
    chipText: { fontSize: 13, fontWeight: '600', color: colors.text },
    chipTextSelected: { color: '#fff' },
    row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.sm },
    badge: {
        paddingHorizontal: spacing.sm,
        paddingVertical: 2,
        borderRadius: 999,
        backgroundColor: '#e8f5e9',
    },
    badgeInactive: { backgroundColor: '#f4f4f5' },
    badgeText: { fontSize: 11, fontWeight: '700', color: colors.brandDark },
    badgeTextInactive: { color: colors.textMuted },
});
