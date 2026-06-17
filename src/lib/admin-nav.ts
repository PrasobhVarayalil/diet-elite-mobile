import { appHref } from '@/src/lib/navigation';
import type { Href } from 'expo-router';
import type { Ionicons } from '@expo/vector-icons';

export type AdminMenuItem = {
    icon: keyof typeof Ionicons.glyphMap;
    label: string;
    href: Href;
    subtitle?: string;
};

export const ADMIN_MENU: AdminMenuItem[] = [
    { icon: 'home-outline', label: 'Admin home', href: appHref('/(app)'), subtitle: 'Pending items & quick actions' },
    { icon: 'speedometer-outline', label: 'Analytics dashboard', href: appHref('/(app)/admin/dashboard'), subtitle: 'Revenue, charts & growth' },
    { icon: 'nutrition-outline', label: 'Diet plans', href: appHref('/(app)/admin/plans'), subtitle: 'Create, edit, delete' },
    { icon: 'grid-outline', label: 'Categories', href: appHref('/(app)/admin/categories') },
    { icon: 'layers-outline', label: 'Plan ranks', href: appHref('/(app)/admin/plan-ranks') },
    { icon: 'calendar-outline', label: 'Bookings', href: appHref('/(app)/admin/bookings') },
    { icon: 'people-outline', label: 'Users', href: appHref('/(app)/admin/users') },
    { icon: 'card-outline', label: 'Payments', href: appHref('/(app)/admin/payments') },
    { icon: 'time-outline', label: 'Schedules', href: appHref('/(app)/admin/schedules') },
    { icon: 'document-text-outline', label: 'Audit log', href: appHref('/(app)/admin/audit-log') },
];
