import { BookingSlotPicker } from '@/components/bookings/BookingSlotPicker';
import { AppScreen } from '@/components/ui/AppScreen';
import { Button } from '@/components/ui/Button';
import { CustomerProgramGate } from '@/components/auth/CustomerProgramGate';
import { TextField } from '@/components/ui/TextField';
import { colors, spacing } from '@/constants/theme';
import { useAuth } from '@/src/context/auth-context';
import { apiGet, apiPost } from '@/src/lib/api-client';
import { apiRoutes } from '@/src/lib/api-routes';
import type {
    BookingCalendarResponse,
    BookingStoreResponse,
    CalendarSlot,
    DietitianSearchResponse,
} from '@/src/types/bookings';
import { Stack, useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Keyboard,
    Pressable,
    StyleSheet,
    Text,
    View,
} from 'react-native';

function currentMonth(): string {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}

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

export default function BookingCreateScreen() {
    const router = useRouter();
    const { refreshUser } = useAuth();
    const [query, setQuery] = useState('');
    const [searching, setSearching] = useState(false);
    const [dietitians, setDietitians] = useState<DietitianSearchResponse['dietitians']>([]);
    const [selectedDietitianId, setSelectedDietitianId] = useState<string | null>(null);
    const [selectedDietitianName, setSelectedDietitianName] = useState<string | null>(null);
    const [selectedMonth, setSelectedMonth] = useState(currentMonth);
    const [calendarLoading, setCalendarLoading] = useState(false);
    const [slots, setSlots] = useState<CalendarSlot[]>([]);
    const [selectedDay, setSelectedDay] = useState<string | null>(null);
    const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
    const [submitting, setSubmitting] = useState(false);
    const [loadError, setLoadError] = useState<string | null>(null);
    const [submitError, setSubmitError] = useState<string | null>(null);

    const searchDietitians = useCallback(async (term: string) => {
        if (term.trim().length < 2) {
            setDietitians([]);
            return;
        }

        setSearching(true);
        const path = `${apiRoutes.dietitians.search}?q=${encodeURIComponent(term.trim())}`;
        const result = await apiGet<DietitianSearchResponse>(path);

        if (result.ok && result.data) {
            setDietitians(result.data.dietitians ?? []);
        }

        setSearching(false);
    }, []);

    useEffect(() => {
        const timer = setTimeout(() => searchDietitians(query), 300);
        return () => clearTimeout(timer);
    }, [query, searchDietitians]);

    const loadCalendar = useCallback(async (dietitianId: string, month: string) => {
        setCalendarLoading(true);
        setLoadError(null);
        setSelectedSlot(null);
        setSelectedDay(null);

        const path = `${apiRoutes.bookings.calendar}?dietitian_id=${encodeURIComponent(dietitianId)}&month=${month}`;
        const result = await apiGet<BookingCalendarResponse>(path);

        if (result.ok && result.data) {
            const available = collectAvailableSlots(result.data.calendar);
            setSlots(available);
            setSelectedDietitianName(result.data.selectedDietitian?.name ?? selectedDietitianName);
            const firstDay = available[0]?.value.slice(0, 10) ?? null;
            setSelectedDay(firstDay);
        } else {
            setSlots([]);
            setLoadError(result.ok ? 'Could not load calendar.' : result.message);
        }

        setCalendarLoading(false);
    }, [selectedDietitianName]);

    useEffect(() => {
        if (selectedDietitianId) {
            void loadCalendar(selectedDietitianId, selectedMonth);
        }
    }, [selectedDietitianId, selectedMonth, loadCalendar]);

    function clearDietitian() {
        setSelectedDietitianId(null);
        setSelectedDietitianName(null);
        setSelectedMonth(currentMonth());
        setSlots([]);
        setSelectedDay(null);
        setSelectedSlot(null);
        setQuery('');
        setDietitians([]);
        setLoadError(null);
        setSubmitError(null);
    }

    function onSelectDietitian(id: string, name: string) {
        Keyboard.dismiss();
        setSelectedDietitianId(id);
        setSelectedDietitianName(name);
        setSelectedMonth(currentMonth());
        setDietitians([]);
        setQuery('');
        setSubmitError(null);
    }

    async function onSubmit() {
        if (!selectedDietitianId || !selectedSlot) {
            setSubmitError('Select a date and time slot.');
            return;
        }

        setSubmitting(true);
        setSubmitError(null);

        const result = await apiPost<BookingStoreResponse>(apiRoutes.bookings.store, {
            dietitian_id: selectedDietitianId,
            scheduled_at: selectedSlot,
        });

        setSubmitting(false);

        if (!result.ok) {
            setSubmitError(result.message);
            return;
        }

        await refreshUser();
        Alert.alert('Booked', result.message, [
            { text: 'OK', onPress: () => router.replace('/(app)/bookings') },
        ]);
    }

    return (
        <>
            <Stack.Screen options={{ headerShown: false }} />
            <CustomerProgramGate>
                <AppScreen
                    keyboard={!selectedDietitianId}
                    scroll
                    showLogo={false}
                    subtitle="Pick a time"
                    title="Book consultation"
                >
                    {selectedDietitianId ? (
                        <View style={styles.selectedCard}>
                            <View style={styles.selectedText}>
                                <Text style={styles.selectedLabel}>Dietitian</Text>
                                <Text style={styles.selectedName}>{selectedDietitianName}</Text>
                            </View>
                            <Pressable hitSlop={8} onPress={clearDietitian}>
                                <Text style={styles.changeLink}>Change</Text>
                            </Pressable>
                        </View>
                    ) : (
                        <>
                            <TextField
                                autoCapitalize="none"
                                label="Search dietitian"
                                onChangeText={setQuery}
                                onSubmitEditing={() => Keyboard.dismiss()}
                                placeholder="Type a name…"
                                returnKeyType="search"
                                value={query}
                            />

                            {searching ? <ActivityIndicator color={colors.brandDark} /> : null}

                            {dietitians.length > 0 ? (
                                <View style={styles.results}>
                                    {dietitians.map((d) => (
                                        <Pressable
                                            key={d.id}
                                            onPress={() => onSelectDietitian(d.id, d.name)}
                                            style={styles.resultRow}
                                        >
                                            <Text style={styles.resultName}>{d.name}</Text>
                                            {d.title ? (
                                                <Text style={styles.resultMeta}>{d.title}</Text>
                                            ) : null}
                                        </Pressable>
                                    ))}
                                </View>
                            ) : null}
                        </>
                    )}

                    {selectedDietitianId && selectedDietitianName ? (
                        <BookingSlotPicker
                            dietitianName={selectedDietitianName}
                            loadError={loadError}
                            loading={calendarLoading}
                            month={selectedMonth}
                            onMonthChange={setSelectedMonth}
                            onRetry={() => {
                                if (selectedDietitianId) {
                                    void loadCalendar(selectedDietitianId, selectedMonth);
                                }
                            }}
                            onSelectDay={setSelectedDay}
                            onSelectSlot={setSelectedSlot}
                            selectedDay={selectedDay}
                            selectedSlot={selectedSlot}
                            slots={slots}
                        />
                    ) : null}

                    {submitError ? <Text style={styles.error}>{submitError}</Text> : null}

                    <Button
                        disabled={!selectedDietitianId || !selectedSlot}
                        label="Confirm booking request"
                        loading={submitting}
                        onPress={onSubmit}
                    />
                </AppScreen>
            </CustomerProgramGate>
        </>
    );
}

const styles = StyleSheet.create({
    results: {
        backgroundColor: colors.card,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: colors.border,
        overflow: 'hidden',
    },
    resultRow: {
        padding: spacing.md,
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
    },
    resultName: {
        fontSize: 16,
        fontWeight: '600',
        color: colors.text,
    },
    resultMeta: {
        fontSize: 13,
        color: colors.textMuted,
    },
    selectedCard: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.md,
        padding: spacing.md,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: colors.border,
        backgroundColor: colors.card,
    },
    selectedText: { flex: 1, minWidth: 0 },
    selectedLabel: { fontSize: 12, fontWeight: '600', color: colors.textMuted },
    selectedName: { fontSize: 16, fontWeight: '700', color: colors.text, marginTop: 2 },
    changeLink: { fontSize: 14, fontWeight: '700', color: colors.brandDark },
    error: {
        color: colors.error,
        fontSize: 14,
    },
});
