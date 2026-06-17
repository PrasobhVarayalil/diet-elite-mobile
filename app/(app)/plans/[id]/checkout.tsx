import { AppHeader } from '@/components/ui/AppHeader';
import { CustomerProgramGate } from '@/components/auth/CustomerProgramGate';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { colors, formatInrFromPaise, spacing } from '@/constants/theme';
import { useAuth } from '@/src/context/auth-context';
import { apiGet, apiPost } from '@/src/lib/api-client';
import { apiRoutes } from '@/src/lib/api-routes';
import type { CheckoutIntent, CheckoutShowResponse, CheckoutStoreResponse } from '@/src/types/checkout';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    View,
} from 'react-native';

const INTENTS: CheckoutIntent[] = ['buy', 'upgrade', 'renew'];

const INTENT_LABELS: Record<CheckoutIntent, string> = {
    buy: 'New plan',
    upgrade: 'Plan upgrade',
    renew: 'Plan renewal',
};

function resolveIntent(raw: string | string[] | undefined): CheckoutIntent {
    const value = Array.isArray(raw) ? raw[0] : raw;
    return INTENTS.includes(value as CheckoutIntent) ? (value as CheckoutIntent) : 'buy';
}

export default function CheckoutScreen() {
    const router = useRouter();
    const { refreshUser } = useAuth();
    const { id, intent: intentParam } = useLocalSearchParams<{ id: string; intent?: string }>();
    const intent = resolveIntent(intentParam);

    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [checkout, setCheckout] = useState<CheckoutShowResponse | null>(null);
    const [method, setMethod] = useState<'upi' | 'card' | 'netbanking'>('upi');

    const loadCheckout = useCallback(async () => {
        if (!id) {
            setError('Missing plan id.');
            setLoading(false);
            return;
        }

        setLoading(true);
        const path = `${apiRoutes.plans.checkout(id)}?intent=${intent}`;
        const result = await apiGet<CheckoutShowResponse>(path);

        if (result.ok && result.data) {
            setCheckout(result.data);
            setMethod(result.data.paymentMethods[0]?.id ?? 'upi');
            setError(null);
        } else {
            setError(result.ok ? 'Could not load checkout.' : result.message);
        }

        setLoading(false);
    }, [id, intent]);

    useEffect(() => {
        loadCheckout();
    }, [loadCheckout]);

    async function onPay() {
        if (!id || !checkout) {
            return;
        }

        setSubmitting(true);
        setError(null);

        const result = await apiPost<CheckoutStoreResponse>(apiRoutes.plans.checkout(id), {
            intent,
            method,
        });

        setSubmitting(false);

        if (!result.ok) {
            setError(result.message);
            return;
        }

        const paymentId = result.data?.payment_id;
        const razorpay = result.data?.razorpay;

        if (razorpay?.key && paymentId) {
            Alert.alert(
                'Razorpay checkout',
                'Live Razorpay requires a native build (EAS). Use demo mode locally or complete payment on the web app for now.',
            );
            return;
        }

        await refreshUser();
        Alert.alert('Success', result.message, [
            {
                text: 'OK',
                onPress: () => router.replace('/(app)'),
            },
        ]);
    }

    const summary = checkout?.summary;
    const total = summary?.total_paise ?? summary?.selling_price_paise;
    const isUpgrade = intent === 'upgrade';

    return (
        <CustomerProgramGate requireActivePlan={false}>
            <View style={styles.root}>
            <Stack.Screen options={{ headerShown: false }} />
            <AppHeader subtitle={checkout?.plan.name ?? 'Secure checkout'} title="Checkout" />
            {loading ? (
                <View style={styles.center}>
                    <ActivityIndicator size="large" color={colors.brandDark} />
                </View>
            ) : error && !checkout ? (
                <View style={styles.center}>
                    <Text style={styles.error}>{error}</Text>
                    <Button label="Retry" onPress={loadCheckout} variant="secondary" />
                </View>
            ) : checkout ? (
                <ScrollView contentContainerStyle={styles.content}>
                    <Badge label={INTENT_LABELS[intent]} tone={isUpgrade ? 'warning' : 'brand'} />
                    {checkout.plan.tagline ? (
                        <Text style={styles.tagline}>{checkout.plan.tagline}</Text>
                    ) : null}

                    {isUpgrade && summary ? (
                        <View style={styles.breakdown}>
                            <Text style={styles.sectionTitle}>Upgrade summary</Text>
                            {summary.current_plan_name ? (
                                <Row
                                    label="Current plan"
                                    value={summary.current_plan_name}
                                />
                            ) : null}
                            {summary.list_price_paise != null ? (
                                <Row label="New plan price" value={formatInrFromPaise(summary.list_price_paise)} />
                            ) : null}
                            {(summary.price_difference_paise ?? 0) > 0 ? (
                                <Row
                                    label="Price difference"
                                    value={formatInrFromPaise(summary.price_difference_paise!)}
                                />
                            ) : null}
                            {(summary.upgrade_discount_paise ?? 0) > 0 ? (
                                <Row
                                    label={`Upgrade discount (${summary.upgrade_discount_percent ?? 0}%)`}
                                    value={`−${formatInrFromPaise(summary.upgrade_discount_paise!)}`}
                                    valueStyle={styles.discount}
                                />
                            ) : null}
                            {checkout.carryOver && checkout.carryOver.days > 0 ? (
                                <Text style={styles.carryOver}>
                                    +{checkout.carryOver.days} unused days carry over
                                </Text>
                            ) : null}
                        </View>
                    ) : null}

                    <Text style={styles.total}>{formatInrFromPaise(total)}</Text>
                    {checkout.schedule ? (
                        <Text style={styles.meta}>
                            {checkout.schedule.starts_at} → {checkout.schedule.ends_at}
                        </Text>
                    ) : null}

                    <Text style={styles.sectionTitle}>Payment method</Text>
                    {checkout.paymentMethods.map((item) => (
                        <Pressable
                            key={item.id}
                            onPress={() => setMethod(item.id)}
                            style={[styles.methodCard, method === item.id && styles.methodSelected]}
                        >
                            <Text style={styles.methodLabel}>{item.label}</Text>
                            <Text style={styles.methodDesc}>{item.description}</Text>
                        </Pressable>
                    ))}

                    {!checkout.razorpay?.enabled ? (
                        <Text style={styles.demoNote}>
                            Demo checkout — payment is simulated until Razorpay keys are configured on the API.
                        </Text>
                    ) : null}

                    {error ? <Text style={styles.errorInline}>{error}</Text> : null}

                    <Button
                        label={isUpgrade ? 'Pay upgrade amount' : 'Pay now'}
                        loading={submitting}
                        onPress={onPay}
                    />
                </ScrollView>
            ) : null}
            </View>
        </CustomerProgramGate>
    );
}

function Row({
    label,
    value,
    valueStyle,
}: {
    label: string;
    value: string;
    valueStyle?: object;
}) {
    return (
        <View style={styles.row}>
            <Text style={styles.rowLabel}>{label}</Text>
            <Text style={[styles.rowValue, valueStyle]}>{value}</Text>
        </View>
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
    tagline: { fontSize: 15, color: colors.textMuted },
    breakdown: {
        backgroundColor: colors.card,
        borderRadius: 14,
        padding: spacing.md,
        borderWidth: 1,
        borderColor: colors.border,
        gap: spacing.sm,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: colors.text,
        marginTop: spacing.sm,
    },
    row: { flexDirection: 'row', justifyContent: 'space-between', gap: spacing.sm },
    rowLabel: { fontSize: 14, color: colors.textMuted, flex: 1 },
    rowValue: { fontSize: 14, fontWeight: '600', color: colors.text },
    discount: { color: colors.success },
    carryOver: { fontSize: 13, fontWeight: '600', color: colors.chart5, marginTop: 4 },
    total: { fontSize: 32, fontWeight: '700', color: colors.brandDark },
    meta: { fontSize: 14, color: colors.textMuted },
    methodCard: {
        backgroundColor: colors.card,
        borderRadius: 12,
        padding: spacing.md,
        borderWidth: 1,
        borderColor: colors.border,
        gap: 4,
    },
    methodSelected: {
        borderColor: colors.brandDark,
        backgroundColor: '#eef8ea',
    },
    methodLabel: { fontSize: 16, fontWeight: '600', color: colors.text },
    methodDesc: { fontSize: 13, color: colors.textMuted },
    demoNote: { fontSize: 13, color: colors.textMuted, lineHeight: 20 },
    error: { color: colors.error, textAlign: 'center' },
    errorInline: { color: colors.error, fontSize: 14 },
});
