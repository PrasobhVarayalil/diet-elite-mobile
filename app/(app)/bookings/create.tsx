import { Button } from '@/components/ui/Button';
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
    FlatList,
    Pressable,
    ScrollView,
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

    const hasActivePlan = user?.has_active_plan === true;

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

    function onSelectDietitian(id: string, name: string) {
        setSelectedDietitianId(id);
        setSelectedDietitianName(name);
        setDietitians([]);
        setQuery(name);
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

    if (!hasActivePlan) {
        return (
            <>
                <Stack.Screen options={{ title: 'Book consultation' }} />
                <View style={styles.blocked}>
                    <Text style={styles.blockedTitle}>Active plan required</Text>
                    <Text style={styles.blockedBody}>
                        Enroll in a diet plan before booking a consultation.
                    </Text>
                    <Button label="Browse plans" onPress={() => router.push('/(app)/plans/index')} />
                </View>
            </>
        );
    }

    return (
        <>
            <Stack.Screen options={{ title: 'Book consultation' }} />
            <ScrollView contentContainerStyle={styles.content}>
                <TextField
                    autoCapitalize="none"
                    label="Search dietitian"
                    onChangeText={setQuery}
                    placeholder="Type a name…"
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
                                    <FlatList
                                        horizontal
                                        data={daySlots}
                                        keyExtractor={(item) => item.value}
                                        renderItem={({ item }) => (
                                            <Pressable
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
                                        )}
                                        showsHorizontalScrollIndicator={false}
                                    />
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
            </ScrollView>
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
    slotChip: {
        paddingHorizontal: 14,
        paddingVertical: 10,
        borderRadius: 999,
        borderWidth: 1,
        borderColor: colors.border,
        backgroundColor: colors.white,
        marginRight: spacing.sm,
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
