import { AppHeader } from '@/components/ui/AppHeader';
import { Badge } from '@/components/ui/Badge';
import { BrandLoadingScreen } from '@/components/ui/BrandLoadingScreen';
import { Button } from '@/components/ui/Button';
import { Card, SectionTitle } from '@/components/ui/Card';
import { CustomerProgramGate } from '@/components/auth/CustomerProgramGate';
import { colors, spacing } from '@/constants/theme';
import { apiGet } from '@/src/lib/api-client';
import { apiRoutes } from '@/src/lib/api-routes';
import { useCallback, useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

type MealItem = {
    name?: string;
    title?: string;
    meal_type?: string;
    description?: string | null;
    calories?: number | null;
};

type MealPlanDay = {
    id?: string;
    day_number?: number;
    title?: string | null;
    meals?: MealItem[];
    calories_target?: number | null;
    program_day?: number;
    cycle_day?: number;
};

type MealPlanResponse = {
    activeEnrollment?: {
        diet_plan?: { name?: string; duration_weeks?: number };
        starts_at?: string | null;
        ends_at?: string | null;
    } | null;
    todaysMeals?: MealPlanDay | null;
    mealPlanDays?: MealPlanDay[];
};

function mealName(meal: MealItem): string {
    return meal.name ?? meal.title ?? meal.meal_type ?? 'Meal';
}

export default function MealPlanScreen() {
    const [loading, setLoading] = useState(true);
    const [data, setData] = useState<MealPlanResponse | null>(null);
    const [error, setError] = useState<string | null>(null);

    const load = useCallback(async () => {
        setLoading(true);
        const result = await apiGet<MealPlanResponse>(apiRoutes.mealPlan);
        if (result.ok && result.data) {
            setData(result.data);
            setError(null);
        } else {
            setError(result.ok ? 'No meal plan available.' : result.message);
        }
        setLoading(false);
    }, []);

    useEffect(() => {
        load();
    }, [load]);

    const planName = data?.activeEnrollment?.diet_plan?.name ?? 'Your weekly meals';
    const today = data?.todaysMeals;
    const rotationDays = data?.mealPlanDays ?? [];

    return (
        <CustomerProgramGate>
            <View style={styles.root}>
                <AppHeader
                    subtitle={
                        today?.program_day
                            ? `${planName} · program day ${today.program_day}`
                            : planName
                    }
                    title="Meal plan"
                />
                {loading ? (
                    <BrandLoadingScreen message="Loading meal plan…" />
                ) : (
                    <ScrollView contentContainerStyle={styles.content}>
                        {error ? <Text style={styles.error}>{error}</Text> : null}

                        {today ? (
                            <Card tone="accent">
                                <SectionTitle>Today</SectionTitle>
                                {today.title ? <Text style={styles.dayTitle}>{today.title}</Text> : null}
                                <View style={styles.metaRow}>
                                    {today.calories_target ? (
                                        <Text style={styles.meta}>~{today.calories_target} kcal target</Text>
                                    ) : null}
                                    {today.cycle_day ? (
                                        <Text style={styles.meta}>Cycle day {today.cycle_day}</Text>
                                    ) : null}
                                </View>
                                {(today.meals ?? []).length > 0 ? (
                                    today.meals!.map((meal, i) => (
                                        <View key={`${mealName(meal)}-${i}`} style={styles.meal}>
                                            <Badge label={meal.meal_type ?? 'Meal'} tone="success" />
                                            <Text style={styles.title}>{mealName(meal)}</Text>
                                            {meal.description ? (
                                                <Text style={styles.body}>{meal.description}</Text>
                                            ) : null}
                                            {meal.calories ? (
                                                <Text style={styles.meta}>{meal.calories} kcal</Text>
                                            ) : null}
                                        </View>
                                    ))
                                ) : (
                                    <Text style={styles.body}>No meals listed for today.</Text>
                                )}
                            </Card>
                        ) : (
                            <Card>
                                <Text style={styles.title}>No meal plan configured yet</Text>
                                <Text style={styles.body}>
                                    Your dietitian will add daily meals to your program soon.
                                </Text>
                            </Card>
                        )}

                        {rotationDays.length > 1 ? (
                            <>
                                <Text style={styles.sectionHeading}>
                                    Full rotation ({rotationDays.length} days)
                                </Text>
                                {rotationDays.map((day, di) => (
                                    <Card key={day.id ?? `day-${di}`}>
                                        <SectionTitle>
                                            {`Day ${day.day_number ?? di + 1}${day.title ? ` · ${day.title}` : ''}`}
                                        </SectionTitle>
                                        {day.calories_target ? (
                                            <Text style={styles.meta}>Target: {day.calories_target} kcal</Text>
                                        ) : null}
                                        {(day.meals ?? []).map((meal, mi) => (
                                            <View key={`${day.id}-${mi}`} style={styles.meal}>
                                                <Text style={styles.mealType}>{meal.meal_type ?? 'Meal'}</Text>
                                                <Text style={styles.title}>{mealName(meal)}</Text>
                                                {meal.description ? (
                                                    <Text style={styles.body}>{meal.description}</Text>
                                                ) : null}
                                                {meal.calories ? (
                                                    <Text style={styles.meta}>{meal.calories} kcal</Text>
                                                ) : null}
                                            </View>
                                        ))}
                                    </Card>
                                ))}
                            </>
                        ) : null}
                    </ScrollView>
                )}
            </View>
        </CustomerProgramGate>
    );
}

const styles = StyleSheet.create({
    root: { flex: 1, backgroundColor: colors.background },
    content: { padding: spacing.lg, gap: spacing.md, paddingBottom: spacing.xl },
    sectionHeading: {
        fontSize: 12,
        fontWeight: '700',
        letterSpacing: 0.4,
        textTransform: 'uppercase',
        color: colors.textMuted,
        marginTop: spacing.sm,
    },
    meal: { marginBottom: spacing.md, gap: 4 },
    mealType: { fontSize: 12, fontWeight: '700', color: colors.chart3, textTransform: 'uppercase' },
    dayTitle: { fontSize: 15, fontWeight: '600', color: colors.text, marginBottom: spacing.xs },
    title: { fontSize: 16, fontWeight: '700', color: colors.text },
    body: { fontSize: 14, color: colors.textMuted, lineHeight: 20 },
    meta: { fontSize: 12, color: colors.textMuted },
    metaRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md, marginBottom: spacing.sm },
    error: { color: colors.error },
});
