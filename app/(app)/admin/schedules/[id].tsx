import { AppHeader } from '@/components/ui/AppHeader';
import { Button } from '@/components/ui/Button';
import { TextField } from '@/components/ui/TextField';
import { colors, spacing } from '@/constants/theme';
import { apiDelete, apiGet, apiPost } from '@/src/lib/api-client';
import { apiRoutes } from '@/src/lib/api-routes';
import { DAY_LABELS, WEEKDAY_NUMBERS } from '@/src/lib/schedule-days';
import { Stack, useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

type Shift = {
    id: string;
    day_of_week: number;
    day_label?: string;
    start_time: string;
    end_time: string;
    slot_duration_minutes?: number;
    is_active?: boolean;
};

export default function AdminScheduleShowScreen() {
    const { id } = useLocalSearchParams<{ id: string }>();
    const [loading, setLoading] = useState(true);
    const [name, setName] = useState('');
    const [shifts, setShifts] = useState<Shift[]>([]);
    const [day, setDay] = useState('1');
    const [startTime, setStartTime] = useState('09:00');
    const [endTime, setEndTime] = useState('17:00');
    const [slotMinutes, setSlotMinutes] = useState('30');
    const [saving, setSaving] = useState(false);

    const load = useCallback(async () => {
        if (!id) {
            return;
        }
        setLoading(true);
        const result = await apiGet<{ dietitian?: { name?: string; schedules?: Shift[] } }>(
            apiRoutes.admin.schedules.show(id),
        );
        if (result.ok && result.data?.dietitian) {
            setName(result.data.dietitian.name ?? '');
            setShifts(result.data.dietitian.schedules ?? []);
        }
        setLoading(false);
    }, [id]);

    useEffect(() => {
        load();
    }, [load]);

    async function addShift() {
        if (!id) {
            return;
        }
        setSaving(true);
        const result = await apiPost(apiRoutes.admin.schedules.store(id), {
            day_of_week: Number(day) || 1,
            start_time: startTime,
            end_time: endTime,
            slot_duration_minutes: Number(slotMinutes) || 30,
            is_active: true,
        });
        setSaving(false);
        if (result.ok) {
            load();
        } else {
            Alert.alert('Error', result.message);
        }
    }

    async function addWeekdays() {
        if (!id) {
            return;
        }
        setSaving(true);
        const result = await apiPost(apiRoutes.admin.schedules.bulk(id), {
            days: [...WEEKDAY_NUMBERS],
            start_time: startTime,
            end_time: endTime,
            slot_duration_minutes: Number(slotMinutes) || 30,
        });
        setSaving(false);
        if (result.ok) {
            Alert.alert('Added', result.message ?? 'Weekday shifts added.');
            load();
        } else {
            Alert.alert('Error', result.message);
        }
    }

    function removeShift(shift: Shift) {
        if (!id) {
            return;
        }
        Alert.alert('Remove shift', 'Delete this shift?', [
            { text: 'Cancel', style: 'cancel' },
            {
                text: 'Delete',
                style: 'destructive',
                onPress: async () => {
                    const result = await apiDelete(apiRoutes.admin.schedules.destroy(id, shift.id));
                    if (result.ok) {
                        load();
                        return;
                    }

                    if (result.status === 409) {
                        Alert.alert(
                            'Bookings exist',
                            `${result.message}\n\nRemove anyway? Existing bookings may need manual review.`,
                            [
                                { text: 'Cancel', style: 'cancel' },
                                {
                                    text: 'Force remove',
                                    style: 'destructive',
                                    onPress: async () => {
                                        const forced = await apiDelete(
                                            `${apiRoutes.admin.schedules.destroy(id, shift.id)}?force=1`,
                                        );
                                        if (forced.ok) {
                                            load();
                                        } else {
                                            Alert.alert('Error', forced.message);
                                        }
                                    },
                                },
                            ],
                        );
                        return;
                    }

                    Alert.alert('Error', result.message);
                },
            },
        ]);
    }

    if (loading) {
        return <ActivityIndicator color={colors.brandDark} style={{ marginTop: 40 }} />;
    }

    return (
        <View style={styles.root}>
            <Stack.Screen options={{ headerShown: false }} />
            <AppHeader subtitle="Weekly shifts & slot length" title={name || 'Dietitian slots'} />
            <ScrollView contentContainerStyle={styles.content}>
                {shifts.length === 0 ? (
                    <Text style={styles.empty}>No shifts yet. Add a day below or apply Mon–Fri.</Text>
                ) : (
                    shifts.map((shift) => (
                        <View key={shift.id} style={styles.card}>
                            <Text style={styles.title}>
                                {shift.day_label ?? DAY_LABELS[shift.day_of_week] ?? `Day ${shift.day_of_week}`}
                            </Text>
                            <Text style={styles.meta}>
                                {shift.start_time} – {shift.end_time}
                                {shift.slot_duration_minutes ? ` · ${shift.slot_duration_minutes} min slots` : ''}
                                {shift.is_active === false ? ' · Paused' : ''}
                            </Text>
                            <Button label="Remove" onPress={() => removeShift(shift)} variant="secondary" />
                        </View>
                    ))
                )}

                <Text style={styles.section}>Add shift</Text>
                <Text style={styles.hint}>Day of week</Text>
                <View style={styles.dayRow}>
                    {Object.entries(DAY_LABELS).map(([value, label]) => {
                        const selected = day === value;
                        return (
                            <Pressable
                                key={value}
                                onPress={() => setDay(value)}
                                style={[styles.dayChip, selected && styles.dayChipSelected]}
                            >
                                <Text style={[styles.dayChipText, selected && styles.dayChipTextSelected]}>
                                    {label.slice(0, 3)}
                                </Text>
                            </Pressable>
                        );
                    })}
                </View>
                <TextField label="Start (HH:MM)" onChangeText={setStartTime} value={startTime} />
                <TextField label="End (HH:MM)" onChangeText={setEndTime} value={endTime} />
                <TextField
                    keyboardType="number-pad"
                    label="Slot duration (minutes)"
                    onChangeText={setSlotMinutes}
                    value={slotMinutes}
                />
                <Button label="Add shift" loading={saving} onPress={addShift} />
                <Button label="Add Mon–Fri (same hours)" loading={saving} onPress={addWeekdays} variant="secondary" />
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    root: { flex: 1, backgroundColor: colors.background },
    content: { padding: spacing.lg, gap: spacing.sm },
    empty: { fontSize: 14, color: colors.textMuted, marginBottom: spacing.sm },
    card: {
        backgroundColor: colors.card,
        borderRadius: 12,
        padding: spacing.md,
        borderWidth: 1,
        borderColor: colors.border,
        gap: spacing.sm,
    },
    title: { fontSize: 15, fontWeight: '600', color: colors.text },
    meta: { fontSize: 13, color: colors.textMuted },
    section: { fontSize: 16, fontWeight: '700', color: colors.text, marginTop: spacing.md },
    hint: { fontSize: 12, fontWeight: '600', color: colors.textMuted },
    dayRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs },
    dayChip: {
        paddingHorizontal: spacing.sm,
        paddingVertical: spacing.xs,
        borderRadius: 999,
        borderWidth: 1,
        borderColor: colors.border,
        backgroundColor: colors.card,
    },
    dayChipSelected: { backgroundColor: colors.brandDark, borderColor: colors.brandDark },
    dayChipText: { fontSize: 12, fontWeight: '700', color: colors.text },
    dayChipTextSelected: { color: '#fff' },
});
