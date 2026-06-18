import type { AuthUser } from '@/src/types/auth';
import { Ionicons } from '@expo/vector-icons';
import {
    customerNeedsActivePlan,
    isAdmin,
    isAdvisor,
    isCustomer,
    isDietitian,
    isStaff,
} from '@/src/lib/user-access';

export type MobileTabId = 'home' | 'plans' | 'bookings' | 'messages' | 'profile';

export type ProfileMenuItem = {
    icon: keyof typeof Ionicons.glyphMap;
    label: string;
    route: string;
    subtitle?: string;
    section: 'program' | 'account';
};

export function customerHasActivePlan(user: AuthUser | null | undefined): boolean {
    return isCustomer(user) && user?.has_active_plan === true;
}

export function customerCanUseMessenger(user: AuthUser | null | undefined): boolean {
    return isCustomer(user) && user?.has_active_plan !== false;
}

/** Tab bar visibility — mirrors web nav-config per role and plan state. */
export function visibleTabs(user: AuthUser | null | undefined): MobileTabId[] {
    if (isCustomer(user)) {
        if (customerHasActivePlan(user)) {
            return ['home', 'plans', 'bookings', 'messages', 'profile'];
        }

        if (user?.plan_access === 'expired') {
            return ['home', 'plans', 'bookings', 'profile'];
        }

        return ['home', 'plans', 'profile'];
    }

    if (isDietitian(user)) {
        return ['home', 'bookings', 'messages', 'profile'];
    }

    if (isAdvisor(user)) {
        return ['home', 'bookings', 'messages', 'profile'];
    }

    if (isStaff(user)) {
        return ['home', 'messages', 'profile'];
    }

    return ['home', 'profile'];
}

export function tabLabel(tab: MobileTabId, user: AuthUser | null | undefined): string {
    if (tab === 'bookings' && isDietitian(user)) {
        return 'Appointments';
    }

    if (tab === 'bookings' && isAdvisor(user)) {
        return 'Consults';
    }

    const labels: Record<MobileTabId, string> = {
        home: 'Home',
        plans: 'Plans',
        bookings: 'Bookings',
        messages: 'Messages',
        profile: 'Profile',
    };

    return labels[tab];
}

export function profileMenuFor(user: AuthUser | null | undefined): ProfileMenuItem[] {
    if (isCustomer(user)) {
        const items: ProfileMenuItem[] = [
            {
                icon: 'create-outline',
                label: 'Edit profile',
                route: '/(app)/profile-edit',
                subtitle: 'Name, phone, username',
                section: 'account',
            },
        ];

        if (customerHasActivePlan(user)) {
            items.unshift(
                {
                    icon: 'restaurant-outline',
                    label: 'Meal plan',
                    route: '/(app)/meal-plan',
                    section: 'program',
                },
                {
                    icon: 'fitness-outline',
                    label: 'Health profile',
                    route: '/(app)/health-profile',
                    section: 'program',
                },
                {
                    icon: 'sparkles-outline',
                    label: 'AI coach',
                    route: '/(app)/ai-coach',
                    section: 'program',
                },
            );
        }

        items.push(
            {
                icon: 'card-outline',
                label: 'Payments',
                route: '/(app)/payments',
                section: 'account',
            },
            {
                icon: 'star-outline',
                label: 'Reviews',
                route: '/(app)/reviews',
                section: 'account',
            },
            {
                icon: 'notifications-outline',
                label: 'Notifications',
                route: '/(app)/notifications',
                section: 'account',
            },
        );

        return items;
    }

    if (isDietitian(user)) {
        return [
            {
                icon: 'people-outline',
                label: 'My clients',
                route: '/(app)/clients',
                section: 'program',
            },
            {
                icon: 'calendar-outline',
                label: 'Appointments',
                route: '/(app)/bookings',
                section: 'program',
            },
            {
                icon: 'chatbubbles-outline',
                label: 'Messages',
                route: '/(app)/messages',
                section: 'program',
            },
            {
                icon: 'notifications-outline',
                label: 'Notifications',
                route: '/(app)/notifications',
                section: 'account',
            },
        ];
    }

    if (isAdvisor(user)) {
        return [
            {
                icon: 'briefcase-outline',
                label: 'Advisor tools',
                route: '/(app)/advisor',
                subtitle: 'Enrollments & first consults',
                section: 'program',
            },
            {
                icon: 'list-outline',
                label: 'Enrollments',
                route: '/(app)/advisor/enrollments',
                section: 'program',
            },
            {
                icon: 'chatbubbles-outline',
                label: 'Messages',
                route: '/(app)/messages',
                section: 'program',
            },
            {
                icon: 'person-add-outline',
                label: 'New enrollment',
                route: '/(app)/advisor/enrollments/create',
                section: 'program',
            },
            {
                icon: 'calendar-outline',
                label: 'First consults',
                route: '/(app)/bookings',
                section: 'program',
            },
            {
                icon: 'notifications-outline',
                label: 'Notifications',
                route: '/(app)/notifications',
                section: 'account',
            },
        ];
    }

    if (isAdmin(user)) {
        return [
            {
                icon: 'grid-outline',
                label: 'Admin portal',
                route: '/(app)/admin',
                subtitle: 'Plans, users, bookings, schedules',
                section: 'program',
            },
            {
                icon: 'speedometer-outline',
                label: 'Analytics dashboard',
                route: '/(app)/admin/dashboard',
                subtitle: 'Revenue, charts & metrics',
                section: 'program',
            },
            {
                icon: 'calendar-outline',
                label: 'Bookings queue',
                route: '/(app)/admin/bookings',
                section: 'program',
            },
            {
                icon: 'people-outline',
                label: 'Users',
                route: '/(app)/admin/users',
                subtitle: 'Active / inactive accounts',
                section: 'program',
            },
            {
                icon: 'time-outline',
                label: 'Dietitian slots',
                route: '/(app)/admin/schedules',
                subtitle: 'Add shifts & bookable slots',
                section: 'program',
            },
            {
                icon: 'chatbubbles-outline',
                label: 'Messages',
                route: '/(app)/messages',
                section: 'program',
            },
            {
                icon: 'notifications-outline',
                label: 'Notifications',
                route: '/(app)/notifications',
                section: 'account',
            },
        ];
    }

    return [
        {
            icon: 'chatbubbles-outline',
            label: 'Messages',
            route: '/(app)/messages',
            section: 'program',
        },
        {
            icon: 'notifications-outline',
            label: 'Notifications',
            route: '/(app)/notifications',
            section: 'account',
        },
    ];
}

export function staffPortalMessage(user: AuthUser | null | undefined): string | null {
    return null;
}

export function customerProgramBlockedReason(user: AuthUser | null | undefined): string | null {
    if (!isCustomer(user)) {
        return 'This feature is for customers only. Use the web portal for staff tools.';
    }

    if (customerNeedsActivePlan(user)) {
        return 'Choose an active diet plan to unlock this feature.';
    }

    return null;
}
