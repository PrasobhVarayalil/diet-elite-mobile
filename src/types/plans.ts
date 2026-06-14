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
        rank_name?: string;
    } | null;
};

export type PlansIndexResponse = {
    plans: PlanSummary[];
    featured: PlanSummary[];
    categories: Array<{ id: string; name: string; slug: string; diet_plans_count?: number }>;
    currentEnrollment?: Record<string, unknown> | null;
    meta?: {
        totalPlans?: number;
        categoryName?: string | null;
    };
};

export type PlanShowResponse = {
    plan: PlanSummary;
    currentEnrollment?: Record<string, unknown> | null;
    isCurrentPlan?: boolean;
};
