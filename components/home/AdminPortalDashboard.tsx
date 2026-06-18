import { ChartCard } from '@/components/charts/ChartCard';
import { MiniBarChart } from '@/components/charts/MiniBarChart';
import { SegmentChart } from '@/components/charts/SegmentChart';
import { useAdminDashboard } from '@/components/home/use-admin-dashboard';
import { Card, SectionTitle } from '@/components/ui/Card';
import { StatCard } from '@/components/ui/StatCard';
import { BrandLoadingScreen } from '@/components/ui/BrandLoadingScreen';
import { colors, formatInrFromPaise, spacing } from '@/constants/theme';
import {
    RefreshControl,
    ScrollView,
    StyleSheet,
    Text,
    View,
} from 'react-native';

function growthHint(value: number | null | undefined): string | undefined {
    if (value == null) {
        return undefined;
    }
    const sign = value >= 0 ? '+' : '';
    return `${sign}${value}% vs last month`;
}

/** Portal analytics — revenue, charts, and platform-wide metrics. */
export function AdminPortalDashboard() {
    const { data, error, loading, refreshing, reload } = useAdminDashboard();

    if (loading) {
        return <BrandLoadingScreen message="Loading analytics…" />;
    }

    const stats = data?.stats ?? {};

    return (
        <ScrollView
            contentContainerStyle={styles.content}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => reload(true)} />}
            style={styles.flex}
        >
            {error ? <Text style={styles.error}>{error}</Text> : null}

            <View style={styles.statsRow}>
                <StatCard
                    colorIndex={0}
                    hint="Registered"
                    label="Customers"
                    value={String(stats.customers ?? 0)}
                />
                <StatCard
                    colorIndex={3}
                    hint={growthHint(data?.revenueGrowth) ?? 'This month'}
                    label="Revenue"
                    value={formatInrFromPaise(stats.revenueThisMonthPaise ?? 0)}
                />
                <StatCard
                    colorIndex={1}
                    hint={growthHint(data?.enrollmentGrowth) ?? 'Active plans'}
                    label="Enrollments"
                    value={String(stats.activeEnrollments ?? 0)}
                />
                <StatCard
                    colorIndex={4}
                    hint="All time"
                    label="Total revenue"
                    value={formatInrFromPaise(stats.revenuePaise ?? 0)}
                />
            </View>

            <View style={styles.statsRow}>
                <StatCard colorIndex={2} label="Dietitians" value={String(stats.dietitians ?? 0)} />
                <StatCard colorIndex={5} label="Advisors" value={String(stats.advisors ?? 0)} />
                <StatCard colorIndex={0} label="Paying customers" value={String(stats.payingCustomers ?? 0)} />
                <StatCard
                    colorIndex={3}
                    hint="Average order"
                    label="AOV"
                    value={formatInrFromPaise(stats.avgOrderPaise ?? 0)}
                />
            </View>

            {data?.monthlyMetrics && data.monthlyMetrics.length > 0 ? (
                <ChartCard colorIndex={0} subtitle="Last 6 months" title="Revenue trend">
                    <MiniBarChart
                        colorIndex={0}
                        data={data.monthlyMetrics.map((row) => ({ label: row.month, value: row.revenue }))}
                        valueSuffix=" INR"
                    />
                </ChartCard>
            ) : null}

            {data?.monthlyMetrics && data.monthlyMetrics.length > 0 ? (
                <ChartCard colorIndex={1} subtitle="New sign-ups" title="Enrollment trend">
                    <MiniBarChart
                        colorIndex={1}
                        data={data.monthlyMetrics.map((row) => ({ label: row.month, value: row.enrollments }))}
                    />
                </ChartCard>
            ) : null}

            {data?.monthlyOverview && data.monthlyOverview.some((r) => r.bookings > 0) ? (
                <ChartCard colorIndex={2} subtitle="Monthly volume" title="Bookings activity">
                    <MiniBarChart
                        colorIndex={2}
                        data={data.monthlyOverview.map((row) => ({ label: row.month, value: row.bookings }))}
                    />
                </ChartCard>
            ) : null}

            {data?.monthlyOverview && data.monthlyOverview.some((r) => r.payments > 0) ? (
                <ChartCard colorIndex={0} subtitle="Successful payments" title="Payment volume">
                    <MiniBarChart
                        colorIndex={0}
                        data={data.monthlyOverview.map((row) => ({ label: row.month, value: row.payments }))}
                    />
                </ChartCard>
            ) : null}

            {data?.userMix && data.userMix.length > 0 ? (
                <ChartCard colorIndex={4} subtitle="Active users by role" title="User mix">
                    <SegmentChart
                        data={data.userMix.map((row) => ({
                            name: row.name,
                            value: row.value,
                            fill: row.fill,
                        }))}
                    />
                </ChartCard>
            ) : null}

            {data?.customerSegmentChart && data.customerSegmentChart.length > 0 ? (
                <ChartCard colorIndex={4} subtitle="Customer lifecycle" title="Plan segments">
                    <SegmentChart
                        data={data.customerSegmentChart.map((row) => ({
                            name: row.name,
                            value: row.value,
                            fill: row.fill,
                        }))}
                    />
                </ChartCard>
            ) : null}

            {data?.paymentsByStatus && data.paymentsByStatus.length > 0 ? (
                <ChartCard colorIndex={0} subtitle="Checkout pipeline" title="Payments by status">
                    <SegmentChart
                        data={data.paymentsByStatus.map((row) => ({
                            name: row.status,
                            value: row.count,
                            fill: row.fill,
                        }))}
                    />
                </ChartCard>
            ) : null}

            {data?.enrollmentsByStatus && data.enrollmentsByStatus.length > 0 ? (
                <ChartCard colorIndex={1} subtitle="All enrollments" title="Enrollment status">
                    <SegmentChart
                        data={data.enrollmentsByStatus.map((row) => ({
                            name: row.status,
                            value: row.count,
                        }))}
                    />
                </ChartCard>
            ) : null}

            {data?.bookingsByStatus && data.bookingsByStatus.length > 0 ? (
                <ChartCard colorIndex={2} subtitle="All appointments" title="Bookings by status">
                    <SegmentChart
                        data={data.bookingsByStatus.map((row) => ({
                            name: row.status,
                            value: row.count,
                        }))}
                    />
                </ChartCard>
            ) : null}

            {data?.topDietitians && data.topDietitians.length > 0 ? (
                <Card>
                    <SectionTitle>Top dietitians this month</SectionTitle>
                    {data.topDietitians.slice(0, 5).map((row) => (
                        <View key={row.id} style={styles.leaderRow}>
                            <Text style={styles.leaderName}>{row.name}</Text>
                            <Text style={styles.leaderMeta}>
                                {row.completed_month ?? 0} completed · {row.upcoming_count ?? 0} upcoming
                                {row.rating != null ? ` · ★ ${row.rating.toFixed(1)}` : ''}
                            </Text>
                        </View>
                    ))}
                </Card>
            ) : null}

            {data?.topPlans && data.topPlans.length > 0 ? (
                <Card>
                    <SectionTitle>Top plans</SectionTitle>
                    {data.topPlans.map((row) => (
                        <View key={row.id} style={styles.leaderRow}>
                            <Text style={styles.leaderName}>{row.name}</Text>
                            <Text style={styles.leaderMeta}>
                                {row.enrollments_count ?? 0} enrollments ·{' '}
                                {formatInrFromPaise(row.price_paise ?? 0)}
                            </Text>
                        </View>
                    ))}
                </Card>
            ) : null}
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    flex: { flex: 1 },
    center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
    content: { padding: spacing.lg, gap: spacing.md, paddingBottom: spacing.xl },
    statsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
    error: { color: colors.error },
    leaderRow: {
        marginBottom: spacing.sm,
        paddingBottom: spacing.sm,
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderBottomColor: colors.border,
    },
    leaderName: { fontSize: 15, fontWeight: '700', color: colors.text },
    leaderMeta: { fontSize: 13, color: colors.textMuted, marginTop: 2 },
});
