import { Button } from '@/components/ui/Button';
import { colors, formatInrFromPaise, spacing } from '@/constants/theme';
import { apiGet } from '@/src/lib/api-client';
import { apiRoutes } from '@/src/lib/api-routes';
import type { PlanShowResponse } from '@/src/types/plans';
import { Stack, useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native';

export default function PlanDetailScreen() {
    const { id } = useLocalSearchParams<{ id: string }>();
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [data, setData] = useState<PlanShowResponse | null>(null);

    const loadPlan = useCallback(async () => {
        if (!id) {
            setError('Missing plan id.');
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

    const plan = data?.plan;
    const price = plan?.selling_price_paise ?? plan?.price_paise;

    return (
        <>
            <Stack.Screen options={{ title: plan?.name ?? 'Plan' }} />
            {loading ? (
                <View style={styles.center}>
                    <ActivityIndicator size="large" color={colors.brandDark} />
                </View>
            ) : error ? (
                <View style={styles.center}>
                    <Text style={styles.error}>{error}</Text>
                    <Button label="Retry" onPress={loadPlan} variant="secondary" />
                </View>
            ) : plan ? (
                <ScrollView contentContainerStyle={styles.content}>
                    {data?.isCurrentPlan ? <Text style={styles.currentBadge}>Your current plan</Text> : null}
                    {plan.tagline ? <Text style={styles.tagline}>{plan.tagline}</Text> : null}
                    <Text style={styles.price}>{formatInrFromPaise(price)}</Text>
                    {plan.duration_weeks ? (
                        <Text style={styles.meta}>{plan.duration_weeks} weeks program</Text>
                    ) : null}
                    {plan.category?.name ? (
                        <Text style={styles.meta}>Category: {plan.category.name}</Text>
                    ) : null}
                    {plan.plan_rank?.rank_name ? (
                        <Text style={styles.meta}>Rank: {plan.plan_rank.rank_name}</Text>
                    ) : null}
                    {plan.description ? (
                        <Text style={styles.description}>{plan.description}</Text>
                    ) : null}
                    <Button
                        disabled={data?.isCurrentPlan === true}
                        label={data?.isCurrentPlan ? 'Already enrolled' : 'Checkout (coming soon)'}
                        onPress={() => undefined}
                    />
                </ScrollView>
            ) : null}
        </>
    );
}

const styles = StyleSheet.create({
    center: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        padding: spacing.lg,
        backgroundColor: colors.background,
        gap: spacing.md,
    },
    content: {
        padding: spacing.lg,
        gap: spacing.md,
        backgroundColor: colors.background,
    },
    currentBadge: {
        alignSelf: 'flex-start',
        backgroundColor: colors.brandLight,
        color: colors.brandDark,
        fontWeight: '700',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 999,
        overflow: 'hidden',
    },
    tagline: {
        fontSize: 16,
        color: colors.textMuted,
        lineHeight: 24,
    },
    price: {
        fontSize: 32,
        fontWeight: '700',
        color: colors.brandDark,
    },
    meta: {
        fontSize: 14,
        color: colors.textMuted,
    },
    description: {
        fontSize: 15,
        lineHeight: 24,
        color: colors.text,
        marginVertical: spacing.sm,
    },
    error: {
        color: colors.error,
        fontSize: 15,
        textAlign: 'center',
    },
});
