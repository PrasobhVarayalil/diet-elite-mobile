import { apiGet } from '@/src/lib/api-client';
import { apiRoutes } from '@/src/lib/api-routes';
import { useCallback, useEffect, useState } from 'react';

export type AdminDashboardStats = {
    customers?: number;
    dietitians?: number;
    advisors?: number;
    activeEnrollments?: number;
    pendingApprovals?: number;
    pendingEnrollments?: number;
    upcomingBookings?: number;
    revenuePaise?: number;
    revenueThisMonthPaise?: number;
    newCustomersThisMonth?: number;
    totalUsers?: number;
    paymentsThisMonth?: number;
    pendingPayments?: number;
    pendingPaymentAmountPaise?: number;
    failedPaymentsThisMonth?: number;
    payingCustomers?: number;
    avgOrderPaise?: number;
};

export type AdminDashboardData = {
    stats?: AdminDashboardStats;
    monthlyMetrics?: Array<{ month: string; revenue: number; enrollments: number }>;
    monthlyOverview?: Array<{
        month: string;
        revenue: number;
        enrollments: number;
        bookings: number;
        payments: number;
    }>;
    userMix?: Array<{ name: string; value: number; fill?: string }>;
    bookingsByStatus?: Array<{ status: string; count: number }>;
    enrollmentsByStatus?: Array<{ status: string; count: number }>;
    paymentsByStatus?: Array<{ status: string; count: number; fill?: string }>;
    customerSegmentChart?: Array<{ name: string; value: number; fill?: string }>;
    revenueGrowth?: number | null;
    enrollmentGrowth?: number | null;
    topDietitians?: Array<{
        id: string;
        name: string;
        rating?: number | null;
        completed_month?: number;
        upcoming_count?: number;
        pending_count?: number;
    }>;
    topPlans?: Array<{ id: string; name: string; price_paise?: number; enrollments_count?: number }>;
    recentBookings?: Array<{
        id: string;
        scheduled_at?: string;
        status?: string;
        user?: { name: string };
        dietitian?: { name: string };
    }>;
    recentEnrollments?: Array<{
        id: string;
        status?: string;
        user?: { name: string };
        diet_plan?: { name: string };
        dietPlan?: { name: string };
    }>;
};

export function useAdminDashboard() {
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [data, setData] = useState<AdminDashboardData | null>(null);
    const [error, setError] = useState<string | null>(null);

    const load = useCallback(async (isRefresh = false) => {
        if (isRefresh) {
            setRefreshing(true);
        } else {
            setLoading(true);
        }

        const result = await apiGet<AdminDashboardData>(apiRoutes.admin.dashboard);

        if (result.ok && result.data) {
            setData(result.data);
            setError(null);
        } else {
            setError(result.ok ? 'Could not load dashboard.' : result.message);
        }

        setLoading(false);
        setRefreshing(false);
    }, []);

    useEffect(() => {
        load();
    }, [load]);

    return { data, error, loading, refreshing, reload: load };
}
