import type { CurrentEnrollment } from '@/src/lib/customer-plan-actions';

export type PlanUpgradeQuote = {
    total_paise: number;
    discount_percent: number;
    you_save_paise: number;
    tier_steps: number;
    carried_over_days?: number;
    projected_ends_at?: string;
};

export type PlanCustomerActions = {
    can_buy: boolean;
    can_upgrade: boolean;
    can_renew: boolean;
    is_current: boolean;
    visibility: string;
    blocked_reason?: string | null;
};

export type PlanSummary = {
    id: string;
    name: string;
    tagline?: string | null;
    description?: string | null;
    price_paise?: number;
    selling_price_paise?: number;
    duration_weeks?: number;
    is_featured?: boolean;
    category?: {
        name: string;
        slug: string;
    } | null;
    plan_rank?: {
        name?: string;
        rank_name?: string;
        slug?: string;
        sort_order?: number;
        highlights?: string[];
        feature_groups?: Array<{ title: string; items: string[] }>;
    } | null;
    upgrade_quote?: PlanUpgradeQuote | null;
    actions?: PlanCustomerActions | null;
};

export type PendingEnrollment = {
    diet_plan_id: string;
    checkout_href?: string;
    diet_plan?: { name: string } | null;
};

export type PlansIndexResponse = {
    plans: PlanSummary[];
    featured: PlanSummary[];
    categories: Array<{ id: string; name: string; slug: string; diet_plans_count?: number }>;
    currentEnrollment?: CurrentEnrollment | null;
    pendingEnrollment?: PendingEnrollment | null;
    meta?: {
        totalPlans?: number;
        categoryName?: string | null;
    };
};

export type PlanShowResponse = {
    plan: PlanSummary;
    currentEnrollment?: CurrentEnrollment | null;
    pendingEnrollment?: PendingEnrollment | null;
    isCurrentPlan?: boolean;
};
