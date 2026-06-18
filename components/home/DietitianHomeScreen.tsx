import { Badge } from '@/components/ui/Badge';
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
import { APP_ROUTES, appHref } from '@/src/lib/navigation';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';

type DietitianDashboard = {
    dietitian?: { name: string; title?: string | null; rating?: number | null } | null;
    stats?: {
        todayCount?: number;
        upcomingCount?: number;
        pendingCount?: number;
        completedThisMonth?: number;
    };
    upcomingBookings?: Array<{
        id: string;
        scheduled_at: string;
        user?: { name: string };
    }>;
    pendingBookings?: Array<{
        id: string;
        scheduled_at: string;
        user?: { name: string } | null;
    }>;
    weeklyAppointments?: Array<{ day: string; appointments: number }>;
    monthlyConsultations?: Array<{ month: string; completed: number; cancelled: number }>;
    bookingsByStatus?: Array<{ status: string; count: number }>;
};

export function DietitianHomeScreen() {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [data, setData] = useState<DietitianDashboard | null>(null);
    const [error, setError] = useState<string | null>(null);

    const load = useCallback(async (isRefresh = false) => {
        if (isRefresh) {
            setRefreshing(true);
        } else {
            setLoading(true);
        }

        const result = await apiGet<DietitianDashboard>(apiRoutes.dietitian.dashboard);

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
    const nextUpcoming = data?.upcomingBookings?.[0];

    return (
        <ScrollView
            contentContainerStyle={styles.content}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => load(true)} />}
            style={styles.flex}
        >
            {error ? <Text style={styles.error}>{error}</Text> : null}

            <View style={styles.statsRow}>
                <StatCard colorIndex={3} hint="Today" label="Sessions" value={String(stats.todayCount ?? 0)} />
                <StatCard colorIndex={2} hint="Confirmed" label="Upcoming" value={String(stats.upcomingCount ?? 0)} />
                <StatCard colorIndex={5} hint="Needs action" label="Pending" value={String(stats.pendingCount ?? 0)} />
                <StatCard
                    colorIndex={1}
                    hint="This month"
                    label="Completed"
                    value={String(stats.completedThisMonth ?? 0)}
                />
            </View>

            {data?.weeklyAppointments && data.weeklyAppointments.length > 0 ? (
                <ChartCard colorIndex={3} subtitle="Last 7 days" title="Weekly schedule">
                    <MiniBarChart
                        colorIndex={3}
                        data={data.weeklyAppointments.map((row) => ({
                            label: row.day,
                            value: row.appointments,
                        }))}
                    />
                </ChartCard>
            ) : null}

            {data?.monthlyConsultations && data.monthlyConsultations.some((r) => r.completed > 0) ? (
                <ChartCard colorIndex={1} subtitle="Completed sessions" title="Monthly consultations">
                    <MiniBarChart
                        colorIndex={1}
                        data={data.monthlyConsultations.map((row) => ({
                            label: row.month,
                            value: row.completed,
                        }))}
                    />
                </ChartCard>
            ) : null}

            {data?.bookingsByStatus && data.bookingsByStatus.length > 0 ? (
                <ChartCard colorIndex={2} subtitle="All time" title="Appointments by status">
                    <SegmentChart
                        data={data.bookingsByStatus.map((row) => ({
                            name: row.status,
                            value: row.count,
                        }))}
                    />
                </ChartCard>
            ) : null}

            {nextUpcoming ? (
                <Card>
                    <SectionTitle>Next appointment</SectionTitle>
                    <Text style={styles.value}>{nextUpcoming.user?.name ?? 'Client'}</Text>
                    <Text style={styles.body}>{formatDateTime(nextUpcoming.scheduled_at)}</Text>
                </Card>
            ) : null}

            {(data?.pendingBookings?.length ?? 0) > 0 ? (
                <Card>
                    <SectionTitle>Pending approval</SectionTitle>
                    {data!.pendingBookings!.slice(0, 3).map((booking) => (
                        <View key={booking.id} style={styles.row}>
                            <Text style={styles.value}>{booking.user?.name ?? 'Client'}</Text>
                            <Text style={styles.body}>{formatDateTime(booking.scheduled_at)}</Text>
                        </View>
                    ))}
                    <MenuRow
                        icon="calendar-outline"
                        label="View all appointments"
                        onPress={() => router.push(`${APP_ROUTES.bookings}?filter=pending` as never)}
                    />
                </Card>
            ) : null}

            <Card>
                <SectionTitle>Quick actions</SectionTitle>
                <FeatureGrid>
                    <FeatureTile
                        colorIndex={2}
                        icon="time-outline"
                        label="My schedule"
                        onPress={() => router.push(appHref('/(app)/schedule'))}
                    />
                    <FeatureTile
                        colorIndex={5}
                        icon="person-add-outline"
                        label="Book client"
                        onPress={() => router.push(appHref('/(app)/bookings/staff-create'))}
                    />
                    <FeatureTile
                        colorIndex={3}
                        icon="calendar-outline"
                        label="Appointments"
                        onPress={() => router.push(APP_ROUTES.bookings)}
                    />
                    <FeatureTile
                        colorIndex={4}
                        icon="people-outline"
                        label="Clients"
                        onPress={() => router.push(appHref('/(app)/clients'))}
                    />
                    <FeatureTile
                        colorIndex={4}
                        icon="chatbubbles-outline"
                        label="Messages"
                        onPress={() => router.push(APP_ROUTES.messages)}
                    />
                    <FeatureTile
                        colorIndex={1}
                        icon="notifications-outline"
                        label="Alerts"
                        onPress={() => router.push(APP_ROUTES.notifications)}
                    />
                </FeatureGrid>
            </Card>

            {data?.dietitian?.rating != null ? (
                <Card>
                    <Badge label={`Rating ${data.dietitian.rating.toFixed(1)}`} tone="success" />
                    {data.dietitian.title ? <Text style={styles.body}>{data.dietitian.title}</Text> : null}
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
    value: { fontSize: 18, fontWeight: '700', color: colors.text },
    error: { color: colors.error },
});
