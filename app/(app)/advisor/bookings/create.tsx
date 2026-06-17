import { AppHeader } from '@/components/ui/AppHeader';
import { Button } from '@/components/ui/Button';
import { TextField } from '@/components/ui/TextField';
import { colors, spacing } from '@/constants/theme';
import { apiGet, apiPost } from '@/src/lib/api-client';
import { apiRoutes } from '@/src/lib/api-routes';
import type { BookingCalendarResponse, CalendarSlot, DietitianSearchResult } from '@/src/types/bookings';
import { Stack, useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Keyboard,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    View,
} from 'react-native';

type CustomerResult = { id: string; name: string; email?: string };

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

export default function AdvisorBookingCreateScreen() {
    const router = useRouter();
    const [query, setQuery] = useState('');
    const [searching, setSearching] = useState(false);
    const [customers, setCustomers] = useState<CustomerResult[]>([]);
    const [selectedCustomer, setSelectedCustomer] = useState<CustomerResult | null>(null);
    const [dietitians, setDietitians] = useState<DietitianSearchResult[]>([]);
    const [selectedDietitianId, setSelectedDietitianId] = useState<string | null>(null);
    const [slots, setSlots] = useState<CalendarSlot[]>([]);
    const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
    const [calendarLoading, setCalendarLoading] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const searchCustomers = useCallback(async (term: string) => {
        if (term.trim().length < 2) {
            setCustomers([]);
            return;
        }
        setSearching(true);
        const path = `${apiRoutes.advisor.customersSearch}?q=${encodeURIComponent(term.trim())}`;
        const result = await apiGet<{ customers?: CustomerResult[] }>(path);
        if (result.ok) {
            setCustomers(result.data?.customers ?? []);
        }
        setSearching(false);
    }, []);

    useEffect(() => {
        const timer = setTimeout(() => searchCustomers(query), 300);
        return () => clearTimeout(timer);
    }, [query, searchCustomers]);

    const loadForm = useCallback(async (customerId: string, dietitianId?: string) => {
        setCalendarLoading(true);
        setError(null);
        setSelectedSlot(null);
        let path = `${apiRoutes.advisor.bookingsCreate}?user_id=${encodeURIComponent(customerId)}&month=${currentMonth()}`;
        if (dietitianId) {
            path += `&dietitian_id=${encodeURIComponent(dietitianId)}`;
        }
        const result = await apiGet<BookingCalendarResponse & { dietitians?: DietitianSearchResult[] }>(path);
        if (result.ok && result.data) {
            setDietitians(result.data.dietitians ?? []);
            const did = dietitianId ?? result.data.selectedDietitianId ?? result.data.dietitians?.[0]?.id ?? null;
            setSelectedDietitianId(did);
            if (result.data.calendar) {
                setSlots(collectAvailableSlots(result.data.calendar));
            }
        } else {
            setError(result.ok ? 'Could not load calendar.' : result.message);
        }
        setCalendarLoading(false);
    }, []);

    useEffect(() => {
        if (selectedCustomer) {
            loadForm(selectedCustomer.id);
        }
    }, [selectedCustomer, loadForm]);

    function onSelectDietitian(id: string) {
        Keyboard.dismiss();
        setSelectedDietitianId(id);
        if (selectedCustomer) {
            loadForm(selectedCustomer.id, id);
        }
    }

    async function onSubmit() {
        if (!selectedCustomer || !selectedDietitianId || !selectedSlot) {
            setError('Select customer, dietitian, and time slot.');
            return;
        }
        setSubmitting(true);
        const result = await apiPost(apiRoutes.advisor.bookingsStore, {
            user_id: selectedCustomer.id,
            dietitian_id: selectedDietitianId,
            scheduled_at: selectedSlot,
        });
        setSubmitting(false);
        if (!result.ok) {
            setError(result.message);
            return;
        }
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
        <View style={styles.root}>
            <Stack.Screen options={{ headerShown: false }} />
            <AppHeader subtitle="Schedule first consultation" title="Book first consult" />
            <ScrollView
                contentContainerStyle={styles.content}
                keyboardDismissMode="on-drag"
                keyboardShouldPersistTaps="handled"
            >
                <TextField
                    autoCapitalize="none"
                    label="Search customer"
                    onChangeText={setQuery}
                    placeholder="Eligible new customer"
                    value={query}
                />
                {searching ? <ActivityIndicator color={colors.brandDark} /> : null}
                {customers.length > 0 && !selectedCustomer ? (
                    <View>
                        {customers.map((item) => (
                            <Pressable
                                key={item.id}
                                onPress={() => {
                                    Keyboard.dismiss();
                                    setSelectedCustomer(item);
                                }}
                                style={styles.pick}
                            >
                                <Text ellipsizeMode="tail" numberOfLines={1} style={styles.pickTitle}>
                                    {item.name}
                                </Text>
                            </Pressable>
                        ))}
                    </View>
                ) : null}
                {selectedCustomer ? (
                    <View style={styles.selected}>
                        <Text style={styles.selectedValue}>{selectedCustomer.name}</Text>
                        <Pressable onPress={() => setSelectedCustomer(null)}>
                            <Text style={styles.change}>Change customer</Text>
                        </Pressable>
                    </View>
                ) : null}

                {selectedCustomer && dietitians.length > 0 ? (
                    <>
                        <Text style={styles.section}>Dietitian</Text>
                        {dietitians.map((d) => (
                            <Pressable
                                key={d.id}
                                onPress={() => onSelectDietitian(d.id)}
                                style={[styles.plan, selectedDietitianId === d.id && styles.planActive]}
                            >
                                <Text style={styles.planText}>{d.name}</Text>
                                {d.title ? <Text style={styles.pickMeta}>{d.title}</Text> : null}
                            </Pressable>
                        ))}
                    </>
                ) : null}

                {calendarLoading ? <ActivityIndicator color={colors.brandDark} /> : null}
                {slotSections.map(([day, daySlots]) => (
                    <View key={day}>
                        <Text style={styles.section}>{day}</Text>
                        <View style={styles.slotRow}>
                            {daySlots.map((slot) => (
                                <Pressable
                                    key={slot.value}
                                    onPress={() => setSelectedSlot(slot.value)}
                                    style={[styles.slot, selectedSlot === slot.value && styles.slotActive]}
                                >
                                    <Text style={styles.slotText}>{slot.label}</Text>
                                </Pressable>
                            ))}
                        </View>
                    </View>
                ))}

                {error ? <Text style={styles.error}>{error}</Text> : null}
                <Button label="Book first consult" loading={submitting} onPress={onSubmit} />
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    root: { flex: 1, backgroundColor: colors.background },
    content: { padding: spacing.lg, gap: spacing.md, paddingBottom: spacing.xl },
    pick: {
        padding: spacing.md,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: colors.border,
        backgroundColor: colors.card,
    },
    pickTitle: { fontSize: 15, fontWeight: '600', color: colors.text },
    pickMeta: { fontSize: 13, color: colors.textMuted },
    selected: { padding: spacing.md, backgroundColor: colors.card, borderRadius: 12 },
    selectedValue: { fontSize: 16, fontWeight: '700', color: colors.text },
    change: { color: colors.brandDark, marginTop: spacing.sm, fontWeight: '600' },
    section: { fontSize: 14, fontWeight: '700', color: colors.text, marginTop: spacing.sm },
    plan: {
        padding: spacing.md,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: colors.border,
        backgroundColor: colors.card,
        marginBottom: spacing.sm,
    },
    planActive: { borderColor: colors.brandDark },
    planText: { fontSize: 15, fontWeight: '600', color: colors.text },
    slotRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
    slot: {
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.sm,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: colors.border,
        backgroundColor: colors.card,
    },
    slotActive: { borderColor: colors.brandDark, backgroundColor: '#f0f7e8' },
    slotText: { fontSize: 13, fontWeight: '600', color: colors.text },
    error: { color: colors.error },
});
