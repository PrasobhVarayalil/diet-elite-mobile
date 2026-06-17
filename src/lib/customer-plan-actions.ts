import type { CheckoutIntent } from '@/src/types/checkout';

export const RENEWAL_WINDOW_DAYS = 14;

export type CurrentEnrollment = {
    id: string;
    diet_plan_id: string;
    status: string;
    starts_at: string | null;
    ends_at: string | null;
    carried_over_days?: number;
    diet_plan: {
        id: string;
        name: string;
        slug: string;
        tagline?: string | null;
        price_paise: number;
        duration_weeks: number;
    } | null;
};

export type PlanActionState = {
    isCurrent: boolean;
    showBuy: boolean;
    showUpgrade: boolean;
    showRenew: boolean;
};

export type PlanCustomerActions = {
    can_buy: boolean;
    can_upgrade: boolean;
    can_renew: boolean;
    is_current: boolean;
    visibility: string;
    blocked_reason?: string | null;
};

export function planActionStateFromApi(actions?: PlanCustomerActions | null): PlanActionState {
    if (!actions) {
        return {
            isCurrent: false,
            showBuy: false,
            showUpgrade: false,
            showRenew: false,
        };
    }

    return {
        isCurrent: actions.is_current,
        showBuy: actions.can_buy,
        showUpgrade: actions.can_upgrade,
        showRenew: actions.can_renew,
    };
}

export function daysUntilExpiry(endsAt: string | null | undefined): number | null {
    if (!endsAt) {
        return null;
    }

    const end = new Date(endsAt);
    end.setHours(0, 0, 0, 0);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return Math.round((end.getTime() - today.getTime()) / 86_400_000);
}

export function isInRenewalWindow(endsAt: string | null | undefined): boolean {
    const days = daysUntilExpiry(endsAt);

    return days !== null && days <= RENEWAL_WINDOW_DAYS;
}

export type PlanActionOptions = {
    planAccess?: 'active' | 'expired' | 'none';
    renewPlanId?: string;
};

export function planActionState(
    planId: string,
    currentEnrollment: CurrentEnrollment | null | undefined,
    options?: PlanActionOptions,
): PlanActionState {
    const currentPlanId = currentEnrollment?.diet_plan_id ?? null;
    const hasActivePlan = currentPlanId !== null;
    const isCurrent = hasActivePlan && currentPlanId === planId;
    const isExpiredRenewTarget =
        options?.planAccess === 'expired' && options?.renewPlanId === planId;

    return {
        isCurrent,
        showBuy: !hasActivePlan && !isExpiredRenewTarget,
        showUpgrade: hasActivePlan && !isCurrent,
        showRenew:
            (isCurrent && isInRenewalWindow(currentEnrollment?.ends_at)) || isExpiredRenewTarget,
    };
}

export function checkoutIntentForPlan(
    planId: string,
    currentEnrollment: CurrentEnrollment | null | undefined,
    options?: PlanActionOptions,
    apiActions?: PlanCustomerActions | null,
): CheckoutIntent | null {
    const actions = apiActions
        ? planActionStateFromApi(apiActions)
        : planActionState(planId, currentEnrollment, options);

    if (actions.showRenew) {
        return 'renew';
    }
    if (actions.showUpgrade) {
        return 'upgrade';
    }
    if (actions.showBuy) {
        return 'buy';
    }

    return null;
}
