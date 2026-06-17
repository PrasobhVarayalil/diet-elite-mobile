export type CheckoutIntent = 'buy' | 'upgrade' | 'renew';

export type PaymentMethod = {
    id: 'upi' | 'card' | 'netbanking';
    label: string;
    description: string;
};

export type CheckoutSummary = {
    subtotal_paise: number;
    total_paise: number;
    currency: string;
    selling_price_paise?: number;
    mrp_paise?: number;
    has_offer?: boolean;
    list_price_paise?: number;
    current_plan_paid_paise?: number;
    current_plan_name?: string | null;
    price_difference_paise?: number;
    upgrade_discount_percent?: number;
    upgrade_discount_paise?: number;
    tier_steps?: number;
    plan_offer_savings_paise?: number;
};

export type CheckoutShowResponse = {
    intent: CheckoutIntent;
    plan: {
        id: string;
        name: string;
        tagline?: string | null;
        price_paise: number;
        duration_weeks: number;
        category?: { name: string; slug: string } | null;
    };
    summary: CheckoutSummary;
    schedule?: { starts_at: string; ends_at: string };
    carryOver?: { days: number; projected_ends_at: string } | null;
    paymentMethods: PaymentMethod[];
    razorpay?: { enabled: boolean; key: string | null };
    isCurrentPlan?: boolean;
    currentEnrollment?: Record<string, unknown> | null;
};

export type CheckoutStoreResponse = {
    payment_id?: string;
    razorpay?: {
        key: string;
        order_id: string;
        amount_paise: number;
        currency: string;
    };
};

export type PaymentListItem = {
    id: string;
    amount_paise: number;
    currency: string;
    status: string;
    status_label?: string;
    method?: string | null;
    paid_at?: string | null;
    created_at?: string;
    description?: string | null;
};

export type PaymentsIndexResponse = {
    payments: PaymentListItem[];
    summary?: {
        total_spent_paise: number;
        payment_count: number;
        successful_count: number;
    };
};
