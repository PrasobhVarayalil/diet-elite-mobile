import { AppHeader } from '@/components/ui/AppHeader';
import { Button } from '@/components/ui/Button';
import { TextField } from '@/components/ui/TextField';
import { colors, spacing } from '@/constants/theme';
import { apiGet, apiPost } from '@/src/lib/api-client';
import { apiRoutes } from '@/src/lib/api-routes';
import type { BookingCalendarResponse, CalendarSlot, DietitianSearchResult } from '@/src/types/bookings';
import { Stack, useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
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

type CustomerResult = { id: string; name: string; email?: string; member_code?: string };

export type StaffBookingMode = 'dietitian' | 'admin';

type Props = {
    mode: StaffBookingMode;
    title: string;
    subtitle: string;
};

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

export function StaffBookingCreateScreen({ mode, title, subtitle }: Props) {
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

    const searchPath = mode === 'admin' ? apiRoutes.admin.customers.search : apiRoutes.dietitian.customersSearch;
    const createPath = mode === 'admin' ? apiRoutes.admin.bookings.create : apiRoutes.dietitian.appointmentsCreate;
    const storePath = mode === 'admin' ? apiRoutes.admin.bookings.store : apiRoutes.dietitian.appointmentsStore;

    const searchCustomers = useCallback(
        async (term: string) => {
            if (term.trim().length < 2) {
                setCustomers([]);
                return;
            }
            setSearching(true);
            const path = `${searchPath}?q=${encodeURIComponent(term.trim())}`;
            const result = await apiGet<{ customers?: CustomerResult[] }>(path);
            if (result.ok) {
                setCustomers(result.data?.customers ?? []);
            }
            setSearching(false);
        },
        [searchPath],
    );

    useEffect(() => {
        const timer = setTimeout(() => searchCustomers(query), 300);
        return () => clearTimeout(timer);
    }, [query, searchCustomers]);

    const loadForm = useCallback(
        async (customerId: string, dietitianId?: string) => {
            setCalendarLoading(true);
            setError(null);
            setSelectedSlot(null);
            let path = `${createPath}?user_id=${encodeURIComponent(customerId)}&month=${currentMonth()}`;
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
        },
        [createPath],
    );

    useEffect(() => {
        if (!selectedCustomer) {
            return;
        }
        loadForm(
            selectedCustomer.id,
            mode === 'admin' ? (selectedDietitianId ?? undefined) : undefined,
        );
    }, [selectedCustomer, loadForm, mode, selectedDietitianId]);

    function onSelectDietitian(dietitianId: string) {
        Keyboard.dismiss();
        setSelectedDietitianId(dietitianId);
    }

    async function onSubmit() {
        if (!selectedCustomer || !selectedSlot) {
            setError('Select customer and time slot.');
            return;
        }
        if (mode === 'admin' && !selectedDietitianId) {
            setError('Select a dietitian.');
            return;
        }

        setSubmitting(true);
        const payload: Record<string, string> = {
            user_id: selectedCustomer.id,
            scheduled_at: selectedSlot,
        };
        if (mode === 'admin' && selectedDietitianId) {
            payload.dietitian_id = selectedDietitianId;
        }

        const result = await apiPost(storePath, payload);
        setSubmitting(false);
        if (result.ok) {
            Alert.alert('Booked', result.message, [{ text: 'OK', onPress: () => router.back() }]);
        } else {
            setError(result.message);
        }
    }

    const showDietitianPicker = mode === 'admin' && dietitians.length > 0;

    return (
        <View style={styles.root}>
            <Stack.Screen options={{ headerShown: false }} />
            <AppHeader subtitle={subtitle} title={title} />
            <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
                <TextField label="Search customer" onChangeText={setQuery} placeholder="Name, email, or member code" value={query} />
                {searching ? <ActivityIndicator color={colors.brandDark} /> : null}
                {customers.map((customer) => (
                    <Pressable
                        key={customer.id}
                        onPress={() => {
                            setSelectedCustomer(customer);
                            setCustomers([]);
                            setQuery(customer.name);
                        }}
                        style={[styles.pickRow, selectedCustomer?.id === customer.id && styles.pickSelected]}
                    >
                        <Text style={styles.pickTitle}>{customer.name}</Text>
                        <Text style={styles.pickMeta}>{customer.email ?? customer.member_code ?? ''}</Text>
                    </Pressable>
                ))}

                {selectedCustomer ? (
                    <>
                        <Text style={styles.section}>Selected: {selectedCustomer.name}</Text>
                        {showDietitianPicker ? (
                            <>
                                <Text style={styles.hint}>Dietitian</Text>
                                <View style={styles.chips}>
                                    {dietitians.map((d) => (
                                        <Pressable
                                            key={d.id}
                                            onPress={() => onSelectDietitian(d.id)}
                                            style={[styles.chip, selectedDietitianId === d.id && styles.chipActive]}
                                        >
                                            <Text style={[styles.chipText, selectedDietitianId === d.id && styles.chipTextActive]}>
                                                {d.name}
                                            </Text>
                                        </Pressable>
                                    ))}
                                </View>
                            </>
                        ) : null}
                        {calendarLoading ? (
                            <ActivityIndicator color={colors.brandDark} style={{ marginTop: spacing.md }} />
                        ) : (
                            <>
                                <Text style={styles.hint}>Available slots</Text>
                                {slots.length === 0 ? (
                                    <Text style={styles.pickMeta}>No open slots this month.</Text>
                                ) : (
                                    slots.map((slot) => (
                                        <Pressable
                                            key={slot.value}
                                            onPress={() => setSelectedSlot(slot.value)}
                                            style={[styles.pickRow, selectedSlot === slot.value && styles.pickSelected]}
                                        >
                                            <Text style={styles.pickTitle}>{slot.label}</Text>
                                        </Pressable>
                                    ))
                                )}
                            </>
                        )}
                    </>
                ) : null}

                {error ? <Text style={styles.error}>{error}</Text> : null}
                <Button label="Book appointment" loading={submitting} onPress={onSubmit} />
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    root: { flex: 1, backgroundColor: colors.background },
    content: { padding: spacing.lg, gap: spacing.sm, paddingBottom: spacing.xl },
    section: { fontSize: 16, fontWeight: '700', color: colors.text, marginTop: spacing.md },
    hint: { fontSize: 13, fontWeight: '600', color: colors.textMuted, marginTop: spacing.sm },
    pickRow: {
        backgroundColor: colors.card,
        borderRadius: 12,
        padding: spacing.md,
        borderWidth: 1,
        borderColor: colors.border,
        gap: 2,
    },
    pickSelected: { borderColor: colors.brandDark, backgroundColor: '#eef8ea' },
    pickTitle: { fontSize: 15, fontWeight: '600', color: colors.text },
    pickMeta: { fontSize: 13, color: colors.textMuted },
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
    chipTextActive: { color: '#fff' },
    error: { color: colors.error, fontSize: 14 },
});
