import { chartPalette, colors } from '@/constants/theme';

/** Map web `var(--chart-N)` or index to mobile palette. */
export function chartColorAt(index: number): string {
    return chartPalette[index % chartPalette.length];
}

export function resolveChartFill(fill?: string | null, fallbackIndex = 0): string {
    if (!fill) {
        return chartColorAt(fallbackIndex);
    }

    const match = fill.match(/chart-(\d)/);
    if (match) {
        const key = `chart${match[1]}` as keyof typeof colors;
        if (colors[key]) {
            return colors[key];
        }
    }

    return chartColorAt(fallbackIndex);
}
