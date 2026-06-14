/** REST API paths — mirrors diet-elite-api/resources/js/lib/api-routes.ts */
export const apiRoutes = {
    auth: {
        login: '/api/v1/auth/login',
        logout: '/api/v1/auth/logout',
        me: '/api/v1/auth/me',
    },
    plans: {
        index: '/api/v1/plans',
        compare: '/api/v1/plans/compare',
        show: (planId: string) => `/api/v1/plans/${planId}`,
        checkout: (planId: string) => `/api/v1/plans/${planId}/checkout`,
    },
    payments: {
        index: '/api/v1/payments',
        confirm: (paymentId: string) => `/api/v1/payments/${paymentId}/confirm`,
    },
    bookings: {
        calendar: '/api/v1/bookings/calendar',
    },
} as const;
