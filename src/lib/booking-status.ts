import { colors } from '@/constants/theme';

/** Semantic booking status colors — aligned with web `booking-status-badge.tsx` / theme.css. */
export const BOOKING_STATUS_COLORS: Record<string, { bg: string; text: string }> = {
    confirmed: { bg: '#ecfdf3', text: colors.success },
    pending_approval: { bg: colors.warningBg, text: colors.warning },
    pending_payment: { bg: colors.warningBg, text: colors.warning },
    cancelled: { bg: colors.errorBg, text: colors.error },
    completed: { bg: '#eef2ff', text: colors.chart4 },
    rescheduled: { bg: '#f3effa', text: colors.chart4 },
};

export function bookingStatusLabel(
    status: string,
    customerView = false,
    isExpiredRequest = false,
): string {
    if (isExpiredRequest) {
        return customerView ? 'Request expired' : 'Expired request';
    }

    if (customerView && status === 'pending_approval') {
        return 'Hold';
    }

    return status.replace(/_/g, ' ');
}

export function bookingStatusStyle(status: string, isExpiredRequest = false): { bg: string; text: string } {
    if (isExpiredRequest) {
        return { bg: '#f4f4f5', text: colors.textMuted };
    }

    return (
        BOOKING_STATUS_COLORS[status] ?? {
            bg: colors.brandMuted,
            text: colors.brandDark,
        }
    );
}
