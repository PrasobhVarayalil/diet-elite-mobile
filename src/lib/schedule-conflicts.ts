export type ScheduleShift = {
    id?: string;
    day_of_week: number;
    start_time: string;
    end_time: string;
};

export function normalizeTime(time: string): string {
    const [hours = '0', minutes = '0'] = time.trim().split(':');
    return `${String(Number(hours)).padStart(2, '0')}:${String(Number(minutes)).padStart(2, '0')}`;
}

function minutesFromMidnight(time: string): number {
    const normalized = normalizeTime(time);
    const [hours, minutes] = normalized.split(':').map(Number);
    return hours * 60 + minutes;
}

export function timesOverlap(aStart: string, aEnd: string, bStart: string, bEnd: string): boolean {
    const a0 = minutesFromMidnight(aStart);
    const a1 = minutesFromMidnight(aEnd);
    const b0 = minutesFromMidnight(bStart);
    const b1 = minutesFromMidnight(bEnd);
    return a0 < b1 && b0 < a1;
}

export function findScheduleConflict(
    shifts: ScheduleShift[],
    dayOfWeek: number,
    startTime: string,
    endTime: string,
    exceptShiftId?: string | null,
): ScheduleShift | null {
    const start = normalizeTime(startTime);
    const end = normalizeTime(endTime);

    for (const shift of shifts) {
        if (exceptShiftId && shift.id === exceptShiftId) {
            continue;
        }
        if (shift.day_of_week !== dayOfWeek) {
            continue;
        }

        const shiftStart = normalizeTime(shift.start_time);
        const shiftEnd = normalizeTime(shift.end_time);

        if (shiftStart === start && shiftEnd === end) {
            return shift;
        }

        if (timesOverlap(start, end, shiftStart, shiftEnd)) {
            return shift;
        }
    }

    return null;
}

export function scheduleConflictMessage(
    existing: ScheduleShift,
    dayLabel: string,
    startTime: string,
    endTime: string,
): string {
    const existingStart = normalizeTime(existing.start_time);
    const existingEnd = normalizeTime(existing.end_time);
    const start = normalizeTime(startTime);
    const end = normalizeTime(endTime);

    if (existingStart === start && existingEnd === end) {
        return `${dayLabel} already has a shift from ${existingStart} to ${existingEnd}.`;
    }

    return `${dayLabel} overlaps with an existing shift (${existingStart} – ${existingEnd}).`;
}

export function bulkDaysToAdd(
    shifts: ScheduleShift[],
    days: number[],
    startTime: string,
    endTime: string,
): { add: number[]; skip: string[] } {
    const add: number[] = [];
    const skip: string[] = [];

    for (const day of days) {
        const conflict = findScheduleConflict(shifts, day, startTime, endTime);
        if (conflict) {
            skip.push(String(day));
            continue;
        }
        add.push(day);
    }

    return { add, skip };
}
