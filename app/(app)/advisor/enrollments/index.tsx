import { AppHeader } from '@/components/ui/AppHeader';
import { BrandLoadingScreen } from '@/components/ui/BrandLoadingScreen';
import { colors, spacing } from '@/constants/theme';
import { apiGet } from '@/src/lib/api-client';
import { apiRoutes } from '@/src/lib/api-routes';
import { appHref } from '@/src/lib/navigation';
import { useScreenInsets } from '@/src/lib/layout';
import { Stack, useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';

type EnrollmentRow = {
    id: string;
    status: string;
    starts_at?: string | null;
    user?: { name: string; member_code?: string };
    plan?: { name: string };
};

export default function AdvisorEnrollmentsScreen() {
    const router = useRouter();
    const { fabBottom } = useScreenInsets();
    const [loading, setLoading] = useState(true);
    const [enrollments, setEnrollments] = useState<EnrollmentRow[]>([]);

    const load = useCallback(async () => {
        setLoading(true);
        const result = await apiGet<{ enrollments?: EnrollmentRow[] }>(apiRoutes.advisor.enrollments);
        if (result.ok) {
            setEnrollments(result.data?.enrollments ?? []);
        }
        setLoading(false);
    }, []);

    useFocusEffect(useCallback(() => { load(); }, [load]));

    return (
        <View style={styles.root}>
            <Stack.Screen options={{ headerShown: false }} />
            <AppHeader subtitle="Customers you enrolled" title="Enrollments" />
            {loading ? (
                <BrandLoadingScreen message="Loading enrollments…" />
            ) : (
                <FlatList
                    contentContainerStyle={[styles.list, { paddingBottom: fabBottom + 56 }]}
                    data={enrollments}
                    keyExtractor={(item) => item.id}
                    ListEmptyComponent={<Text style={styles.empty}>No enrollments yet.</Text>}
                    renderItem={({ item }) => (
                        <View style={styles.card}>
                            <Text ellipsizeMode="tail" numberOfLines={1} style={styles.title}>
                                {item.user?.name ?? 'Customer'}
                            </Text>
                            <Text ellipsizeMode="tail" numberOfLines={1} style={styles.meta}>
                                {item.plan?.name ?? 'Plan'}
                            </Text>
                            <Text ellipsizeMode="tail" numberOfLines={2} style={styles.meta}>
                                {item.status.replace(/_/g, ' ')}
                                {item.starts_at ? ` · starts ${item.starts_at}` : ''}
                            </Text>
                        </View>
                    )}
                    style={styles.listFlex}
                />
            )}
            <Pressable
                onPress={() => router.push(appHref('/(app)/advisor/enrollments/create'))}
                style={[styles.fab, { bottom: fabBottom }]}
            >
                <Text style={styles.fabText}>+ New enrollment</Text>
            </Pressable>
        </View>
    );
}

const styles = StyleSheet.create({
    root: { flex: 1, backgroundColor: colors.background },
    list: { padding: spacing.lg, gap: spacing.sm },
    listFlex: { flex: 1, minHeight: 0 },
    card: {
        backgroundColor: colors.card,
        borderRadius: 14,
        padding: spacing.md,
        borderWidth: 1,
        borderColor: colors.border,
    },
    title: { fontSize: 16, fontWeight: '700', color: colors.text },
    meta: { fontSize: 13, color: colors.textMuted, marginTop: 2 },
    empty: { textAlign: 'center', color: colors.textMuted, marginTop: spacing.lg },
    fab: {
        position: 'absolute',
        left: spacing.lg,
        right: spacing.lg,
        backgroundColor: colors.brandDark,
        borderRadius: 12,
        padding: spacing.md,
        alignItems: 'center',
    },
    fabText: { color: colors.white, fontWeight: '700', fontSize: 16 },
});
