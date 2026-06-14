/** Diet Elite brand — aligned with diet-elite-api/resources/css/theme.css */
export const colors = {
    brandDark: '#227014',
    brandLight: '#9ccb1d',
    background: '#f7faf5',
    card: '#ffffff',
    text: '#1a3d14',
    textMuted: '#5a7354',
    border: '#d4e8cc',
    error: '#b42318',
    errorBg: '#fef3f2',
    white: '#ffffff',
} as const;

export const spacing = {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
} as const;

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
