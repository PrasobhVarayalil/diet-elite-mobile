import { AppHeader } from '@/components/ui/AppHeader';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { PlanActions } from '@/components/plans/PlanActions';
import { colors, chartPalette, formatInrFromPaise, shadow, spacing } from '@/constants/theme';
import { useAuth } from '@/src/context/auth-context';
import { apiGet } from '@/src/lib/api-client';
import { apiRoutes } from '@/src/lib/api-routes';
import type { CurrentEnrollment } from '@/src/lib/customer-plan-actions';
import { APP_ROUTES, appHref } from '@/src/lib/navigation';
import { isCustomer } from '@/src/lib/user-access';
import type { CheckoutIntent } from '@/src/types/checkout';
import type { PlanSummary, PlansIndexResponse } from '@/src/types/plans';
import { Redirect, useRouter } from 'expo-router';
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

function PlanCard({
    plan,
    colorIndex,
    currentEnrollment,
    planOptions,
    onCheckout,
    onViewDetails,
}: {
    plan: PlanSummary;
    colorIndex: number;
    currentEnrollment?: CurrentEnrollment | null;
    planOptions: { planAccess?: 'active' | 'expired' | 'none'; renewPlanId?: string };
    onCheckout: (planId: string, intent: CheckoutIntent) => void;
    onViewDetails: (planId: string) => void;
}) {
    const price = plan.selling_price_paise ?? plan.price_paise;
    const accent = chartPalette[colorIndex % chartPalette.length];
    const isCurrent = currentEnrollment?.diet_plan_id === plan.id;

    return (
        <View style={[styles.card, isCurrent && styles.cardCurrent]}>
            <View style={[styles.accentBar, { backgroundColor: accent }]} />
            <View style={styles.cardBody}>
                {isCurrent ? <Badge label="Current plan" tone="success" /> : null}
                {plan.is_featured && !isCurrent ? <Badge label="Featured" tone="warning" /> : null}
                <Pressable onPress={() => onViewDetails(plan.id)}>
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
                <PlanActions
                    compact
                    currentEnrollment={currentEnrollment}
                    onCheckout={(intent) => onCheckout(plan.id, intent)}
                    options={planOptions}
                    plan={plan}
                />
            </View>
        </View>
    );
}

export default function PlansScreen() {
    const router = useRouter();
    const { user } = useAuth();
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [featured, setFeatured] = useState<PlanSummary[]>([]);
    const [plans, setPlans] = useState<PlanSummary[]>([]);
    const [currentEnrollment, setCurrentEnrollment] = useState<CurrentEnrollment | null>(null);

    const planOptions = {
        planAccess: user?.plan_access,
        renewPlanId: user?.renew_plan_id,
    };

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
            setCurrentEnrollment(result.data.currentEnrollment ?? null);
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

    function goCheckout(planId: string, intent: CheckoutIntent) {
        router.push({
            pathname: '/(app)/plans/[id]/checkout',
            params: { id: planId, intent },
        });
    }

    const allPlans = [...featured, ...plans.filter((p) => !featured.some((f) => f.id === p.id))];

    if (!isCustomer(user)) {
        return <Redirect href={APP_ROUTES.home} />;
    }

    if (loading) {
        return (
            <View style={styles.center}>
                <ActivityIndicator size="large" color={colors.brandDark} />
            </View>
        );
    }

    return (
        <View style={styles.root}>
            <AppHeader
                subtitle={
                    currentEnrollment?.diet_plan?.name
                        ? `Current: ${currentEnrollment.diet_plan.name}`
                        : 'Programs curated by dietitians'
                }
                title="Choose your plan"
            />
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
                    <>
                        {error ? (
                            <View style={styles.errorBox}>
                                <Text style={styles.errorText}>{error}</Text>
                            </View>
                        ) : null}
                        {allPlans.length >= 2 ? (
                            <View style={styles.compareBar}>
                                <Button
                                    label="Compare plans"
                                    onPress={() => router.push(appHref('/(app)/plans/compare'))}
                                    variant="secondary"
                                />
                            </View>
                        ) : null}
                    </>
                }
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={() => loadPlans(true)} />
                }
                renderItem={({ item, index }) => (
                    <PlanCard
                        colorIndex={index}
                        currentEnrollment={currentEnrollment}
                        onCheckout={goCheckout}
                        onViewDetails={(id) => router.push(APP_ROUTES.planShow(id))}
                        plan={item}
                        planOptions={planOptions}
                    />
                )}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    root: { flex: 1, backgroundColor: colors.background },
    center: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: colors.background,
    },
    list: { padding: spacing.lg, gap: spacing.md },
    card: {
        flexDirection: 'row',
        backgroundColor: colors.card,
        borderRadius: 18,
        marginBottom: spacing.md,
        borderWidth: 1,
        borderColor: colors.border,
        overflow: 'hidden',
        ...shadow.card,
    },
    cardCurrent: { borderColor: colors.chart2, borderWidth: 2 },
    accentBar: { width: 5 },
    cardBody: { flex: 1, padding: spacing.lg, gap: spacing.sm },
    name: { fontSize: 18, fontWeight: '700', color: colors.text },
    tagline: { fontSize: 14, color: colors.textMuted, lineHeight: 20 },
    metaRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginTop: spacing.sm,
    },
    price: { fontSize: 20, fontWeight: '700', color: colors.brandDark },
    duration: { fontSize: 14, color: colors.textMuted },
    rank: { fontSize: 13, color: colors.textMuted },
    empty: { padding: spacing.lg, gap: spacing.sm },
    emptyTitle: { fontSize: 18, fontWeight: '600', color: colors.text },
    emptyBody: { fontSize: 14, color: colors.textMuted, lineHeight: 20 },
    errorBox: {
        backgroundColor: colors.errorBg,
        borderRadius: 12,
        padding: spacing.md,
        marginBottom: spacing.md,
    },
    compareBar: { marginBottom: spacing.md },
    errorText: { color: colors.error, fontSize: 14 },
});
