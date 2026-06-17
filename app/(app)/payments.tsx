import { AppHeader } from '@/components/ui/AppHeader';
import { CustomerProgramGate } from '@/components/auth/CustomerProgramGate';
import { Badge } from '@/components/ui/Badge';
import { colors, formatDateTime, formatInrFromPaise, shadow, spacing } from '@/constants/theme';
import { apiGet } from '@/src/lib/api-client';
import { apiRoutes } from '@/src/lib/api-routes';
import type { PaymentListItem, PaymentsIndexResponse } from '@/src/types/checkout';
import { useCallback, useEffect, useState } from 'react';
import {
    ActivityIndicator,
    FlatList,
    RefreshControl,
    StyleSheet,
    Text,
    View,
} from 'react-native';

function PaymentRow({ item }: { item: PaymentListItem }) {
    return (
        <View style={styles.card}>
            <View style={styles.row}>
                <Text style={styles.amount}>{formatInrFromPaise(item.amount_paise)}</Text>
                <Text style={styles.status}>{item.status_label ?? item.status}</Text>
            </View>
            {item.description ? <Text style={styles.desc}>{item.description}</Text> : null}
            <Text style={styles.date}>{formatDateTime(item.paid_at ?? item.created_at)}</Text>
        </View>
    );
}

export default function PaymentsScreen() {
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [payments, setPayments] = useState<PaymentListItem[]>([]);
    const [summary, setSummary] = useState<PaymentsIndexResponse['summary']>();

    const load = useCallback(async (isRefresh = false) => {
        if (isRefresh) {
            setRefreshing(true);
        } else {
            setLoading(true);
        }

        const result = await apiGet<PaymentsIndexResponse>(apiRoutes.payments.index);

        if (result.ok && result.data) {
            setPayments(result.data.payments ?? []);
            setSummary(result.data.summary);
            setError(null);
        } else {
            setError(result.ok ? 'Could not load payments.' : result.message);
        }

        setLoading(false);
        setRefreshing(false);
    }, []);

    useEffect(() => {
        load();
    }, [load]);

    if (loading) {
        return (
            <View style={styles.center}>
                <ActivityIndicator size="large" color={colors.brandDark} />
            </View>
        );
    }

    return (
        <CustomerProgramGate requireActivePlan={false}>
            <View style={styles.root}>
            <AppHeader subtitle="Invoices and receipts" title="Payments" />
            <FlatList
                contentContainerStyle={styles.list}
                data={payments}
                keyExtractor={(item) => item.id}
                ListEmptyComponent={
                    <View style={styles.empty}>
                        <Text style={styles.emptyTitle}>No payments yet</Text>
                        <Text style={styles.emptyBody}>Enroll in a plan from the Plans tab.</Text>
                    </View>
                }
                ListHeaderComponent={
                    <View style={styles.header}>
                        {summary ? (
                            <View style={styles.summaryCard}>
                                <Text style={styles.summaryLabel}>Total spent</Text>
                                <Text style={styles.summaryValue}>
                                    {formatInrFromPaise(summary.total_spent_paise)}
                                </Text>
                                <Text style={styles.summaryMeta}>
                                    {summary.successful_count} successful of {summary.payment_count}
                                </Text>
                            </View>
                        ) : null}
                        {error ? <Text style={styles.error}>{error}</Text> : null}
                    </View>
                }
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => load(true)} />}
                renderItem={({ item }) => <PaymentRow item={item} />}
            />
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
        backgroundColor: colors.background,
    },
    list: {
        padding: spacing.lg,
    },
    header: {
        marginBottom: spacing.md,
        gap: spacing.sm,
    },
    summaryCard: {
        backgroundColor: colors.card,
        borderRadius: 18,
        padding: spacing.lg,
        borderWidth: 1,
        borderColor: colors.border,
        gap: spacing.xs,
        ...shadow.card,
    },
    summaryLabel: {
        fontSize: 13,
        color: colors.textMuted,
        fontWeight: '600',
        textTransform: 'uppercase',
    },
    summaryValue: {
        fontSize: 28,
        fontWeight: '700',
        color: colors.brandDark,
    },
    summaryMeta: {
        fontSize: 14,
        color: colors.textMuted,
    },
    card: {
        backgroundColor: colors.card,
        borderRadius: 12,
        padding: spacing.md,
        marginBottom: spacing.sm,
        borderWidth: 1,
        borderColor: colors.border,
        gap: 4,
    },
    row: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    amount: {
        fontSize: 18,
        fontWeight: '700',
        color: colors.text,
    },
    status: {
        fontSize: 13,
        fontWeight: '600',
        color: colors.brandDark,
    },
    desc: {
        fontSize: 14,
        color: colors.textMuted,
    },
    date: {
        fontSize: 12,
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
    },
    error: {
        color: colors.error,
        fontSize: 14,
    },
});
