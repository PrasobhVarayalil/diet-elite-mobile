import { ChartCard } from '@/components/charts/ChartCard';
import { MiniBarChart } from '@/components/charts/MiniBarChart';
import { SegmentChart } from '@/components/charts/SegmentChart';
import { Card, SectionTitle } from '@/components/ui/Card';
import { FeatureGrid, FeatureTile } from '@/components/ui/FeatureTile';
import { MenuRow } from '@/components/ui/MenuRow';
import { StatCard } from '@/components/ui/StatCard';
import { colors, formatDateTime, spacing } from '@/constants/theme';
import { apiGet } from '@/src/lib/api-client';
import { apiRoutes } from '@/src/lib/api-routes';
import { appHref } from '@/src/lib/navigation';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';

type AdvisorDashboard = {
    stats?: {
        totalEnrollments?: number;
        activeEnrollments?: number;
        pendingEnrollments?: number;
        totalBookings?: number;
        thisMonthEnrollments?: number;
    };
    recentEnrollments?: Array<{
        id: string;
        status: string;
        user?: { name: string };
        dietPlan?: { name: string };
    }>;
    recentBookings?: Array<{
        id: string;
        scheduled_at: string;
        user?: { name: string };
        dietitian?: { name: string };
    }>;
    monthlyActivity?: Array<{ month: string; enrollments: number; bookings: number }>;
    enrollmentsByStatus?: Array<{ status: string; count: number }>;
};

export function AdvisorHomeScreen() {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [data, setData] = useState<AdvisorDashboard | null>(null);
    const [error, setError] = useState<string | null>(null);

    const load = useCallback(async (isRefresh = false) => {
        if (isRefresh) {
            setRefreshing(true);
        } else {
            setLoading(true);
        }

        const result = await apiGet<AdvisorDashboard>(apiRoutes.advisor.dashboard);

        if (result.ok && result.data) {
            setData(result.data);
            setError(null);
        } else {
            setError(result.ok ? 'Could not load dashboard.' : result.message);
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
                <ActivityIndicator color={colors.brandDark} size="large" />
            </View>
        );
    }

    const stats = data?.stats ?? {};

    return (
        <ScrollView
            contentContainerStyle={styles.content}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => load(true)} />}
            style={styles.flex}
        >
            {error ? <Text style={styles.error}>{error}</Text> : null}

            <View style={styles.statsRow}>
                <StatCard
                    colorIndex={2}
                    hint={`${stats.thisMonthEnrollments ?? 0} this month`}
                    label="Enrollments"
                    value={String(stats.totalEnrollments ?? 0)}
                />
                <StatCard colorIndex={1} label="Active" value={String(stats.activeEnrollments ?? 0)} />
                <StatCard colorIndex={5} label="Pending" value={String(stats.pendingEnrollments ?? 0)} />
                <StatCard colorIndex={3} label="First consults" value={String(stats.totalBookings ?? 0)} />
            </View>

            {data?.monthlyActivity && data.monthlyActivity.length > 0 ? (
                <ChartCard colorIndex={2} subtitle="New sign-ups" title="Enrollment activity">
                    <MiniBarChart
                        colorIndex={2}
                        data={data.monthlyActivity.map((row) => ({
                            label: row.month,
                            value: row.enrollments,
                        }))}
                    />
                </ChartCard>
            ) : null}

            {data?.monthlyActivity && data.monthlyActivity.some((r) => r.bookings > 0) ? (
                <ChartCard colorIndex={3} subtitle="First consultations" title="Booking activity">
                    <MiniBarChart
                        colorIndex={3}
                        data={data.monthlyActivity.map((row) => ({
                            label: row.month,
                            value: row.bookings,
                        }))}
                    />
                </ChartCard>
            ) : null}

            {data?.enrollmentsByStatus && data.enrollmentsByStatus.length > 0 ? (
                <ChartCard colorIndex={1} subtitle="Pipeline breakdown" title="Enrollments by status">
                    <SegmentChart
                        data={data.enrollmentsByStatus.map((row) => ({
                            name: row.status,
                            value: row.count,
                        }))}
                    />
                </ChartCard>
            ) : null}

            <Card>
                <SectionTitle>Quick actions</SectionTitle>
                <FeatureGrid>
                    <FeatureTile
                        colorIndex={2}
                        icon="person-add-outline"
                        label="New enrollment"
                        onPress={() => router.push(appHref('/(app)/advisor/enrollments/create'))}
                    />
                    <FeatureTile
                        colorIndex={3}
                        icon="calendar-outline"
                        label="Book consult"
                        onPress={() => router.push(appHref('/(app)/advisor/bookings/create'))}
                    />
                    <FeatureTile
                        colorIndex={4}
                        icon="list-outline"
                        label="Enrollments"
                        onPress={() => router.push(appHref('/(app)/advisor/enrollments'))}
                    />
                </FeatureGrid>
            </Card>

            {(data?.recentEnrollments?.length ?? 0) > 0 ? (
                <Card>
                    <SectionTitle>Recent enrollments</SectionTitle>
                    {data!.recentEnrollments!.slice(0, 3).map((row) => (
                        <View key={row.id} style={styles.row}>
                            <Text style={styles.value}>{row.user?.name ?? 'Customer'}</Text>
                            <Text style={styles.body}>
                                {row.dietPlan?.name ?? 'Plan'} · {row.status.replace(/_/g, ' ')}
                            </Text>
                        </View>
                    ))}
                    <MenuRow
                        icon="list-outline"
                        label="View all enrollments"
                        onPress={() => router.push(appHref('/(app)/advisor/enrollments'))}
                    />
                </Card>
            ) : null}

            {(data?.recentBookings?.length ?? 0) > 0 ? (
                <Card>
                    <SectionTitle>Recent first consults</SectionTitle>
                    {data!.recentBookings!.slice(0, 3).map((row) => (
                        <View key={row.id} style={styles.row}>
                            <Text style={styles.value}>{row.user?.name ?? 'Customer'}</Text>
                            <Text style={styles.body}>
                                {formatDateTime(row.scheduled_at)} · {row.dietitian?.name ?? 'Dietitian'}
                            </Text>
                        </View>
                    ))}
                    <MenuRow
                        icon="calendar-outline"
                        label="View all first consults"
                        onPress={() => router.push(appHref('/(app)/bookings'))}
                    />
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
    row: { marginBottom: spacing.sm },
    body: { fontSize: 15, color: colors.textMuted, lineHeight: 22 },
    value: { fontSize: 16, fontWeight: '700', color: colors.text },
    error: { color: colors.error },
});
