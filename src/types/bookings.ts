export type BookingListItem = {
    id: string;
    scheduled_at: string;
    status: string;
    duration_minutes?: number;
    cancellation_reason?: string | null;
    dietitian?: {
        id: string;
        name: string;
        title?: string | null;
    } | null;
    can_cancel?: boolean;
};

export type BookingsIndexResponse = {
    bookings: {
        data: BookingListItem[];
    };
};

export type CalendarSlot = {
    value: string;
    label: string;
    state: 'past' | 'available' | 'booked' | 'pending' | 'current';
};

export type BookingCalendarData = {
    month: string;
    days: Record<string, { slots: CalendarSlot[] }>;
};

export type BookingCalendarResponse = {
    calendar: BookingCalendarData;
    selectedDietitianId: string | null;
    selectedMonth: string;
    selectedDietitian?: {
        id: string;
        name: string;
        title?: string | null;
    } | null;
};

export type DietitianSearchResult = {
    id: string;
    name: string;
    title?: string | null;
    employee_code?: string | null;
};

export type DietitianSearchResponse = {
    dietitians: DietitianSearchResult[];
};

export type BookingStoreResponse = {
    booking: BookingListItem;
};
