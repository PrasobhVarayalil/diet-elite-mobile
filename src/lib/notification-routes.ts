import type { AuthUser } from '@/src/types/auth';
import { APP_ROUTES, PLANS_LIST_HREF, appHref } from '@/src/lib/navigation';
import { isAdmin, isDietitian } from '@/src/lib/user-access';
import type { Href } from 'expo-router';

export type AppNotification = {
    id: string;
    type: string;
    title: string;
    body?: string | null;
    data?: Record<string, unknown> | null;
    read_at?: string | null;
    created_at?: string | null;
};

function bookingIdFromData(data?: Record<string, unknown> | null): string | null {
    if (!data) {
        return null;
    }
    const id = data.booking_id ?? data.bookingId;
    return typeof id === 'string' && id.length > 0 ? id : null;
}

function planIdFromData(data?: Record<string, unknown> | null): string | null {
    if (!data) {
        return null;
    }
    const id = data.plan_id ?? data.planId ?? data.diet_plan_id;
    return typeof id === 'string' && id.length > 0 ? id : null;
}

/** Map web notification hrefs to mobile routes. */
export function mobileNotificationRoute(
    notification: AppNotification,
    user: AuthUser | null | undefined,
): Href | null {
    const data = notification.data;
    const href = typeof data?.href === 'string' ? data.href : null;

    if (href) {
        if (href.includes('/dietitian/appointments')) {
            const bookingId = bookingIdFromData(data);
            if (bookingId && isDietitian(user)) {
                return appHref(`/(app)/bookings/${bookingId}`);
            }
            if (isDietitian(user)) {
                return APP_ROUTES.bookings;
            }
        }

        if (href.includes('/admin/bookings')) {
            const bookingId = bookingIdFromData(data);
            if (bookingId && isAdmin(user)) {
                return appHref(`/(app)/admin/bookings/${bookingId}`);
            }
            if (isAdmin(user)) {
                return appHref('/(app)/admin/bookings');
            }
        }

        if (href.includes('/bookings') || href.includes('/appointments')) {
            return APP_ROUTES.bookings;
        }

        if (href.includes('/payments')) {
            return APP_ROUTES.payments;
        }

        if (href.includes('/plans')) {
            const planId = planIdFromData(data);
            if (planId) {
                return APP_ROUTES.planShow(planId);
            }
            return PLANS_LIST_HREF;
        }

        if (href.includes('/messages')) {
            return APP_ROUTES.messages;
        }
    }

    if (typeof data?.renew_checkout_href === 'string') {
        const planId = planIdFromData(data);
        if (planId) {
            return APP_ROUTES.planCheckout(planId, 'renew');
        }
    }

    const dietitianBookingTypes = new Set([
        'booking_request_pending',
        'booking_assigned',
        'booking_request_withdrawn',
        'booking_cancelled_by_customer',
        'booking_rescheduled',
        'booking_swapped',
    ]);

    if (dietitianBookingTypes.has(notification.type) && isDietitian(user)) {
        const bookingId = bookingIdFromData(data);
        return bookingId ? appHref(`/(app)/bookings/${bookingId}`) : APP_ROUTES.bookings;
    }

    if (notification.type.startsWith('booking_') || notification.type === 'first_consult_booked') {
        return APP_ROUTES.bookings;
    }

    if (notification.type === 'payment_receipt') {
        return APP_ROUTES.payments;
    }

    const planId = planIdFromData(data);
    if (notification.type === 'enrollment_pending' && planId) {
        return APP_ROUTES.planCheckout(planId, 'buy');
    }

    if (notification.type === 'plan_expiring' && planId) {
        return APP_ROUTES.planCheckout(planId, 'renew');
    }

    if (notification.type === 'welcome' || notification.type === 'enrollment_activated') {
        return APP_ROUTES.home;
    }

    return null;
}
