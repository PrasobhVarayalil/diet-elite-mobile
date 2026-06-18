import { BookingStatusBadge } from '@/components/bookings/BookingStatusBadge';
import { Card, SectionTitle } from '@/components/ui/Card';
import { MenuRow } from '@/components/ui/MenuRow';
import { StatCard } from '@/components/ui/StatCard';
import { colors, formatDateTime, spacing } from '@/constants/theme';
import { useAdminDashboard } from '@/components/home/use-admin-dashboard';
import { appHref } from '@/src/lib/navigation';
import { useRouter } from 'expo-router';
import type { ReactNode } from 'react';
import {
    ActivityIndicator,
    Pressable,
    RefreshControl,
    ScrollView,
    StyleSheet,
    Text,
    View,
} from 'react-native';

/** Home tab — operational snapshot: what needs attention today. */
export function AdminHomeScreen() {
    const router = useRouter();
    const { data, error, loading, refreshing, reload } = useAdminDashboard();

    if (loading) {
        return (
            <View style={styles.center}>
                <ActivityIndicator color={colors.brandDark} size="large" />
            </View>
        );
    }

    const stats = data?.stats ?? {};
    const recentBookings = data?.recentBookings ?? [];
    const recentEnrollments = data?.recentEnrollments ?? [];
    const needsAttention =
        (stats.pendingApprovals ?? 0) > 0 ||
        (stats.pendingEnrollments ?? 0) > 0 ||
        (stats.pendingPayments ?? 0) > 0;

    return (
        <ScrollView
            contentContainerStyle={styles.content}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => reload(true)} />}
            style={styles.flex}
        >
            {error ? <Text style={styles.error}>{error}</Text> : null}

            {needsAttention ? (
                <Card tone="accent">
                    <SectionTitle>Needs your attention</SectionTitle>
                    <Text style={styles.alertBody}>
                        {(stats.pendingApprovals ?? 0) > 0
                            ? `${stats.pendingApprovals} booking${stats.pendingApprovals === 1 ? '' : 's'} awaiting approval. `
                            : ''}
                        {(stats.pendingEnrollments ?? 0) > 0
                            ? `${stats.pendingEnrollments} pending enrollment${stats.pendingEnrollments === 1 ? '' : 's'}. `
                            : ''}
                        {(stats.pendingPayments ?? 0) > 0
                            ? `${stats.pendingPayments} unpaid checkout${stats.pendingPayments === 1 ? '' : 's'}.`
                            : ''}
                    </Text>
                </Card>
            ) : null}

            <View style={styles.statsRow}>
                <StatCard
                    colorIndex={2}
                    hint="Approve or reject"
                    label="Pending bookings"
                    value={String(stats.pendingApprovals ?? 0)}
                />
                <StatCard
                    colorIndex={3}
                    hint="Confirmed ahead"
                    label="Upcoming"
                    value={String(stats.upcomingBookings ?? 0)}
                />
                <StatCard
                    colorIndex={5}
                    hint="Awaiting payment"
                    label="Pending enrollments"
                    value={String(stats.pendingEnrollments ?? 0)}
                />
                <StatCard
                    colorIndex={1}
                    hint="This month"
                    label="New customers"
                    value={String(stats.newCustomersThisMonth ?? 0)}
                />
            </View>

            <Card>
                <SectionTitle>Quick actions</SectionTitle>
                <MenuRow
                    icon="grid-outline"
                    label="Admin portal"
                    onPress={() => router.push(appHref('/(app)/admin'))}
                    subtitle="Plans, users, schedules, audit log"
                />
                <MenuRow
                    icon="calendar-outline"
                    label="Bookings queue"
                    onPress={() => router.push(appHref('/(app)/admin/bookings'))}
                />
                <MenuRow
                    icon="people-outline"
                    label="Users"
                    onPress={() => router.push(appHref('/(app)/admin/users'))}
                />
                <MenuRow
                    icon="time-outline"
                    label="Dietitian slots"
                    onPress={() => router.push(appHref('/(app)/admin/schedules'))}
                    subtitle="Add shifts for booking availability"
                />
                <MenuRow
                    icon="speedometer-outline"
                    label="Analytics dashboard"
                    onPress={() => router.push(appHref('/(app)/admin/dashboard'))}
                    subtitle="Revenue, charts & platform metrics"
                />
                <MenuRow icon="chatbubbles-outline" label="Messages" onPress={() => router.push(appHref('/(app)/messages'))} />
            </Card>

            {recentBookings.length > 0 ? (
                <Card>
                    <SectionTitle>Recent appointments</SectionTitle>
                    {recentBookings.slice(0, 5).map((row) => (
                        <PressableRow
                            key={row.id}
                            onPress={() => router.push(appHref(`/(app)/admin/bookings/${row.id}`))}
                        >
                            <Text style={styles.rowTitle}>{row.user?.name ?? 'Client'}</Text>
                            <Text style={styles.rowMeta}>
                                {row.scheduled_at ? formatDateTime(row.scheduled_at) : '—'} ·{' '}
                                {row.dietitian?.name ?? 'Dietitian'}
                            </Text>
                            {row.status ? (
                                <View style={styles.badgeWrap}>
                                    <BookingStatusBadge status={row.status} />
                                </View>
                            ) : null}
                        </PressableRow>
                    ))}
                    <MenuRow
                        icon="calendar-outline"
                        label="View all bookings"
                        onPress={() => router.push(appHref('/(app)/admin/bookings'))}
                    />
                </Card>
            ) : null}

            {recentEnrollments.length > 0 ? (
                <Card>
                    <SectionTitle>Recent enrollments</SectionTitle>
                    {recentEnrollments.slice(0, 5).map((row) => {
                        const planName = row.diet_plan?.name ?? row.dietPlan?.name ?? 'Plan';
                        return (
                            <View key={row.id} style={styles.rowBlock}>
                                <Text style={styles.rowTitle}>{row.user?.name ?? 'Customer'}</Text>
                                <Text style={styles.rowMeta}>
                                    {planName}
                                    {row.status ? ` · ${row.status.replace(/_/g, ' ')}` : ''}
                                </Text>
                            </View>
                        );
                    })}
                </Card>
            ) : null}
        </ScrollView>
    );
}

function PressableRow({
    children,
    onPress,
}: {
    children: ReactNode;
    onPress: () => void;
}) {
    return (
        <Pressable onPress={onPress} style={styles.rowBlock}>
            {children}
        </Pressable>
    );
}

const styles = StyleSheet.create({
    flex: { flex: 1 },
    center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
    content: { padding: spacing.lg, gap: spacing.md, paddingBottom: spacing.xl },
    statsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
    error: { color: colors.error },
    alertBody: { fontSize: 14, color: colors.textMuted, lineHeight: 20 },
    rowBlock: { marginBottom: spacing.sm, paddingBottom: spacing.sm, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border },
    rowTitle: { fontSize: 15, fontWeight: '700', color: colors.text },
    rowMeta: { fontSize: 13, color: colors.textMuted, marginTop: 2, lineHeight: 18 },
    badgeWrap: { marginTop: spacing.xs, alignSelf: 'flex-start' },
});
