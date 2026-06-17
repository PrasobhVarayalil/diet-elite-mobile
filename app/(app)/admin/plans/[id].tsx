import { AppHeader } from '@/components/ui/AppHeader';
import { colors, formatInrFromPaise, spacing } from '@/constants/theme';
import { apiGet } from '@/src/lib/api-client';
import { apiRoutes } from '@/src/lib/api-routes';
import { Stack, useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native';

export default function AdminPlanShowScreen() {
    const { id } = useLocalSearchParams<{ id: string }>();
    const [loading, setLoading] = useState(true);
    const [plan, setPlan] = useState<Record<string, unknown> | null>(null);

    const load = useCallback(async () => {
        if (!id) {
            return;
        }
        setLoading(true);
        const result = await apiGet<{ plan?: Record<string, unknown> }>(apiRoutes.admin.plans.show(id));
        if (result.ok && result.data?.plan) {
            setPlan(result.data.plan);
        }
        setLoading(false);
    }, [id]);

    useEffect(() => {
        load();
    }, [load]);

    if (loading) {
        return <ActivityIndicator color={colors.brandDark} style={{ marginTop: 40 }} />;
    }

    return (
        <View style={styles.root}>
            <Stack.Screen options={{ headerShown: false }} />
            <AppHeader subtitle={String(plan?.tagline ?? '')} title={String(plan?.name ?? 'Plan')} />
            <ScrollView contentContainerStyle={styles.content}>
                <Text style={styles.value}>{formatInrFromPaise(Number(plan?.price_paise ?? 0))}</Text>
                <Text style={styles.meta}>{String(plan?.duration_weeks ?? '—')} weeks</Text>
                <Text style={styles.meta}>{plan?.is_active ? 'Active' : 'Inactive'}</Text>
                <Text style={styles.body}>{String(plan?.description ?? '')}</Text>
                <Text style={styles.meta}>{Number(plan?.enrollments_count ?? 0)} enrollments</Text>
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    root: { flex: 1, backgroundColor: colors.background },
    content: { padding: spacing.lg, gap: spacing.sm },
    value: { fontSize: 24, fontWeight: '800', color: colors.brandDark },
    meta: { fontSize: 14, color: colors.textMuted },
    body: { fontSize: 15, color: colors.text, lineHeight: 22, marginTop: spacing.md },
});
