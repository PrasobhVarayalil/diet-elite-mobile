import { colors, formatInrFromPaise, spacing } from '@/constants/theme';
import { apiGet } from '@/src/lib/api-client';
import { apiRoutes } from '@/src/lib/api-routes';
import type { PlanSummary, PlansIndexResponse } from '@/src/types/plans';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import {
    ActivityIndicator,
    FlatList,
    Pressable,
    RefreshControl,
    StyleSheet,
    Text,
    View,
} from 'react-native';

function PlanCard({ plan, onPress }: { plan: PlanSummary; onPress: () => void }) {
    const price = plan.selling_price_paise ?? plan.price_paise;

    return (
        <Pressable onPress={onPress} style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}>
            {plan.is_featured ? <Text style={styles.badge}>Featured</Text> : null}
            <Text style={styles.name}>{plan.name}</Text>
            {plan.tagline ? <Text style={styles.tagline}>{plan.tagline}</Text> : null}
            <View style={styles.metaRow}>
                <Text style={styles.price}>{formatInrFromPaise(price)}</Text>
                {plan.duration_weeks ? (
                    <Text style={styles.duration}>{plan.duration_weeks} weeks</Text>
                ) : null}
            </View>
            {plan.plan_rank?.rank_name ? (
                <Text style={styles.rank}>{plan.plan_rank.rank_name}</Text>
            ) : null}
        </Pressable>
    );
}

export default function PlansScreen() {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [featured, setFeatured] = useState<PlanSummary[]>([]);
    const [plans, setPlans] = useState<PlanSummary[]>([]);

    const loadPlans = useCallback(async (isRefresh = false) => {
        if (isRefresh) {
            setRefreshing(true);
        } else {
            setLoading(true);
        }

        const result = await apiGet<PlansIndexResponse>(apiRoutes.plans.index);

        if (result.ok && result.data) {
            setFeatured(result.data.featured ?? []);
            setPlans(result.data.plans ?? []);
            setError(null);
        } else {
            setError(result.ok ? 'Could not load plans.' : result.message);
        }

        setLoading(false);
        setRefreshing(false);
    }, []);

    useEffect(() => {
        loadPlans();
    }, [loadPlans]);

    const allPlans = [...featured, ...plans.filter((p) => !featured.some((f) => f.id === p.id))];

    if (loading) {
        return (
            <View style={styles.center}>
                <ActivityIndicator size="large" color={colors.brandDark} />
            </View>
        );
    }

    return (
        <FlatList
            contentContainerStyle={styles.list}
            data={allPlans}
            keyExtractor={(item) => item.id}
            ListEmptyComponent={
                <View style={styles.empty}>
                    <Text style={styles.emptyTitle}>No plans yet</Text>
                    <Text style={styles.emptyBody}>
                        Seed demo data on the API or create plans in the admin portal.
                    </Text>
                </View>
            }
            ListHeaderComponent={
                error ? (
                    <View style={styles.errorBox}>
                        <Text style={styles.errorText}>{error}</Text>
                    </View>
                ) : (
                    <Text style={styles.header}>Choose a diet plan</Text>
                )
            }
            refreshControl={
                <RefreshControl refreshing={refreshing} onRefresh={() => loadPlans(true)} />
            }
            renderItem={({ item }) => (
                <PlanCard plan={item} onPress={() => router.push(`/(app)/plans/${item.id}`)} />
            )}
        />
    );
}

const styles = StyleSheet.create({
    center: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: colors.background,
    },
    list: {
        padding: spacing.lg,
        gap: spacing.md,
    },
    header: {
        fontSize: 15,
        color: colors.textMuted,
        marginBottom: spacing.md,
    },
    card: {
        backgroundColor: colors.card,
        borderRadius: 16,
        padding: spacing.lg,
        marginBottom: spacing.md,
        borderWidth: 1,
        borderColor: colors.border,
        gap: spacing.sm,
    },
    cardPressed: {
        opacity: 0.92,
    },
    badge: {
        alignSelf: 'flex-start',
        backgroundColor: colors.brandLight,
        color: colors.brandDark,
        fontSize: 12,
        fontWeight: '700',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 999,
        overflow: 'hidden',
    },
    name: {
        fontSize: 18,
        fontWeight: '700',
        color: colors.text,
    },
    tagline: {
        fontSize: 14,
        color: colors.textMuted,
        lineHeight: 20,
    },
    metaRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginTop: spacing.sm,
    },
    price: {
        fontSize: 20,
        fontWeight: '700',
        color: colors.brandDark,
    },
    duration: {
        fontSize: 14,
        color: colors.textMuted,
    },
    rank: {
        fontSize: 13,
        color: colors.textMuted,
    },
    empty: {
        padding: spacing.lg,
        gap: spacing.sm,
    },
    emptyTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: colors.text,
    },
    emptyBody: {
        fontSize: 14,
        color: colors.textMuted,
        lineHeight: 20,
    },
    errorBox: {
        backgroundColor: colors.errorBg,
        borderRadius: 12,
        padding: spacing.md,
        marginBottom: spacing.md,
    },
    errorText: {
        color: colors.error,
        fontSize: 14,
    },
});
