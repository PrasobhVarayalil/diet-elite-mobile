import { AppHeader } from '@/components/ui/AppHeader';
import { BrandLoadingScreen } from '@/components/ui/BrandLoadingScreen';
import { Card, SectionTitle } from '@/components/ui/Card';
import { colors, formatInrFromPaise, spacing } from '@/constants/theme';
import { apiGet } from '@/src/lib/api-client';
import { apiRoutes } from '@/src/lib/api-routes';
import { Stack, useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

type MealItem = {
    name?: string;
    meal_type?: string;
    description?: string | null;
    calories?: number | null;
};

type MealPlanDay = {
    id: string;
    day_number: number;
    title?: string | null;
    meals?: MealItem[];
    calories_target?: number | null;
};

function mealName(meal: MealItem): string {
    return meal.name ?? meal.meal_type ?? 'Meal';
}

export default function AdminPlanShowScreen() {
    const { id } = useLocalSearchParams<{ id: string }>();
    const [loading, setLoading] = useState(true);
    const [plan, setPlan] = useState<Record<string, unknown> | null>(null);
    const [mealPlanDays, setMealPlanDays] = useState<MealPlanDay[]>([]);

    const load = useCallback(async () => {
        if (!id) {
            return;
        }
        setLoading(true);
        const result = await apiGet<{ plan?: Record<string, unknown>; mealPlanDays?: MealPlanDay[] }>(
            apiRoutes.admin.plans.show(id),
        );
        if (result.ok && result.data) {
            setPlan(result.data.plan ?? null);
            setMealPlanDays(result.data.mealPlanDays ?? []);
        }
        setLoading(false);
    }, [id]);

    useEffect(() => {
        load();
    }, [load]);

    if (loading) {
        return <BrandLoadingScreen message="Loading plan…" />;
    }

    return (
        <View style={styles.root}>
            <Stack.Screen options={{ headerShown: false }} />
            <AppHeader subtitle={String(plan?.tagline ?? '')} title={String(plan?.name ?? 'Plan')} />
            <ScrollView contentContainerStyle={styles.content}>
                <Text style={styles.value}>{formatInrFromPaise(Number(plan?.price_paise ?? 0))}</Text>
                <Text style={styles.meta}>{String(plan?.duration_weeks ?? '—')} weeks</Text>
                <Text style={styles.meta}>{plan?.is_active ? 'Active' : 'Inactive'}</Text>
                <Text style={styles.body}>{String(plan?.description ?? '')}</Text>
                <Text style={styles.meta}>{Number(plan?.enrollments_count ?? 0)} enrollments</Text>

                <SectionTitle>Meal plan days</SectionTitle>
                {mealPlanDays.length === 0 ? (
                    <Text style={styles.meta}>No meal plan days configured for this plan.</Text>
                ) : (
                    mealPlanDays.map((day) => (
                        <Card key={day.id}>
                            <Text style={styles.dayTitle}>
                                Day {day.day_number}
                                {day.title ? ` · ${day.title}` : ''}
                            </Text>
                            {day.calories_target ? (
                                <Text style={styles.meta}>Target: {day.calories_target} kcal</Text>
                            ) : null}
                            {(day.meals ?? []).length === 0 ? (
                                <Text style={styles.meta}>No meals listed.</Text>
                            ) : (
                                (day.meals ?? []).map((meal, index) => (
                                    <View key={`${day.id}-${index}`} style={styles.mealRow}>
                                        <Text style={styles.mealName}>{mealName(meal)}</Text>
                                        {meal.calories ? (
                                            <Text style={styles.meta}>{meal.calories} kcal</Text>
                                        ) : null}
                                        {meal.description ? (
                                            <Text style={styles.body}>{meal.description}</Text>
                                        ) : null}
                                    </View>
                                ))
                            )}
                        </Card>
                    ))
                )}
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    root: { flex: 1, backgroundColor: colors.background },
    content: { padding: spacing.lg, gap: spacing.sm, paddingBottom: spacing.xl },
    value: { fontSize: 24, fontWeight: '800', color: colors.brandDark },
    meta: { fontSize: 14, color: colors.textMuted },
    body: { fontSize: 15, color: colors.text, lineHeight: 22, marginTop: spacing.md },
    dayTitle: { fontSize: 16, fontWeight: '700', color: colors.text, marginBottom: spacing.xs },
    mealRow: { gap: 2, marginTop: spacing.sm, paddingTop: spacing.sm, borderTopWidth: 1, borderTopColor: colors.border },
    mealName: { fontSize: 15, fontWeight: '600', color: colors.text },
});
