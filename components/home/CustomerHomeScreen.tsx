import { AppHeader } from '@/components/ui/AppHeader';
import { BrandLoadingScreen } from '@/components/ui/BrandLoadingScreen';
import { BookingStatusBadge } from '@/components/bookings/BookingStatusBadge';
import { ChartCard } from '@/components/charts/ChartCard';
import { MiniBarChart } from '@/components/charts/MiniBarChart';
import { ProgressArc } from '@/components/charts/ProgressArc';
import { Badge } from '@/components/ui/Badge';
import { Card, SectionTitle } from '@/components/ui/Card';
import { FeatureGrid, FeatureTile } from '@/components/ui/FeatureTile';
import { MenuRow } from '@/components/ui/MenuRow';
import { StatCard } from '@/components/ui/StatCard';
import { colors, formatDateTime, formatInrFromPaise, spacing } from '@/constants/theme';
import { useAuth } from '@/src/context/auth-context';
import { apiGet } from '@/src/lib/api-client';
import { apiRoutes } from '@/src/lib/api-routes';
import { APP_ROUTES, PLANS_LIST_HREF } from '@/src/lib/navigation';
import { customerCanUseMessenger, customerHasActivePlan } from '@/src/lib/role-nav';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import {
    RefreshControl,
    ScrollView,
    StyleSheet,
    Text,
    View,
} from 'react-native';

type DashboardData = {
    activeEnrollment?: Record<string, unknown> | null;
    upcomingBooking?: {
        scheduled_at: string;
        dietitian?: { name: string };
        status: string;
    } | null;
    recentPayments?: Array<{ amount_paise: number; status_label?: string }>;
    healthProfileComplete?: boolean;
    renewal?: { days_until_expiry?: number | null; in_window?: boolean };
    todaysMeals?: Array<{ meal_type?: string; title?: string }>;
    weightTrend?: Array<{ date: string; weight: number }>;
    paymentTrend?: Array<{ month: string; amount: number }>;
    planProgress?: { completed: number; remaining: number } | null;
};

function greeting(): string {
    const hour = new Date().getHours();
    if (hour < 12) {
        return 'Good morning';
    }
    if (hour < 17) {
        return 'Good afternoon';
    }
    return 'Good evening';
}

export default function CustomerHomeScreen() {
    const router = useRouter();
    const { user } = useAuth();
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [data, setData] = useState<DashboardData | null>(null);
    const [error, setError] = useState<string | null>(null);
    const hasActivePlan = customerHasActivePlan(user);

    const load = useCallback(async (isRefresh = false) => {
        if (isRefresh) {
            setRefreshing(true);
        } else {
            setLoading(true);
        }

        if (hasActivePlan) {
            const result = await apiGet<DashboardData>(apiRoutes.dashboard);
            if (result.ok && result.data) {
                setData(result.data);
                setError(null);
            } else if (!result.ok) {
                setError(result.message);
            }
        } else {
            setData(null);
            setError(null);
        }

        setLoading(false);
        setRefreshing(false);
    }, [hasActivePlan]);

    useEffect(() => {
        load();
    }, [load]);

    const enrollment = data?.activeEnrollment as { diet_plan?: { name?: string }; ends_at?: string } | null;
    const planName = enrollment?.diet_plan?.name ?? 'No active plan';
    const firstName = user?.name?.split(' ')[0] ?? 'there';

    return (
        <View style={styles.root}>
            <AppHeader
                subtitle={hasActivePlan ? planName : 'Start with a plan tailored to you'}
                title={`${greeting()}, ${firstName}`}
            />
            {loading ? (
                <BrandLoadingScreen message="Loading your dashboard…" />
            ) : (
                <ScrollView
                    contentContainerStyle={styles.content}
                    refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => load(true)} />}
                >
                    {error ? <Text style={styles.error}>{error}</Text> : null}

                    <View style={styles.statsRow}>
                        <StatCard
                            colorIndex={0}
                            hint={user?.plan_access ?? 'none'}
                            label="Plan"
                            value={hasActivePlan ? 'Active' : 'None'}
                        />
                        <StatCard
                            colorIndex={2}
                            hint={data?.upcomingBooking ? formatDateTime(data.upcomingBooking.scheduled_at) : 'Book a session'}
                            label="Next consultation"
                            value={data?.upcomingBooking?.dietitian?.name ?? '—'}
                        />
                        <StatCard
                            colorIndex={1}
                            hint={data?.healthProfileComplete ? 'Complete' : 'Incomplete'}
                            label="Health profile"
                            value={data?.healthProfileComplete ? '✓' : '—'}
                        />
                        <StatCard
                            colorIndex={4}
                            hint={data?.renewal?.days_until_expiry != null ? `${data.renewal.days_until_expiry}d left` : '—'}
                            label="Plan window"
                            value={
                                data?.renewal?.days_until_expiry != null
                                    ? String(data.renewal.days_until_expiry)
                                    : '—'
                            }
                        />
                    </View>

                    {data?.planProgress && hasActivePlan ? (
                        <ChartCard colorIndex={1} subtitle={planName} title="Program progress">
                            <ProgressArc
                                colorIndex={1}
                                label={`${data.planProgress.remaining}% of plan time remaining`}
                                percent={data.planProgress.completed}
                            />
                        </ChartCard>
                    ) : null}

                    {data?.weightTrend && data.weightTrend.length > 1 ? (
                        <ChartCard colorIndex={2} subtitle="Weight (kg)" title="Your progress">
                            <MiniBarChart
                                colorIndex={2}
                                data={data.weightTrend.slice(-7).map((p) => ({ label: p.date, value: p.weight }))}
                                valueSuffix=" kg"
                            />
                        </ChartCard>
                    ) : null}

                    {data?.paymentTrend && data.paymentTrend.some((p) => p.amount > 0) ? (
                        <ChartCard colorIndex={0} subtitle="Spend (INR)" title="Payment activity">
                            <MiniBarChart
                                colorIndex={0}
                                data={data.paymentTrend.map((p) => ({ label: p.month, value: p.amount }))}
                                valueSuffix=" ₹"
                            />
                        </ChartCard>
                    ) : null}

                    {!hasActivePlan ? (
                        <Card tone="accent">
                            <SectionTitle>Your wellness journey starts here</SectionTitle>
                            <Text style={styles.body}>
                                Pick a diet plan to unlock meals, consultations, AI coach, and messaging.
                            </Text>
                            <MenuRow icon="nutrition-outline" label="Explore plans" onPress={() => router.push(PLANS_LIST_HREF)} />
                        </Card>
                    ) : null}

                    {user?.renew_plan_id ? (
                        <Card>
                            <Badge label="Renewal available" tone="warning" />
                            <Text style={[styles.body, { marginTop: spacing.sm }]}>
                                Your plan expired{user.expired_plan_name ? `: ${user.expired_plan_name}` : ''}.
                            </Text>
                            <MenuRow
                                icon="refresh-outline"
                                label="Renew plan"
                                onPress={() =>
                                    router.push({
                                        pathname: '/(app)/plans/[id]/checkout',
                                        params: { id: user.renew_plan_id!, intent: 'renew' },
                                    })
                                }
                            />
                        </Card>
                    ) : null}

                    {data?.upcomingBooking ? (
                        <Card>
                            <SectionTitle>Your next consultation</SectionTitle>
                            <Text style={styles.value}>{data.upcomingBooking.dietitian?.name ?? 'Dietitian'}</Text>
                            <Text style={styles.body}>{formatDateTime(data.upcomingBooking.scheduled_at)}</Text>
                            <BookingStatusBadge customerView status={data.upcomingBooking.status} />
                            <MenuRow
                                icon="calendar-outline"
                                label="View all bookings"
                                onPress={() => router.push(APP_ROUTES.bookings)}
                            />
                        </Card>
                    ) : hasActivePlan ? (
                        <Card>
                            <SectionTitle>Consultations</SectionTitle>
                            <Text style={styles.body}>No upcoming session booked yet.</Text>
                            <MenuRow
                                icon="calendar-outline"
                                label="Book consultation"
                                onPress={() => router.push(APP_ROUTES.bookingCreate)}
                            />
                        </Card>
                    ) : null}

                    {data?.todaysMeals && data.todaysMeals.length > 0 ? (
                        <Card>
                            <SectionTitle>Today&apos;s meals</SectionTitle>
                            {data.todaysMeals.slice(0, 3).map((meal, i) => (
                                <View key={i} style={styles.mealRow}>
                                    <Badge label={meal.meal_type ?? 'Meal'} tone="success" />
                                    <Text style={styles.body}>{meal.title}</Text>
                                </View>
                            ))}
                            <MenuRow icon="restaurant-outline" label="Full meal plan" onPress={() => router.push(APP_ROUTES.mealPlan)} />
                        </Card>
                    ) : null}

                    <Card>
                        <SectionTitle>Quick actions</SectionTitle>
                        <FeatureGrid>
                            <FeatureTile
                                colorIndex={3}
                                icon="calendar-outline"
                                label="Bookings"
                                onPress={() => router.push(APP_ROUTES.bookings)}
                            />
                            {customerCanUseMessenger(user) ? (
                                <FeatureTile
                                    colorIndex={4}
                                    icon="chatbubbles-outline"
                                    label="Messages"
                                    onPress={() => router.push(APP_ROUTES.messages)}
                                />
                            ) : null}
                            {hasActivePlan ? (
                                <>
                                    <FeatureTile
                                        colorIndex={1}
                                        icon="restaurant-outline"
                                        label="Meals"
                                        onPress={() => router.push(APP_ROUTES.mealPlan)}
                                    />
                                    <FeatureTile
                                        colorIndex={5}
                                        icon="fitness-outline"
                                        label="Health"
                                        onPress={() => router.push(APP_ROUTES.healthProfile)}
                                    />
                                    <FeatureTile
                                        colorIndex={0}
                                        icon="sparkles-outline"
                                        label="AI coach"
                                        onPress={() => router.push(APP_ROUTES.aiCoach)}
                                    />
                                </>
                            ) : null}
                        </FeatureGrid>
                    </Card>

                    {data?.recentPayments && data.recentPayments.length > 0 ? (
                        <Card>
                            <SectionTitle>Recent payments</SectionTitle>
                            {data.recentPayments.slice(0, 3).map((p, i) => (
                                <Text key={i} style={styles.body}>
                                    {formatInrFromPaise(p.amount_paise)} · {p.status_label ?? 'paid'}
                                </Text>
                            ))}
                        </Card>
                    ) : null}
                </ScrollView>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    root: { flex: 1, backgroundColor: colors.background },
    center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
    content: { padding: spacing.lg, gap: spacing.md, paddingBottom: spacing.xl },
    statsRow: { flexDirection: 'row', gap: spacing.sm, flexWrap: 'wrap' },
    mealRow: { gap: 4, marginBottom: spacing.sm },
    body: { fontSize: 15, color: colors.textMuted, lineHeight: 22 },
    value: { fontSize: 18, fontWeight: '700', color: colors.text },
    error: { color: colors.error },
});
