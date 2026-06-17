/** Diet Elite brand + modern mobile tokens (aligned with web theme.css) */
export const colors = {
    brandDark: '#227014',
    brandLight: '#9ccb1d',
    brandMuted: '#e8f5e3',
    background: '#f4f8f2',
    card: '#ffffff',
    text: '#142610',
    textMuted: '#5a7354',
    border: '#d4e8cc',
    error: '#b42318',
    errorBg: '#fef3f2',
    success: '#157f3b',
    successBg: '#ecfdf3',
    warning: '#b54708',
    warningBg: '#fffaeb',
    white: '#ffffff',
    overlay: 'rgba(20, 38, 16, 0.06)',
    chart1: '#9ccb1d',
    chart2: '#3d8b40',
    chart3: '#e8a317',
    chart4: '#7c5cbf',
    chart5: '#e86c5a',
    chart6: '#4ba3c7',
} as const;

export const spacing = {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
} as const;

export const radius = {
    sm: 10,
    md: 14,
    lg: 18,
    xl: 24,
    pill: 999,
} as const;

export const shadow = {
    card: {
        shadowColor: '#142610',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.06,
        shadowRadius: 12,
        elevation: 3,
    },
    float: {
        shadowColor: '#142610',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.1,
        shadowRadius: 20,
        elevation: 6,
    },
} as const;

export const typography = {
    hero: { fontSize: 28, fontWeight: '800' as const, letterSpacing: -0.5 },
    title: { fontSize: 22, fontWeight: '700' as const },
    subtitle: { fontSize: 15, fontWeight: '500' as const, lineHeight: 22 },
    body: { fontSize: 15, lineHeight: 22 },
    caption: { fontSize: 13, lineHeight: 18 },
    label: { fontSize: 12, fontWeight: '600' as const, letterSpacing: 0.4, textTransform: 'uppercase' as const },
};

export function formatInrFromPaise(paise: number | null | undefined): string {
    if (paise == null) {
        return '—';
    }

    return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        maximumFractionDigits: 0,
    }).format(paise / 100);
}

export function formatDateTime(iso: string | null | undefined): string {
    if (!iso) {
        return '—';
    }

    try {
        return new Date(iso).toLocaleString(undefined, {
            dateStyle: 'medium',
            timeStyle: 'short',
        });
    } catch {
        return iso;
    }
}

export const chartPalette = [
    colors.chart1,
    colors.chart2,
    colors.chart3,
    colors.chart4,
    colors.chart5,
    colors.chart6,
] as const;
