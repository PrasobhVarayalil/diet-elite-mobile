import { Button } from '@/components/ui/Button';
import { colors, spacing } from '@/constants/theme';
import type { CalendarSlot } from '@/src/types/bookings';
import { Ionicons } from '@expo/vector-icons';
import { useMemo } from 'react';
import {
    ActivityIndicator,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    View,
} from 'react-native';

function formatMonthLabel(month: string): string {
    const [year, mon] = month.split('-').map(Number);
    const date = new Date(year, mon - 1, 1);
    return date.toLocaleDateString(undefined, { month: 'long', year: 'numeric' });
}

function formatDayLabel(dayKey: string): string {
    const [year, month, day] = dayKey.split('-').map(Number);
    const date = new Date(year, month - 1, day);
    return date.toLocaleDateString(undefined, { weekday: 'short', day: 'numeric' });
}

function formatDayHeading(dayKey: string): string {
    const [year, month, day] = dayKey.split('-').map(Number);
    const date = new Date(year, month - 1, day);
    return date.toLocaleDateString(undefined, {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
    });
}

function formatSlotSummary(iso: string): string {
    return new Date(iso).toLocaleString(undefined, {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
    });
}

function shiftMonth(month: string, delta: number): string {
    const [year, mon] = month.split('-').map(Number);
    const date = new Date(year, mon - 1 + delta, 1);
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
}

type Props = {
    dietitianName: string;
    month: string;
    loading: boolean;
    loadError: string | null;
    slots: CalendarSlot[];
    selectedDay: string | null;
    selectedSlot: string | null;
    onMonthChange: (month: string) => void;
    onRetry: () => void;
    onSelectDay: (day: string) => void;
    onSelectSlot: (value: string) => void;
};

export function BookingSlotPicker({
    dietitianName,
    month,
    loading,
    loadError,
    slots,
    selectedDay,
    selectedSlot,
    onMonthChange,
    onRetry,
    onSelectDay,
    onSelectSlot,
}: Props) {
    const dayGroups = useMemo(() => {
        const grouped = new Map<string, CalendarSlot[]>();
        slots.forEach((slot) => {
            const day = slot.value.slice(0, 10);
            const list = grouped.get(day) ?? [];
            list.push(slot);
            grouped.set(day, list);
        });
        return [...grouped.entries()].sort(([a], [b]) => a.localeCompare(b));
    }, [slots]);

    const activeDay = selectedDay ?? dayGroups[0]?.[0] ?? null;
    const daySlots = activeDay ? (dayGroups.find(([d]) => d === activeDay)?.[1] ?? []) : [];

    return (
        <View style={styles.root}>
            <Text style={styles.heading}>Pick date & time</Text>
            <Text style={styles.subheading}>with {dietitianName}</Text>

            <View style={styles.monthRow}>
                <Pressable
                    accessibilityLabel="Previous month"
                    hitSlop={8}
                    onPress={() => onMonthChange(shiftMonth(month, -1))}
                    style={styles.monthBtn}
                >
                    <Ionicons color={colors.brandDark} name="chevron-back" size={22} />
                </Pressable>
                <Text style={styles.monthLabel}>{formatMonthLabel(month)}</Text>
                <Pressable
                    accessibilityLabel="Next month"
                    hitSlop={8}
                    onPress={() => onMonthChange(shiftMonth(month, 1))}
                    style={styles.monthBtn}
                >
                    <Ionicons color={colors.brandDark} name="chevron-forward" size={22} />
                </Pressable>
            </View>

            {loading ? (
                <View style={styles.center}>
                    <ActivityIndicator color={colors.brandDark} />
                    <Text style={styles.meta}>Loading available times…</Text>
                </View>
            ) : loadError ? (
                <View style={styles.errorBox}>
                    <Text style={styles.errorText}>{loadError}</Text>
                    <Button
                        label="Try again"
                        onPress={onRetry}
                        variant="secondary"
                    />
                </View>
            ) : dayGroups.length === 0 ? (
                <View style={styles.emptyBox}>
                    <Text style={styles.emptyTitle}>No open slots this month</Text>
                    <Text style={styles.meta}>Try another month or choose a different dietitian.</Text>
                    <Button
                        label="Next month"
                        onPress={() => onMonthChange(shiftMonth(month, 1))}
                        variant="secondary"
                    />
                </View>
            ) : (
                <>
                    <Text style={styles.stepLabel}>1. Choose a date</Text>
                    <ScrollView
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        contentContainerStyle={styles.dayStrip}
                    >
                        {dayGroups.map(([day, items]) => {
                            const selected = day === activeDay;
                            return (
                                <Pressable
                                    key={day}
                                    onPress={() => onSelectDay(day)}
                                    style={[styles.dayPill, selected && styles.dayPillSelected]}
                                >
                                    <Text style={[styles.dayWeekday, selected && styles.dayTextSelected]}>
                                        {formatDayLabel(day).split(' ')[0]}
                                    </Text>
                                    <Text style={[styles.dayNumber, selected && styles.dayTextSelected]}>
                                        {day.split('-')[2]}
                                    </Text>
                                    <Text style={[styles.dayCount, selected && styles.dayTextSelected]}>
                                        {items.length} slots
                                    </Text>
                                </Pressable>
                            );
                        })}
                    </ScrollView>

                    {activeDay ? (
                        <>
                            <Text style={styles.stepLabel}>2. Choose a time</Text>
                            <Text style={styles.dayHeading}>{formatDayHeading(activeDay)}</Text>
                            <View style={styles.slotGrid}>
                                {daySlots.map((item) => {
                                    const selected = selectedSlot === item.value;
                                    return (
                                        <Pressable
                                            key={item.value}
                                            onPress={() => onSelectSlot(item.value)}
                                            style={[styles.slotChip, selected && styles.slotSelected]}
                                        >
                                            <Text
                                                style={[styles.slotText, selected && styles.slotTextSelected]}
                                            >
                                                {item.label}
                                            </Text>
                                        </Pressable>
                                    );
                                })}
                            </View>
                        </>
                    ) : null}
                </>
            )}

            {selectedSlot ? (
                <View style={styles.summary}>
                    <Text style={styles.summaryLabel}>Your appointment</Text>
                    <Text style={styles.summaryValue}>{formatSlotSummary(selectedSlot)}</Text>
                    <Text style={styles.summaryMeta}>with {dietitianName}</Text>
                </View>
            ) : null}
        </View>
    );
}

const styles = StyleSheet.create({
    root: { gap: spacing.md },
    heading: { fontSize: 18, fontWeight: '700', color: colors.text },
    subheading: { fontSize: 14, color: colors.textMuted, marginTop: -spacing.sm },
    monthRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: colors.card,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: colors.border,
        paddingVertical: spacing.sm,
        paddingHorizontal: spacing.xs,
    },
    monthBtn: { padding: spacing.sm },
    monthLabel: { fontSize: 16, fontWeight: '700', color: colors.text },
    center: { alignItems: 'center', gap: spacing.sm, paddingVertical: spacing.lg },
    meta: { fontSize: 14, color: colors.textMuted, textAlign: 'center' },
    errorBox: {
        gap: spacing.md,
        padding: spacing.md,
        borderRadius: 12,
        backgroundColor: colors.errorBg,
        borderWidth: 1,
        borderColor: colors.error,
    },
    errorText: { color: colors.error, fontSize: 14, lineHeight: 20 },
    emptyBox: {
        gap: spacing.sm,
        padding: spacing.md,
        borderRadius: 12,
        backgroundColor: colors.card,
        borderWidth: 1,
        borderColor: colors.border,
    },
    emptyTitle: { fontSize: 16, fontWeight: '600', color: colors.text },
    stepLabel: {
        fontSize: 12,
        fontWeight: '700',
        letterSpacing: 0.4,
        textTransform: 'uppercase',
        color: colors.textMuted,
    },
    dayStrip: { gap: spacing.sm, paddingVertical: spacing.xs },
    dayPill: {
        minWidth: 72,
        paddingVertical: spacing.sm,
        paddingHorizontal: spacing.sm,
        borderRadius: 14,
        borderWidth: 1,
        borderColor: colors.border,
        backgroundColor: colors.white,
        alignItems: 'center',
        gap: 2,
    },
    dayPillSelected: {
        backgroundColor: colors.brandDark,
        borderColor: colors.brandDark,
    },
    dayWeekday: { fontSize: 11, fontWeight: '600', color: colors.textMuted },
    dayNumber: { fontSize: 20, fontWeight: '800', color: colors.text },
    dayCount: { fontSize: 10, color: colors.textMuted },
    dayTextSelected: { color: colors.white },
    dayHeading: { fontSize: 15, fontWeight: '600', color: colors.text },
    slotGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: spacing.sm,
    },
    slotChip: {
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: colors.border,
        backgroundColor: colors.white,
        minWidth: '30%',
        alignItems: 'center',
    },
    slotSelected: {
        backgroundColor: colors.brandDark,
        borderColor: colors.brandDark,
    },
    slotText: { fontSize: 14, fontWeight: '600', color: colors.text },
    slotTextSelected: { color: colors.white },
    summary: {
        padding: spacing.md,
        borderRadius: 14,
        backgroundColor: colors.brandMuted,
        borderWidth: 1,
        borderColor: colors.border,
        gap: 4,
    },
    summaryLabel: {
        fontSize: 12,
        fontWeight: '700',
        textTransform: 'uppercase',
        letterSpacing: 0.4,
        color: colors.brandDark,
    },
    summaryValue: { fontSize: 16, fontWeight: '700', color: colors.text },
    summaryMeta: { fontSize: 13, color: colors.textMuted },
});
