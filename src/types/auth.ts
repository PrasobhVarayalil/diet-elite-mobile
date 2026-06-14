export type AuthUser = {
    id: string;
    name: string;
    email: string;
    username: string;
    phone: string | null;
    role: string;
    role_label: string;
    dashboard_path: string;
    photo_url?: string | null;
    has_active_plan?: boolean;
    plan_access?: 'active' | 'expired' | 'none';
    plan_rank?: {
        plan_rank_id: string | null;
        rank_name: string;
        rank_slug: string | null;
        rank_sort_order: number;
        features: Record<string, unknown>;
    };
    renew_plan_id?: string;
    expired_plan_name?: string;
    expired_plan_ends_at?: string;
    member_code?: string;
    employee_code?: string;
};

export type LoginResponse = {
    user: AuthUser;
    token?: string;
    token_type?: string;
};

export type MeResponse = {
    user: AuthUser;
};
