import { AppHeader } from '@/components/ui/AppHeader';
import { BrandLoadingScreen } from '@/components/ui/BrandLoadingScreen';
import { CustomerGate } from '@/components/auth/CustomerGate';
import { colors, formatInrFromPaise, spacing } from '@/constants/theme';
import { apiGet } from '@/src/lib/api-client';
import { apiRoutes } from '@/src/lib/api-routes';
import type { PlanSummary } from '@/src/types/plans';
import { Stack } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

type FeatureGroup = {
    rank_name: string;
    features: Array<{ key: string; label: string; values: Record<string, boolean | string | number | null> }>;
};

type CompareResponse = {
    plans?: PlanSummary[];
    rankFeatureCatalog?: FeatureGroup[];
};

export default function PlansCompareScreen() {
    return (
        <CustomerGate>
            <PlansCompareContent />
        </CustomerGate>
    );
}

function PlansCompareContent() {
    const [loading, setLoading] = useState(true);
    const [plans, setPlans] = useState<PlanSummary[]>([]);
    const [catalog, setCatalog] = useState<FeatureGroup[]>([]);
    const [error, setError] = useState<string | null>(null);

    const load = useCallback(async () => {
        setLoading(true);
        const index = await apiGet<{ plans?: PlanSummary[] }>(apiRoutes.plans.index);
        if (!index.ok || !index.data?.plans?.length) {
            setError(index.ok ? 'No plans to compare.' : index.message);
            setLoading(false);
            return;
        }

        const ids = index.data.plans.slice(0, 4).map((p) => p.id).join(',');
        const result = await apiGet<CompareResponse>(`${apiRoutes.plans.compare}?ids=${encodeURIComponent(ids)}`);
        if (result.ok && result.data) {
            setPlans(result.data.plans ?? []);
            setCatalog(result.data.rankFeatureCatalog ?? []);
            setError(null);
        } else {
            setError(result.ok ? 'Could not load comparison.' : result.message);
        }
        setLoading(false);
    }, []);

    useEffect(() => {
        load();
    }, [load]);

    return (
        <View style={styles.root}>
            <Stack.Screen options={{ headerShown: false }} />
            <AppHeader subtitle="Side-by-side membership tiers" title="Compare plans" />
            {loading ? (
                <BrandLoadingScreen message="Comparing plans…" />
            ) : error ? (
                <Text style={styles.error}>{error}</Text>
            ) : (
                <ScrollView contentContainerStyle={styles.content} horizontal>
                    <View>
                        <View style={styles.headerRow}>
                            <View style={styles.featureCol}>
                                <Text style={styles.headerFeature}>Feature</Text>
                            </View>
                            {plans.map((plan) => (
                                <View key={plan.id} style={styles.planCol}>
                                    <Text style={styles.planName}>{plan.name}</Text>
                                    <Text style={styles.planPrice}>
                                        {formatInrFromPaise(plan.selling_price_paise ?? plan.price_paise)}
                                    </Text>
                                    {plan.plan_rank?.rank_name ? (
                                        <Text style={styles.planRank}>{plan.plan_rank.rank_name}</Text>
                                    ) : null}
                                </View>
                            ))}
                        </View>
                        {catalog.map((group) => (
                            <View key={group.rank_name}>
                                <Text style={styles.groupTitle}>{group.rank_name}</Text>
                                {group.features.map((feature) => (
                                    <View key={feature.key} style={styles.row}>
                                        <View style={styles.featureCol}>
                                            <Text style={styles.featureLabel}>{feature.label}</Text>
                                        </View>
                                        {plans.map((plan) => {
                                            const value = feature.values[plan.id];
                                            const display =
                                                typeof value === 'boolean'
                                                    ? value
                                                        ? 'Yes'
                                                        : '—'
                                                    : value == null || value === ''
                                                      ? '—'
                                                      : String(value);
                                            return (
                                                <View key={plan.id} style={styles.planCol}>
                                                    <Text style={styles.cell}>{display}</Text>
                                                </View>
                                            );
                                        })}
                                    </View>
                                ))}
                            </View>
                        ))}
                        {catalog.length === 0 ? (
                            <Text style={styles.meta}>Rank features will appear when plans have ranks assigned.</Text>
                        ) : null}
                    </View>
                </ScrollView>
            )}
        </View>
    );
}

const colWidth = 140;
const featureWidth = 160;

const styles = StyleSheet.create({
    root: { flex: 1, backgroundColor: colors.background },
    content: { padding: spacing.lg, paddingBottom: spacing.xl },
    error: { color: colors.error, padding: spacing.lg },
    headerRow: { flexDirection: 'row', borderBottomWidth: 1, borderColor: colors.border, paddingBottom: spacing.sm },
    row: { flexDirection: 'row', borderBottomWidth: 1, borderColor: colors.border, paddingVertical: spacing.sm },
    featureCol: { width: featureWidth, paddingRight: spacing.sm },
    planCol: { width: colWidth, paddingHorizontal: spacing.xs },
    headerFeature: { fontSize: 13, fontWeight: '700', color: colors.textMuted },
    planName: { fontSize: 14, fontWeight: '700', color: colors.text },
    planPrice: { fontSize: 13, color: colors.brandDark, fontWeight: '600', marginTop: 2 },
    planRank: { fontSize: 11, color: colors.textMuted, marginTop: 2 },
    groupTitle: {
        fontSize: 14,
        fontWeight: '700',
        color: colors.text,
        marginTop: spacing.md,
        marginBottom: spacing.xs,
    },
    featureLabel: { fontSize: 13, color: colors.text },
    cell: { fontSize: 13, color: colors.text, textAlign: 'center' },
    meta: { fontSize: 13, color: colors.textMuted, marginTop: spacing.md },
});
