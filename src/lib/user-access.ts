import type { AuthUser } from '@/src/types/auth';

export function isCustomer(user: AuthUser | null | undefined): boolean {
    return user?.role === 'customer';
}

export function isDietitian(user: AuthUser | null | undefined): boolean {
    return user?.role === 'dietitian';
}

export function isAdmin(user: AuthUser | null | undefined): boolean {
    return user?.role === 'admin';
}

export function isAdvisor(user: AuthUser | null | undefined): boolean {
    return user?.role === 'enrollment_advisor';
}

export function isStaff(user: AuthUser | null | undefined): boolean {
    return isAdmin(user) || isAdvisor(user) || isDietitian(user);
}

/** Customer-only features gated on an active membership plan. */
export function customerNeedsActivePlan(user: AuthUser | null | undefined): boolean {
    return isCustomer(user) && user?.has_active_plan !== true;
}
