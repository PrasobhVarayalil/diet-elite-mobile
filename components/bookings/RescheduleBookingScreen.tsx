import { BookingSlotPicker } from '@/components/bookings/BookingSlotPicker';
import { AppHeader } from '@/components/ui/AppHeader';
import { Button } from '@/components/ui/Button';
import { colors, formatDateTime, spacing } from '@/constants/theme';
import { apiGet, apiPost } from '@/src/lib/api-client';
import { apiRoutes } from '@/src/lib/api-routes';
import {
    clampMonthToEarliest,
    collectBookableSlots,
    currentMonthKey,
    dietitianDisplayName,
    firstBookableDay,
} from '@/src/lib/booking-calendar';
import type { BookingCalendarResponse, BookingListItem, CalendarSlot } from '@/src/types/bookings';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

export type RescheduleMode = 'dietitian' | 'admin';

type Props = {
    mode: RescheduleMode;
};

export function RescheduleBookingScreen({ mode }: Props) {
    const router = useRouter();
    const { id } = useLocalSearchParams<{ id: string }>();
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [booking, setBooking] = useState<BookingListItem | null>(null);
    const [dietitianId, setDietitianId] = useState<string | null>(null);
    const [dietitians, setDietitians] = useState<{ id: string; name: string }[]>([]);
    const [selectedMonth, setSelectedMonth] = useState(currentMonthKey);
    const [slots, setSlots] = useState<CalendarSlot[]>([]);
    const [selectedDay, setSelectedDay] = useState<string | null>(null);
    const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
    const [calendarLoading, setCalendarLoading] = useState(false);
    const [loadError, setLoadError] = useState<string | null>(null);
    const [submitError, setSubmitError] = useState<string | null>(null);

    const formPath =
        mode === 'admin'
            ? apiRoutes.admin.bookings.rescheduleForm(id ?? '')
            : apiRoutes.dietitian.appointmentRescheduleForm(id ?? '');

    const submitPath =
        mode === 'admin'
            ? apiRoutes.admin.bookings.reschedule(id ?? '')
            : apiRoutes.dietitian.appointmentReschedule(id ?? '');

    const load = useCallback(
        async (month: string, nextDietitianId?: string | null) => {
            if (!id) {
                return;
            }

            setCalendarLoading(true);
            setLoadError(null);
            setSelectedSlot(null);
            setSelectedDay(null);

            const safeMonth = clampMonthToEarliest(month);
            if (safeMonth !== month) {
                setSelectedMonth(safeMonth);
            }

            const dietitianQuery = nextDietitianId ? `&dietitian_id=${encodeURIComponent(nextDietitianId)}` : '';
            const result = await apiGet<BookingCalendarResponse & { booking?: BookingListItem }>(
                `${formPath}?month=${safeMonth}${dietitianQuery}`,
            );

            if (result.ok && result.data) {
                setBooking(result.data.booking ?? null);
                const resolvedDietitianId =
                    nextDietitianId ??
                    result.data.selectedDietitianId ??
                    result.data.booking?.dietitian?.id ??
                    null;
                setDietitianId(resolvedDietitianId);
                setDietitians(result.data.dietitians ?? []);
                const bookable = collectBookableSlots(result.data.calendar, { staffBooking: true });
                setSlots(bookable);
                setSelectedDay(firstBookableDay(bookable));
            } else {
                setLoadError(result.ok ? 'Could not load reschedule calendar.' : result.message);
            }

            setCalendarLoading(false);
            setLoading(false);
        },
        [formPath, id],
    );

    useEffect(() => {
        if (id) {
            void load(selectedMonth, dietitianId);
        }
    }, [id, selectedMonth, dietitianId, load]);

    async function onSubmit() {
        if (!id || !dietitianId || !selectedSlot) {
            setSubmitError('Select a new date and time.');
            return;
        }

        setSubmitting(true);
        setSubmitError(null);

        const result = await apiPost(submitPath, {
            dietitian_id: dietitianId,
            scheduled_at: selectedSlot,
        });

        setSubmitting(false);

        if (!result.ok) {
            setSubmitError(result.message);
            return;
        }

        Alert.alert('Rescheduled', result.message, [{ text: 'OK', onPress: () => router.back() }]);
    }

    if (loading && !booking) {
        return (
            <View style={styles.center}>
                <ActivityIndicator color={colors.brandDark} size="large" />
            </View>
        );
    }

    const pickerName = dietitianDisplayName(dietitianId, dietitians, booking?.dietitian?.name ?? 'Dietitian');

    return (
        <View style={styles.root}>
            <Stack.Screen options={{ headerShown: false }} />
            <AppHeader subtitle="Choose a new time" title="Reschedule" />
            <ScrollView contentContainerStyle={styles.content}>
                {booking ? (
                    <View style={styles.current}>
                        <Text style={styles.currentLabel}>Current appointment</Text>
                        <Text style={styles.currentValue}>{formatDateTime(booking.scheduled_at)}</Text>
                        {booking.dietitian?.name ? (
                            <Text style={styles.currentMeta}>with {booking.dietitian.name}</Text>
                        ) : null}
                    </View>
                ) : null}

                {mode === 'admin' && dietitians.length > 1 ? (
                    <View style={styles.section}>
                        <Text style={styles.sectionLabel}>Dietitian</Text>
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
                    </View>
                ) : null}

                {loadError && !calendarLoading ? (
                    <Text style={styles.error}>{loadError}</Text>
                ) : null}

                {dietitianId ? (
                    <BookingSlotPicker
                        dietitianName={pickerName}
                        loadError={loadError}
                        loading={calendarLoading}
                        month={selectedMonth}
                        onMonthChange={setSelectedMonth}
                        onRetry={() => void load(selectedMonth, dietitianId)}
                        onSelectDay={setSelectedDay}
                        onSelectSlot={setSelectedSlot}
                        selectedDay={selectedDay}
                        selectedSlot={selectedSlot}
                        slots={slots}
                        summaryTitle="New appointment"
                    />
                ) : null}

                {submitError ? <Text style={styles.error}>{submitError}</Text> : null}
                <Button
                    disabled={!selectedSlot}
                    label="Confirm reschedule"
                    loading={submitting}
                    onPress={onSubmit}
                />
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    root: { flex: 1, backgroundColor: colors.background },
    center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
    content: { padding: spacing.lg, gap: spacing.md, paddingBottom: spacing.xl },
    current: {
        padding: spacing.md,
        borderRadius: 12,
        backgroundColor: colors.card,
        borderWidth: 1,
        borderColor: colors.border,
        gap: 4,
    },
    currentLabel: { fontSize: 12, fontWeight: '700', color: colors.textMuted, textTransform: 'uppercase' },
    currentValue: { fontSize: 16, fontWeight: '700', color: colors.text },
    currentMeta: { fontSize: 13, color: colors.textMuted },
    section: { gap: spacing.sm },
    sectionLabel: {
        fontSize: 12,
        fontWeight: '700',
        letterSpacing: 0.4,
        textTransform: 'uppercase',
        color: colors.textMuted,
    },
    chips: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs },
    chip: {
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.xs,
        borderRadius: 999,
        borderWidth: 1,
        borderColor: colors.border,
        backgroundColor: colors.card,
    },
    chipActive: { backgroundColor: colors.brandDark, borderColor: colors.brandDark },
    chipText: { fontSize: 13, fontWeight: '600', color: colors.text },
    chipTextActive: { color: colors.white },
    error: { color: colors.error, fontSize: 14 },
});
