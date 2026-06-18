import { AppHeader } from '@/components/ui/AppHeader';
import { CustomerProgramGate } from '@/components/auth/CustomerProgramGate';
import { PlanActions } from '@/components/plans/PlanActions';
import { PlanHighlights, PlanRankBadge } from '@/components/plans/PlanRankBadge';
import { BrandLoadingScreen } from '@/components/ui/BrandLoadingScreen';
import { colors, formatInrFromPaise, spacing } from '@/constants/theme';
import { useAuth } from '@/src/context/auth-context';
import { apiGet } from '@/src/lib/api-client';
import { apiRoutes } from '@/src/lib/api-routes';
import type { CurrentEnrollment } from '@/src/lib/customer-plan-actions';
import { PLANS_LIST_HREF } from '@/src/lib/navigation';
import { customerHasActivePlan } from '@/src/lib/role-nav';
import type { CheckoutIntent } from '@/src/types/checkout';
import type { PlanShowResponse, PlanSummary } from '@/src/types/plans';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

const RESERVED_PLAN_IDS = new Set(['index', 'compare', 'create']);

export default function PlanDetailScreen() {
    const router = useRouter();
    const { user } = useAuth();
    const { id } = useLocalSearchParams<{ id: string }>();
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [data, setData] = useState<PlanShowResponse | null>(null);

    const planOptions = {
        planAccess: user?.plan_access,
        renewPlanId: user?.renew_plan_id,
    };

    useEffect(() => {
        if (id && RESERVED_PLAN_IDS.has(id)) {
            router.replace(PLANS_LIST_HREF);
        }
    }, [id, router]);

    const loadPlan = useCallback(async () => {
        if (!id || RESERVED_PLAN_IDS.has(id)) {
            if (!id) {
                setError('Missing plan id.');
            }
            setLoading(false);
            return;
        }

        setLoading(true);
        const result = await apiGet<PlanShowResponse>(apiRoutes.plans.show(id));

        if (result.ok && result.data) {
            setData(result.data);
            setError(null);
        } else {
            setError(result.ok ? 'Could not load plan.' : result.message);
        }

        setLoading(false);
    }, [id]);

    useEffect(() => {
        loadPlan();
    }, [loadPlan]);

    function goCheckout(intent: CheckoutIntent) {
        if (!data?.plan.id) {
            return;
        }
        router.push({
            pathname: '/(app)/plans/[id]/checkout',
            params: { id: data.plan.id, intent },
        });
    }

    const plan = data?.plan;
    const price = plan?.selling_price_paise ?? plan?.price_paise;
    const enrollment = data?.currentEnrollment as CurrentEnrollment | null | undefined;

    // Merge upgrade quote from list API if show endpoint omits it — refetch index slice not needed if we add quote on show
    // API show doesn't include upgrade_quote; fetch from plans index for this plan id when user has active plan
    const [upgradeQuotePlan, setUpgradeQuotePlan] = useState<PlanSummary | null>(null);

    useEffect(() => {
        if (!id || !customerHasActivePlan(user)) {
            return;
        }
        (async () => {
            const result = await apiGet<{ plans?: PlanSummary[]; featured?: PlanSummary[] }>(
                apiRoutes.plans.index,
            );
            if (result.ok && result.data) {
                const all = [...(result.data.featured ?? []), ...(result.data.plans ?? [])];
                const match = all.find((p) => p.id === id);
                if (match?.upgrade_quote) {
                    setUpgradeQuotePlan(match);
                }
            }
        })();
    }, [id, user]);

    const planWithQuote: PlanSummary | undefined = plan
        ? { ...plan, upgrade_quote: upgradeQuotePlan?.upgrade_quote ?? plan.upgrade_quote }
        : undefined;

    return (
        <CustomerProgramGate requireActivePlan={false}>
            <View style={styles.root}>
            <Stack.Screen options={{ headerShown: false }} />
            <AppHeader subtitle={plan?.tagline ?? 'Plan details'} title={plan?.name ?? 'Plan'} />
            {loading ? (
                <BrandLoadingScreen message="Loading plan…" />
            ) : error ? (
                <View style={styles.center}>
                    <Text style={styles.error}>{error}</Text>
                </View>
            ) : plan && planWithQuote ? (
                <ScrollView contentContainerStyle={styles.content}>
                    {data?.isCurrentPlan ? (
                        <View style={styles.currentBadge}>
                            <Text style={styles.currentBadgeText}>Your current plan</Text>
                        </View>
                    ) : null}
                    <PlanRankBadge large rank={plan.plan_rank} />
                    <Text style={styles.price}>{formatInrFromPaise(price)}</Text>
                    {plan.duration_weeks ? (
                        <Text style={styles.meta}>{plan.duration_weeks} weeks program</Text>
                    ) : null}
                    {plan.category?.name ? (
                        <Text style={styles.meta}>Category: {plan.category.name}</Text>
                    ) : null}
                    {plan.description ? <Text style={styles.description}>{plan.description}</Text> : null}
                    <PlanHighlights highlights={plan.plan_rank?.highlights} />
                    {plan.plan_rank?.feature_groups?.map((group) => (
                        <View key={group.title} style={styles.featureGroup}>
                            <Text style={styles.featureTitle}>{group.title}</Text>
                            {group.items.map((item) => (
                                <Text key={item} style={styles.featureItem}>
                                    • {item}
                                </Text>
                            ))}
                        </View>
                    ))}
                    <PlanActions
                        currentEnrollment={enrollment}
                        onCheckout={goCheckout}
                        options={planOptions}
                        plan={planWithQuote}
                    />
                </ScrollView>
            ) : null}
            </View>
        </CustomerProgramGate>
    );
}

const styles = StyleSheet.create({
    root: { flex: 1, backgroundColor: colors.background },
    center: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        padding: spacing.lg,
        gap: spacing.md,
    },
    content: { padding: spacing.lg, gap: spacing.md, paddingBottom: spacing.xl },
    currentBadge: {
        alignSelf: 'flex-start',
        backgroundColor: colors.successBg,
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 999,
        borderWidth: 1,
        borderColor: colors.chart2,
    },
    currentBadgeText: { color: colors.success, fontWeight: '700', fontSize: 13 },
    price: { fontSize: 32, fontWeight: '700', color: colors.brandDark },
    meta: { fontSize: 14, color: colors.textMuted },
    description: { fontSize: 15, lineHeight: 24, color: colors.text, marginVertical: spacing.sm },
    featureGroup: { gap: 6, marginTop: spacing.sm },
    featureTitle: { fontSize: 14, fontWeight: '700', color: colors.text },
    featureItem: { fontSize: 14, lineHeight: 20, color: colors.textMuted },
    error: { color: colors.error, fontSize: 15, textAlign: 'center' },
});

