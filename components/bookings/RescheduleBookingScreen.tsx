import { AppHeader } from '@/components/ui/AppHeader';
import { Button } from '@/components/ui/Button';
import { colors, formatDateTime, spacing } from '@/constants/theme';
import { apiGet, apiPost } from '@/src/lib/api-client';
import { apiRoutes } from '@/src/lib/api-routes';
import type { BookingCalendarResponse, BookingListItem, CalendarSlot } from '@/src/types/bookings';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    View,
} from 'react-native';

export type RescheduleMode = 'dietitian' | 'admin';

type Props = {
    mode: RescheduleMode;
};

function collectAvailableSlots(calendar: BookingCalendarResponse['calendar']): CalendarSlot[] {
    const slots: CalendarSlot[] = [];
    Object.values(calendar.days ?? {}).forEach((day) => {
        day.slots.forEach((slot) => {
            if (slot.state === 'available') {
                slots.push(slot);
            }
        });
    });
    return slots.sort((a, b) => a.value.localeCompare(b.value));
}

export function RescheduleBookingScreen({ mode }: Props) {
    const router = useRouter();
    const { id } = useLocalSearchParams<{ id: string }>();
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [booking, setBooking] = useState<BookingListItem | null>(null);
    const [dietitianId, setDietitianId] = useState<string | null>(null);
    const [dietitians, setDietitians] = useState<{ id: string; name: string }[]>([]);
    const [slots, setSlots] = useState<CalendarSlot[]>([]);
    const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    const formPath =
        mode === 'admin'
            ? apiRoutes.admin.bookings.rescheduleForm(id ?? '')
            : apiRoutes.dietitian.appointmentRescheduleForm(id ?? '');

    const submitPath =
        mode === 'admin'
            ? apiRoutes.admin.bookings.reschedule(id ?? '')
            : apiRoutes.dietitian.appointmentReschedule(id ?? '');

    const load = useCallback(async () => {
        if (!id) {
            return;
        }
        setLoading(true);
        const result = await apiGet<{
            booking?: BookingListItem;
            calendar?: BookingCalendarResponse['calendar'];
            dietitians?: { id: string; name: string }[];
            selectedDietitianId?: string | null;
        }>(formPath);

        if (result.ok && result.data) {
            setBooking(result.data.booking ?? null);
            const nextDietitianId = result.data.selectedDietitianId ?? result.data.booking?.dietitian?.id ?? null;
            setDietitianId(nextDietitianId);
            setDietitians(result.data.dietitians ?? []);
            setSlots(collectAvailableSlots(result.data.calendar ?? { month: '', days: {} }));
            setError(null);
        } else {
            setError(result.ok ? 'Could not load reschedule form.' : result.message);
        }
        setLoading(false);
    }, [formPath, id]);

    useEffect(() => {
        load();
    }, [load]);

    const slotSections = useMemo(() => {
        const grouped = new Map<string, CalendarSlot[]>();
        slots.forEach((slot) => {
            const day = slot.value.slice(0, 10);
            const list = grouped.get(day) ?? [];
            list.push(slot);
            grouped.set(day, list);
        });
        return [...grouped.entries()];
    }, [slots]);

    async function onSubmit() {
        if (!id || !dietitianId || !selectedSlot) {
            setError('Select a new time slot.');
            return;
        }

        setSubmitting(true);
        setError(null);

        const result = await apiPost<{ booking_id?: string }>(submitPath, {
            dietitian_id: dietitianId,
            scheduled_at: selectedSlot,
        });

        setSubmitting(false);

        if (!result.ok) {
            setError(result.message);
            return;
        }

        const nextId = result.data?.booking_id ?? id;
        Alert.alert('Rescheduled', result.message, [
            {
                text: 'OK',
                onPress: () => {
                    if (mode === 'admin') {
                        router.replace(`/(app)/admin/bookings/${nextId}`);
                    } else {
                        router.replace(`/(app)/bookings/${nextId}`);
                    }
                },
            },
        ]);
    }

    if (loading) {
        return (
            <View style={styles.center}>
                <ActivityIndicator color={colors.brandDark} size="large" />
            </View>
        );
    }

    return (
        <View style={styles.root}>
            <Stack.Screen options={{ headerShown: false }} />
            <AppHeader
                subtitle={booking ? formatDateTime(booking.scheduled_at) : 'Pick a new slot'}
                title="Reschedule"
            />
            <ScrollView contentContainerStyle={styles.content}>
                {error ? <Text style={styles.error}>{error}</Text> : null}
                {booking ? (
                    <Text style={styles.meta}>
                        {booking.user?.name ?? 'Client'} · {booking.dietitian?.name ?? 'Dietitian'}
                    </Text>
                ) : null}

                {mode === 'admin' && dietitians.length > 1 ? (
                    <View style={styles.chips}>
                        {dietitians.map((d) => (
                            <Pressable
                                key={d.id}
                                onPress={() => setDietitianId(d.id)}
                                style={[styles.chip, dietitianId === d.id && styles.chipActive]}
                            >
                                <Text style={[styles.chipText, dietitianId === d.id && styles.chipTextActive]}>
                                    {d.name}
                                </Text>
                            </Pressable>
                        ))}
                    </View>
                ) : null}

                {slotSections.length === 0 ? (
                    <Text style={styles.hint}>No open slots this month. Try another dietitian or contact admin.</Text>
                ) : (
                    slotSections.map(([day, daySlots]) => (
                        <View key={day} style={styles.section}>
                            <Text style={styles.dayLabel}>{day}</Text>
                            <View style={styles.slotRow}>
                                {daySlots.map((slot) => (
                                    <Pressable
                                        key={slot.value}
                                        onPress={() => setSelectedSlot(slot.value)}
                                        style={[styles.slot, selectedSlot === slot.value && styles.slotActive]}
                                    >
                                        <Text
                                            style={[
                                                styles.slotText,
                                                selectedSlot === slot.value && styles.slotTextActive,
                                            ]}
                                        >
                                            {slot.label}
                                        </Text>
                                    </Pressable>
                                ))}
                            </View>
                        </View>
                    ))
                )}

                <Button label="Confirm reschedule" loading={submitting} onPress={onSubmit} />
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    root: { flex: 1, backgroundColor: colors.background },
    center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
    content: { padding: spacing.lg, gap: spacing.md, paddingBottom: spacing.xl },
    meta: { fontSize: 15, color: colors.textMuted },
    error: { color: colors.error },
    hint: { color: colors.textMuted, fontSize: 14 },
    section: { gap: spacing.sm },
    dayLabel: { fontWeight: '700', color: colors.text },
    slotRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
    slot: {
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.sm,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: colors.border,
        backgroundColor: colors.card,
    },
    slotActive: { borderColor: colors.brandDark, backgroundColor: '#eef8ea' },
    slotText: { fontSize: 14, color: colors.text },
    slotTextActive: { color: colors.brandDark, fontWeight: '600' },
    chips: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
    chip: {
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.sm,
        borderRadius: 999,
        borderWidth: 1,
        borderColor: colors.border,
    },
    chipActive: { borderColor: colors.brandDark, backgroundColor: '#eef8ea' },
    chipText: { fontSize: 13, color: colors.textMuted },
    chipTextActive: { color: colors.brandDark, fontWeight: '600' },
});
