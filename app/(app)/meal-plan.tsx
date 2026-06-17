import { AppHeader } from '@/components/ui/AppHeader';
import { CustomerProgramGate } from '@/components/auth/CustomerProgramGate';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card, SectionTitle } from '@/components/ui/Card';
import { colors, spacing } from '@/constants/theme';
import { useAuth } from '@/src/context/auth-context';
import { apiGet } from '@/src/lib/api-client';
import { apiRoutes } from '@/src/lib/api-routes';
import { PLANS_LIST_HREF } from '@/src/lib/navigation';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native';

type MealItem = {
    meal_type?: string;
    title?: string;
    description?: string | null;
    calories?: number | null;
};

type MealPlanDay = {
    day_number?: number;
    title?: string;
    meals?: MealItem[];
    calories_target?: number | null;
};

type MealPlanResponse = {
    activeEnrollment?: { diet_plan?: { name?: string } } | null;
    todaysMeals?: MealItem[] | null;
    mealPlanDays?: MealPlanDay[];
};

export default function MealPlanScreen() {
    const router = useRouter();
    const { user } = useAuth();
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

    return (
        <CustomerProgramGate>
        <View style={styles.root}>
            <AppHeader subtitle={planName} title="Meal plan" />
            {loading ? (
                <ActivityIndicator color={colors.brandDark} style={{ marginTop: 40 }} />
            ) : (
                <ScrollView contentContainerStyle={styles.content}>
                    {error ? <Text style={styles.error}>{error}</Text> : null}
                    {data?.todaysMeals && data.todaysMeals.length > 0 ? (
                        <Card tone="accent">
                            <SectionTitle>Today</SectionTitle>
                            {data.todaysMeals.map((meal, i) => (
                                <View key={i} style={styles.meal}>
                                    <Badge label={meal.meal_type ?? 'Meal'} tone="success" />
                                    <Text style={styles.title}>{meal.title}</Text>
                                    {meal.description ? <Text style={styles.body}>{meal.description}</Text> : null}
                                    {meal.calories ? <Text style={styles.meta}>{meal.calories} kcal</Text> : null}
                                </View>
                            ))}
                        </Card>
                    ) : null}
                    {data?.mealPlanDays?.map((day, di) => (
                        <Card key={di}>
                            <SectionTitle>
                                {`Day ${day.day_number ?? di + 1}${day.title ? ` · ${day.title}` : ''}`}
                            </SectionTitle>
                            {day.calories_target ? (
                                <Text style={styles.meta}>Target: {String(day.calories_target)} kcal</Text>
                            ) : null}
                            {day.meals?.map((meal, mi) => (
                                <View key={mi} style={styles.meal}>
                                    <Text style={styles.mealType}>{meal.meal_type}</Text>
                                    <Text style={styles.title}>{meal.title}</Text>
                                    {meal.calories ? <Text style={styles.meta}>{meal.calories} kcal</Text> : null}
                                </View>
                            ))}
                        </Card>
                    ))}
                </ScrollView>
            )}
        </View>
        </CustomerProgramGate>
    );
}

const styles = StyleSheet.create({
    root: { flex: 1, backgroundColor: colors.background },
    content: { padding: spacing.lg, gap: spacing.md, paddingBottom: spacing.xl },
    meal: { marginBottom: spacing.md, gap: 4 },
    mealType: { fontSize: 12, fontWeight: '700', color: colors.chart3, textTransform: 'uppercase' },
    title: { fontSize: 16, fontWeight: '700', color: colors.text },
    body: { fontSize: 14, color: colors.textMuted, lineHeight: 20 },
    meta: { fontSize: 12, color: colors.textMuted },
    error: { color: colors.error },
    blocked: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.lg, gap: spacing.md },
    blockedTitle: { fontSize: 20, fontWeight: '700', color: colors.text },
});
