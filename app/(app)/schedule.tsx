import { AppHeader } from '@/components/ui/AppHeader';
import { colors, spacing } from '@/constants/theme';
import { apiGet } from '@/src/lib/api-client';
import { apiRoutes } from '@/src/lib/api-routes';
import { DAY_LABELS } from '@/src/lib/schedule-days';
import { Stack } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native';

type Shift = {
    id: string;
    day_of_week: number;
    day_label?: string;
    start_time: string;
    end_time: string;
    slot_duration_minutes?: number;
};

type ScheduleResponse = {
    dietitian?: { name?: string; title?: string; schedules?: Shift[] };
    weekByDay?: Array<{ day: string; day_of_week: number; shifts: Shift[] }>;
};

export default function DietitianScheduleScreen() {
    const [loading, setLoading] = useState(true);
    const [data, setData] = useState<ScheduleResponse | null>(null);

    const load = useCallback(async () => {
        setLoading(true);
        const result = await apiGet<ScheduleResponse>(apiRoutes.dietitian.schedule);
        if (result.ok && result.data) {
            setData(result.data);
        }
        setLoading(false);
    }, []);

    useEffect(() => {
        load();
    }, [load]);

    const displayShifts = useMemo(() => {
        if (!data) {
            return [];
        }
        if (data.weekByDay?.length) {
            return data.weekByDay.flatMap((day) =>
                day.shifts.map((shift) => ({
                    ...shift,
                    day_label: shift.day_label ?? day.day ?? DAY_LABELS[shift.day_of_week],
                })),
            );
        }

        return (data.dietitian?.schedules ?? []).map((shift) => ({
            ...shift,
            day_label: shift.day_label ?? DAY_LABELS[shift.day_of_week],
        }));
    }, [data]);

    return (
        <View style={styles.root}>
            <Stack.Screen options={{ headerShown: false }} />
            <AppHeader
                subtitle={data?.dietitian?.title ?? 'Your weekly availability'}
                title={data?.dietitian?.name ? `${data.dietitian.name}'s schedule` : 'My schedule'}
            />
            {loading ? (
                <ActivityIndicator color={colors.brandDark} style={{ marginTop: 40 }} />
            ) : (
                <ScrollView contentContainerStyle={styles.content}>
                    <Text style={styles.note}>
                        Read-only view. Ask an admin to update your bookable slots in Admin → Dietitian slots.
                    </Text>
                    {displayShifts.length === 0 ? (
                        <Text style={styles.meta}>No shifts configured yet.</Text>
                    ) : (
                        displayShifts.map((shift) => (
                            <View key={shift.id} style={styles.card}>
                                <Text style={styles.title}>{shift.day_label}</Text>
                                <Text style={styles.meta}>
                                    {shift.start_time} – {shift.end_time}
                                    {shift.slot_duration_minutes ? ` · ${shift.slot_duration_minutes} min slots` : ''}
                                </Text>
                            </View>
                        ))
                    )}
                </ScrollView>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    root: { flex: 1, backgroundColor: colors.background },
    content: { padding: spacing.lg, gap: spacing.sm },
    note: { fontSize: 13, color: colors.textMuted, lineHeight: 20, marginBottom: spacing.sm },
    card: {
        backgroundColor: colors.card,
        borderRadius: 12,
        padding: spacing.md,
        borderWidth: 1,
        borderColor: colors.border,
        gap: 4,
    },
    title: { fontSize: 15, fontWeight: '600', color: colors.text },
    meta: { fontSize: 13, color: colors.textMuted },
});
