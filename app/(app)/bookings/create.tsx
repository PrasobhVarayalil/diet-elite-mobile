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
import { useCallback, useEffect, useMemo, useState } from 'react';
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
    const { user, refreshUser } = useAuth();
    const [query, setQuery] = useState('');
    const [searching, setSearching] = useState(false);
    const [dietitians, setDietitians] = useState<DietitianSearchResponse['dietitians']>([]);
    const [selectedDietitianId, setSelectedDietitianId] = useState<string | null>(null);
    const [selectedDietitianName, setSelectedDietitianName] = useState<string | null>(null);
    const [calendarLoading, setCalendarLoading] = useState(false);
    const [slots, setSlots] = useState<CalendarSlot[]>([]);
    const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

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

    const loadCalendar = useCallback(async (dietitianId: string) => {
        setCalendarLoading(true);
        setError(null);
        setSelectedSlot(null);

        const path = `${apiRoutes.bookings.calendar}?dietitian_id=${encodeURIComponent(dietitianId)}&month=${currentMonth()}`;
        const result = await apiGet<BookingCalendarResponse>(path);

        if (result.ok && result.data) {
            setSlots(collectAvailableSlots(result.data.calendar));
            setSelectedDietitianName(result.data.selectedDietitian?.name ?? selectedDietitianName);
        } else {
            setSlots([]);
            setError(result.ok ? 'Could not load calendar.' : result.message);
        }

        setCalendarLoading(false);
    }, [selectedDietitianName]);

    function clearDietitian() {
        setSelectedDietitianId(null);
        setSelectedDietitianName(null);
        setSlots([]);
        setSelectedSlot(null);
        setQuery('');
        setDietitians([]);
        setError(null);
    }

    function onSelectDietitian(id: string, name: string) {
        Keyboard.dismiss();
        setSelectedDietitianId(id);
        setSelectedDietitianName(name);
        setDietitians([]);
        setQuery('');
        loadCalendar(id);
    }

    async function onSubmit() {
        if (!selectedDietitianId || !selectedSlot) {
            setError('Select a dietitian and time slot.');
            return;
        }

        setSubmitting(true);
        setError(null);

        const result = await apiPost<BookingStoreResponse>(apiRoutes.bookings.store, {
            dietitian_id: selectedDietitianId,
            scheduled_at: selectedSlot,
        });

        setSubmitting(false);

        if (!result.ok) {
            setError(result.message);
            return;
        }

        await refreshUser();
        Alert.alert('Booked', result.message, [
            { text: 'OK', onPress: () => router.replace('/(app)/bookings') },
        ]);
    }

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
                                        {d.title ? <Text style={styles.resultMeta}>{d.title}</Text> : null}
                                    </Pressable>
                                ))}
                            </View>
                        ) : null}
                    </>
                )}

                {selectedDietitianId ? (
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>
                            Available slots — {selectedDietitianName ?? 'Dietitian'}
                        </Text>
                        {calendarLoading ? (
                            <ActivityIndicator color={colors.brandDark} />
                        ) : slotSections.length === 0 ? (
                            <Text style={styles.meta}>No open slots this month. Try another dietitian.</Text>
                        ) : (
                            slotSections.map(([day, daySlots]) => (
                                <View key={day} style={styles.dayBlock}>
                                    <Text style={styles.dayLabel}>{day}</Text>
                                    <View style={styles.slotRow}>
                                        {daySlots.map((item) => (
                                            <Pressable
                                                key={item.value}
                                                onPress={() => setSelectedSlot(item.value)}
                                                style={[
                                                    styles.slotChip,
                                                    selectedSlot === item.value && styles.slotSelected,
                                                ]}
                                            >
                                                <Text
                                                    style={[
                                                        styles.slotText,
                                                        selectedSlot === item.value && styles.slotTextSelected,
                                                    ]}
                                                >
                                                    {item.label}
                                                </Text>
                                            </Pressable>
                                        ))}
                                    </View>
                                </View>
                            ))
                        )}
                    </View>
                ) : null}

                {error ? <Text style={styles.error}>{error}</Text> : null}

                <Button
                    disabled={!selectedDietitianId || !selectedSlot}
                    label="Submit booking request"
                    loading={submitting}
                    onPress={onSubmit}
                />
                </AppScreen>
            </CustomerProgramGate>
        </>
    );
}

const styles = StyleSheet.create({
    content: {
        padding: spacing.lg,
        gap: spacing.md,
        backgroundColor: colors.background,
    },
    blocked: {
        flex: 1,
        padding: spacing.lg,
        justifyContent: 'center',
        gap: spacing.md,
        backgroundColor: colors.background,
    },
    blockedTitle: {
        fontSize: 22,
        fontWeight: '700',
        color: colors.text,
    },
    blockedBody: {
        fontSize: 15,
        color: colors.textMuted,
        lineHeight: 22,
    },
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
    section: {
        gap: spacing.sm,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: colors.text,
    },
    dayBlock: {
        gap: spacing.sm,
        marginBottom: spacing.sm,
    },
    dayLabel: {
        fontSize: 14,
        fontWeight: '600',
        color: colors.textMuted,
    },
    slotRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: spacing.sm,
        width: '100%',
    },
    slotChip: {
        paddingHorizontal: 14,
        paddingVertical: 10,
        borderRadius: 999,
        borderWidth: 1,
        borderColor: colors.border,
        backgroundColor: colors.white,
    },
    slotSelected: {
        backgroundColor: colors.brandDark,
        borderColor: colors.brandDark,
    },
    slotText: {
        fontSize: 14,
        color: colors.text,
    },
    slotTextSelected: {
        color: colors.white,
        fontWeight: '600',
    },
    meta: {
        fontSize: 14,
        color: colors.textMuted,
    },
    error: {
        color: colors.error,
        fontSize: 14,
    },
});
