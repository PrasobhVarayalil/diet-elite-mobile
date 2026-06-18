import { BookingSlotPicker } from '@/components/bookings/BookingSlotPicker';
import { AppHeader } from '@/components/ui/AppHeader';
import { Button } from '@/components/ui/Button';
import { TextField } from '@/components/ui/TextField';
import { colors, spacing } from '@/constants/theme';
import { apiGet, apiPost } from '@/src/lib/api-client';
import { apiRoutes } from '@/src/lib/api-routes';
import {
    clampMonthToEarliest,
    collectBookableSlots,
    currentMonthKey,
    dietitianDisplayName,
    firstBookableDay,
} from '@/src/lib/booking-calendar';
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

export type StaffBookingMode = 'dietitian' | 'admin' | 'advisor';

type Props = {
    mode: StaffBookingMode;
    title: string;
    subtitle: string;
    submitLabel?: string;
    summaryTitle?: string;
};

export function StaffBookingCreateScreen({
    mode,
    title,
    subtitle,
    submitLabel = 'Book appointment',
    summaryTitle = 'Appointment',
}: Props) {
    const router = useRouter();
    const [query, setQuery] = useState('');
    const [searching, setSearching] = useState(false);
    const [customers, setCustomers] = useState<CustomerResult[]>([]);
    const [selectedCustomer, setSelectedCustomer] = useState<CustomerResult | null>(null);
    const [dietitians, setDietitians] = useState<DietitianSearchResult[]>([]);
    const [selectedDietitianId, setSelectedDietitianId] = useState<string | null>(null);
    const [selectedMonth, setSelectedMonth] = useState(currentMonthKey);
    const [slots, setSlots] = useState<CalendarSlot[]>([]);
    const [selectedDay, setSelectedDay] = useState<string | null>(null);
    const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
    const [calendarLoading, setCalendarLoading] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [loadError, setLoadError] = useState<string | null>(null);
    const [submitError, setSubmitError] = useState<string | null>(null);

    const searchPath =
        mode === 'admin'
            ? apiRoutes.admin.customers.search
            : mode === 'advisor'
              ? apiRoutes.advisor.customersSearch
              : apiRoutes.dietitian.customersSearch;

    const createPath =
        mode === 'admin'
            ? apiRoutes.admin.bookings.create
            : mode === 'advisor'
              ? apiRoutes.advisor.bookingsCreate
              : apiRoutes.dietitian.appointmentsCreate;

    const storePath =
        mode === 'admin'
            ? apiRoutes.admin.bookings.store
            : mode === 'advisor'
              ? apiRoutes.advisor.bookingsStore
              : apiRoutes.dietitian.appointmentsStore;

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

    const loadCalendar = useCallback(
        async (customerId: string, month: string, dietitianId?: string | null) => {
            setCalendarLoading(true);
            setLoadError(null);
            setSelectedSlot(null);
            setSelectedDay(null);

            const safeMonth = clampMonthToEarliest(month);
            if (safeMonth !== month) {
                setSelectedMonth(safeMonth);
            }

            let path = `${createPath}?user_id=${encodeURIComponent(customerId)}&month=${safeMonth}`;
            if ((mode === 'admin' || mode === 'advisor') && dietitianId) {
                path += `&dietitian_id=${encodeURIComponent(dietitianId)}`;
            }

            const result = await apiGet<BookingCalendarResponse>(path);

            if (result.ok && result.data) {
                const list = result.data.dietitians ?? [];
                setDietitians(list);
                const did =
                    mode === 'dietitian'
                        ? (result.data.selectedDietitianId ?? list[0]?.id ?? null)
                        : (dietitianId ?? result.data.selectedDietitianId ?? list[0]?.id ?? null);
                setSelectedDietitianId(did);
                const bookable = collectBookableSlots(result.data.calendar, { staffBooking: true });
                setSlots(bookable);
                setSelectedDay(firstBookableDay(bookable));
            } else {
                setSlots([]);
                setLoadError(result.ok ? 'Could not load calendar.' : result.message);
            }

            setCalendarLoading(false);
        },
        [createPath, mode],
    );

    useEffect(() => {
        if (!selectedCustomer) {
            return;
        }

        void loadCalendar(selectedCustomer.id, selectedMonth, selectedDietitianId);
    }, [selectedCustomer, selectedMonth, selectedDietitianId, loadCalendar]);

    function clearCustomer() {
        setSelectedCustomer(null);
        setQuery('');
        setCustomers([]);
        setDietitians([]);
        setSelectedDietitianId(null);
        setSelectedMonth(currentMonthKey());
        setSlots([]);
        setSelectedDay(null);
        setSelectedSlot(null);
        setLoadError(null);
        setSubmitError(null);
    }

    function onSelectCustomer(customer: CustomerResult) {
        Keyboard.dismiss();
        setSelectedCustomer(customer);
        setCustomers([]);
        setQuery(customer.name);
        setSelectedMonth(currentMonthKey());
        setSubmitError(null);
    }

    function onSelectDietitian(dietitianId: string) {
        Keyboard.dismiss();
        setSelectedDietitianId(dietitianId);
        setSelectedSlot(null);
    }

    async function onSubmit() {
        if (!selectedCustomer || !selectedSlot) {
            setSubmitError('Select a customer and time slot.');
            return;
        }
        if ((mode === 'admin' || mode === 'advisor') && !selectedDietitianId) {
            setSubmitError('Select a dietitian.');
            return;
        }

        setSubmitting(true);
        setSubmitError(null);

        const payload: Record<string, string> = {
            user_id: selectedCustomer.id,
            scheduled_at: selectedSlot,
        };
        if ((mode === 'admin' || mode === 'advisor') && selectedDietitianId) {
            payload.dietitian_id = selectedDietitianId;
        }

        const result = await apiPost(storePath, payload);
        setSubmitting(false);

        if (result.ok) {
            Alert.alert('Booked', result.message, [{ text: 'OK', onPress: () => router.back() }]);
        } else {
            setSubmitError(result.message);
        }
    }

    const showDietitianPicker = (mode === 'admin' || mode === 'advisor') && dietitians.length > 0;
    const pickerName = dietitianDisplayName(selectedDietitianId, dietitians, 'Dietitian');

    return (
        <View style={styles.root}>
            <Stack.Screen options={{ headerShown: false }} />
            <AppHeader subtitle={subtitle} title={title} />
            <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
                {selectedCustomer ? (
                    <View style={styles.selectedCard}>
                        <View style={styles.selectedText}>
                            <Text style={styles.selectedLabel}>Customer</Text>
                            <Text style={styles.selectedName}>{selectedCustomer.name}</Text>
                        </View>
                        <Pressable hitSlop={8} onPress={clearCustomer}>
                            <Text style={styles.changeLink}>Change</Text>
                        </Pressable>
                    </View>
                ) : (
                    <>
                        <TextField
                            autoCapitalize="none"
                            label="Search customer"
                            onChangeText={setQuery}
                            onSubmitEditing={() => Keyboard.dismiss()}
                            placeholder={
                                mode === 'advisor' ? 'Eligible new customer' : 'Name, email, or member code'
                            }
                            returnKeyType="search"
                            value={query}
                        />
                        {searching ? <ActivityIndicator color={colors.brandDark} /> : null}
                        {customers.length > 0 ? (
                            <View style={styles.results}>
                                {customers.map((customer) => (
                                    <Pressable
                                        key={customer.id}
                                        onPress={() => onSelectCustomer(customer)}
                                        style={styles.resultRow}
                                    >
                                        <Text style={styles.resultName}>{customer.name}</Text>
                                        {customer.email || customer.member_code ? (
                                            <Text style={styles.resultMeta}>
                                                {customer.email ?? customer.member_code}
                                            </Text>
                                        ) : null}
                                    </Pressable>
                                ))}
                            </View>
                        ) : null}
                    </>
                )}

                {selectedCustomer && showDietitianPicker ? (
                    <View style={styles.section}>
                        <Text style={styles.sectionLabel}>Dietitian</Text>
                        <View style={styles.chips}>
                            {dietitians.map((d) => (
                                <Pressable
                                    key={d.id}
                                    onPress={() => onSelectDietitian(d.id)}
                                    style={[styles.chip, selectedDietitianId === d.id && styles.chipActive]}
                                >
                                    <Text
                                        style={[
                                            styles.chipText,
                                            selectedDietitianId === d.id && styles.chipTextActive,
                                        ]}
                                    >
                                        {d.name}
                                    </Text>
                                </Pressable>
                            ))}
                        </View>
                    </View>
                ) : null}

                {selectedCustomer && (mode === 'dietitian' || selectedDietitianId) ? (
                    <BookingSlotPicker
                        dietitianName={pickerName}
                        emptyHint="Try another month or pick a different dietitian."
                        loadError={loadError}
                        loading={calendarLoading}
                        month={selectedMonth}
                        onMonthChange={setSelectedMonth}
                        onRetry={() => {
                            if (selectedCustomer) {
                                void loadCalendar(selectedCustomer.id, selectedMonth, selectedDietitianId);
                            }
                        }}
                        onSelectDay={setSelectedDay}
                        onSelectSlot={setSelectedSlot}
                        selectedDay={selectedDay}
                        selectedSlot={selectedSlot}
                        slots={slots}
                        summaryTitle={summaryTitle}
                    />
                ) : null}

                {submitError ? <Text style={styles.error}>{submitError}</Text> : null}
                <Button
                    disabled={!selectedCustomer || !selectedSlot}
                    label={submitLabel}
                    loading={submitting}
                    onPress={onSubmit}
                />
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    root: { flex: 1, backgroundColor: colors.background },
    content: { padding: spacing.lg, gap: spacing.md, paddingBottom: spacing.xl },
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
    resultName: { fontSize: 16, fontWeight: '600', color: colors.text },
    resultMeta: { fontSize: 13, color: colors.textMuted },
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
