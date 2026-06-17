import { AppHeader } from '@/components/ui/AppHeader';
import { Button } from '@/components/ui/Button';
import { TextField } from '@/components/ui/TextField';
import { colors, spacing } from '@/constants/theme';
import { apiDelete, apiGet, apiPost } from '@/src/lib/api-client';
import { apiRoutes } from '@/src/lib/api-routes';
import { Stack, useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, StyleSheet, Text, View } from 'react-native';

type Shift = { id: string; day_of_week: number; start_time: string; end_time: string };

export default function AdminScheduleShowScreen() {
    const { id } = useLocalSearchParams<{ id: string }>();
    const [loading, setLoading] = useState(true);
    const [name, setName] = useState('');
    const [shifts, setShifts] = useState<Shift[]>([]);
    const [day, setDay] = useState('1');
    const [startTime, setStartTime] = useState('09:00');
    const [endTime, setEndTime] = useState('17:00');
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
            slot_duration_minutes: 30,
            is_active: true,
        });
        setSaving(false);
        if (result.ok) {
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
                    } else {
                        Alert.alert('Error', result.message);
                    }
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
            <AppHeader subtitle="Weekly shifts" title={name || 'Schedule'} />
            <ScrollView contentContainerStyle={styles.content}>
                {shifts.map((shift) => (
                    <View key={shift.id} style={styles.card}>
                        <Text style={styles.title}>
                            Day {shift.day_of_week}: {shift.start_time} – {shift.end_time}
                        </Text>
                        <Button label="Remove" onPress={() => removeShift(shift)} variant="secondary" />
                    </View>
                ))}
                <Text style={styles.section}>Add shift</Text>
                <TextField keyboardType="number-pad" label="Day (0=Sun … 6=Sat)" onChangeText={setDay} value={day} />
                <TextField label="Start (HH:MM)" onChangeText={setStartTime} value={startTime} />
                <TextField label="End (HH:MM)" onChangeText={setEndTime} value={endTime} />
                <Button label="Add shift" loading={saving} onPress={addShift} />
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    root: { flex: 1, backgroundColor: colors.background },
    content: { padding: spacing.lg, gap: spacing.sm },
    card: { backgroundColor: colors.card, borderRadius: 12, padding: spacing.md, borderWidth: 1, borderColor: colors.border, gap: spacing.sm },
    title: { fontSize: 15, fontWeight: '600', color: colors.text },
    section: { fontSize: 16, fontWeight: '700', color: colors.text, marginTop: spacing.md },
});
