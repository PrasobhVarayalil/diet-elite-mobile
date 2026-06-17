import type { Href } from 'expo-router';
import type { AuthUser } from '@/src/types/auth';

/** Typed routes lag behind new screens until Expo regenerates types. */
export function appHref(path: string): Href {
    return path as Href;
}

/**
 * Tab list routes — never append `/index` (Expo matches dynamic `[id]` segments).
 * Inspired by HealthifyMe / Noom tab roots.
 */
export const PLANS_LIST_HREF = appHref('/(app)/plans');
export const BOOKINGS_LIST_HREF = appHref('/(app)/bookings');
export const MESSAGES_LIST_HREF = appHref('/(app)/messages');
export const HOME_HREF = appHref('/(app)');
export const PROFILE_HREF = appHref('/(app)/profile');

/** Web SPA paths from AuthUserPayload::dashboard_path → mobile tab/stack entry. */
const WEB_DASHBOARD_TO_MOBILE: Record<string, Href> = {
    '/plans': PLANS_LIST_HREF,
    '/dashboard': HOME_HREF,
    '/admin/dashboard': HOME_HREF,
    '/dietitian/dashboard': HOME_HREF,
    '/advisor/dashboard': HOME_HREF,
};

/** Post-login / bootstrap entry — mirrors web portal-login using API dashboard_path. */
export function mobileEntryHref(user: AuthUser | null | undefined): Href {
    if (!user) {
        return HOME_HREF;
    }

    const path = user.dashboard_path?.split('?')[0]?.replace(/\/$/, '') ?? '';
    const mapped = WEB_DASHBOARD_TO_MOBILE[path];
    if (mapped) {
        return mapped;
    }

    if (user.role === 'customer' && user.has_active_plan === false) {
        return PLANS_LIST_HREF;
    }

    return HOME_HREF;
}

export const APP_ROUTES = {
    home: HOME_HREF,
    plans: PLANS_LIST_HREF,
    bookings: BOOKINGS_LIST_HREF,
    messages: MESSAGES_LIST_HREF,
    profile: PROFILE_HREF,
    payments: appHref('/(app)/payments'),
    healthProfile: appHref('/(app)/health-profile'),
    mealPlan: appHref('/(app)/meal-plan'),
    aiCoach: appHref('/(app)/ai-coach'),
    notifications: appHref('/(app)/notifications'),
    reviews: appHref('/(app)/reviews'),
    profileEdit: appHref('/(app)/profile-edit'),
    planCheckout: (planId: string, intent = 'buy') =>
        appHref(`/(app)/plans/${planId}/checkout?intent=${intent}`),
    planShow: (planId: string) => appHref(`/(app)/plans/${planId}`),
    messageThread: (threadId: string) => appHref(`/(app)/messages/${threadId}`),
    bookingCreate: appHref('/(app)/bookings/create'),
} as const;
