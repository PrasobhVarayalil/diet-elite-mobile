import { AppHeader } from '@/components/ui/AppHeader';
import { Badge } from '@/components/ui/Badge';
import { colors, formatDateTime, spacing } from '@/constants/theme';
import { useAuth } from '@/src/context/auth-context';
import { apiGet } from '@/src/lib/api-client';
import { apiRoutes } from '@/src/lib/api-routes';
import { appHref } from '@/src/lib/navigation';
import { isDietitian } from '@/src/lib/user-access';
import { Redirect, Stack, useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, StyleSheet, Text, View } from 'react-native';

type ClientRow = {
    id: string;
    name: string;
    email?: string;
    member_code?: string;
    health_complete?: boolean;
    last_appointment_at?: string | null;
    appointments_count?: number;
};

export default function ClientsScreen() {
    const router = useRouter();
    const { user } = useAuth();
    const [loading, setLoading] = useState(true);
    const [clients, setClients] = useState<ClientRow[]>([]);
    const [error, setError] = useState<string | null>(null);

    const load = useCallback(async () => {
        setLoading(true);
        const result = await apiGet<{ clients?: ClientRow[] }>(apiRoutes.dietitian.clients);
        if (result.ok) {
            setClients(result.data?.clients ?? []);
            setError(null);
        } else {
            setError(result.message);
        }
        setLoading(false);
    }, []);

    useFocusEffect(useCallback(() => { load(); }, [load]));

    if (!isDietitian(user)) {
        return <Redirect href="/(app)" />;
    }

    return (
        <View style={styles.root}>
            <Stack.Screen options={{ headerShown: false }} />
            <AppHeader subtitle="Customers with appointments" title="My clients" />
            {loading ? (
                <ActivityIndicator color={colors.brandDark} style={{ marginTop: 40 }} />
            ) : (
                <FlatList
                    contentContainerStyle={styles.list}
                    data={clients}
                    keyExtractor={(item) => item.id}
                    ListEmptyComponent={
                        <Text style={styles.empty}>{error ?? 'No clients yet.'}</Text>
                    }
                    renderItem={({ item }) => (
                        <Pressable
                            onPress={() => router.push(appHref(`/(app)/clients/${item.id}`))}
                            style={styles.card}
                        >
                            <Text style={styles.title}>{item.name}</Text>
                            <Text style={styles.meta}>{item.email ?? item.member_code}</Text>
                            <View style={styles.row}>
                                <Badge
                                    label={item.health_complete ? 'Health profile complete' : 'Health incomplete'}
                                    tone={item.health_complete ? 'success' : 'warning'}
                                />
                                <Text style={styles.meta}>
                                    {item.appointments_count ?? 0} sessions
                                    {item.last_appointment_at
                                        ? ` · last ${formatDateTime(item.last_appointment_at)}`
                                        : ''}
                                </Text>
                            </View>
                        </Pressable>
                    )}
                />
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    root: { flex: 1, backgroundColor: colors.background },
    list: { padding: spacing.lg, gap: spacing.sm },
    card: {
        backgroundColor: colors.card,
        borderRadius: 14,
        padding: spacing.md,
        borderWidth: 1,
        borderColor: colors.border,
        marginBottom: spacing.sm,
        gap: 4,
    },
    title: { fontSize: 16, fontWeight: '700', color: colors.text },
    meta: { fontSize: 13, color: colors.textMuted },
    row: { gap: spacing.sm, marginTop: spacing.sm },
    empty: { textAlign: 'center', color: colors.textMuted, marginTop: spacing.lg },
});
