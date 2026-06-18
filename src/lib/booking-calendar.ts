import type { BookingCalendarData, CalendarSlot, SchedulingConflict } from '@/src/types/bookings';

export type CollectBookableSlotsOptions = {
    /** Admin / dietitian / advisor — no customer hold or conflict rules. */
    staffBooking?: boolean;
    blockedCalendarDays?: string[];
    dietitianBlockedCalendarDays?: string[];
    customerSchedulingConflicts?: SchedulingConflict[];
};

export function currentMonthKey(): string {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}

export function shiftMonth(month: string, delta: number): string {
    const [year, mon] = month.split('-').map(Number);
    const date = new Date(year, mon - 1 + delta, 1);
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
}

export function compareMonthKeys(a: string, b: string): number {
    return a.localeCompare(b);
}

export function canGoToPreviousMonth(month: string): boolean {
    return compareMonthKeys(month, currentMonthKey()) > 0;
}

export function clampMonthToEarliest(month: string): string {
    return compareMonthKeys(month, currentMonthKey()) < 0 ? currentMonthKey() : month;
}

/** Calendar day key (YYYY-MM-DD) — aligned with web bookingDateKey usage. */
export function todayDateKey(): string {
    return new Date().toISOString().slice(0, 10);
}

export function appointmentRangesOverlap(
    aStartIso: string,
    aDurationMinutes: number,
    bStartIso: string,
    bDurationMinutes: number,
): boolean {
    const a0 = new Date(aStartIso).getTime();
    const a1 = a0 + aDurationMinutes * 60_000;
    const b0 = new Date(bStartIso).getTime();
    const b1 = b0 + bDurationMinutes * 60_000;

    return a0 < b1 && a1 > b0;
}

export function dayBlockReason(
    dateKey: string,
    options: CollectBookableSlotsOptions,
): 'hold' | 'dietitian' | null {
    if (options.staffBooking) {
        return null;
    }

    if (options.blockedCalendarDays?.includes(dateKey)) {
        return 'hold';
    }

    if (options.dietitianBlockedCalendarDays?.includes(dateKey)) {
        return 'dietitian';
    }

    return null;
}

export function slotHasTimeConflict(slot: CalendarSlot, conflicts: SchedulingConflict[]): boolean {
    if (!conflicts.length) {
        return false;
    }

    const duration = slot.duration_minutes ?? 30;

    return conflicts.some((conflict) =>
        appointmentRangesOverlap(slot.value, duration, conflict.scheduled_at, conflict.duration_minutes),
    );
}

export function isSlotBookable(slot: CalendarSlot, options: CollectBookableSlotsOptions): boolean {
    if (slot.state !== 'available') {
        return false;
    }

    const dateKey = slot.value.slice(0, 10);
    if (dateKey < todayDateKey()) {
        return false;
    }

    if (dayBlockReason(dateKey, options)) {
        return false;
    }

    if (!options.staffBooking && slotHasTimeConflict(slot, options.customerSchedulingConflicts ?? [])) {
        return false;
    }

    return true;
}

export function collectBookableSlots(
    calendar: BookingCalendarData | null | undefined,
    options: CollectBookableSlotsOptions = {},
): CalendarSlot[] {
    const slots: CalendarSlot[] = [];

    Object.values(calendar?.days ?? {}).forEach((day) => {
        day.slots.forEach((slot) => {
            if (isSlotBookable(slot, options)) {
                slots.push(slot);
            }
        });
    });

    return slots.sort((a, b) => a.value.localeCompare(b.value));
}

export function firstBookableDay(slots: CalendarSlot[]): string | null {
    return slots[0]?.value.slice(0, 10) ?? null;
}

export function dietitianDisplayName(
    dietitianId: string | null,
    dietitians: Array<{ id: string; name: string }>,
    fallback = 'Dietitian',
): string {
    if (!dietitianId) {
        return fallback;
    }

    return dietitians.find((d) => d.id === dietitianId)?.name ?? fallback;
}
