import { colors, radius, shadow, spacing, typography } from '@/constants/theme';
import { chartColorAt } from '@/src/lib/chart-colors';
import { ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';

type Props = {
    title: string;
    subtitle?: string;
    colorIndex?: number;
    children: ReactNode;
};

export function ChartCard({ title, subtitle, colorIndex = 0, children }: Props) {
    const accent = chartColorAt(colorIndex);

    return (
        <View style={styles.card}>
            <View style={[styles.accent, { backgroundColor: accent }]} />
            <View style={styles.head}>
                <Text style={styles.title}>{title}</Text>
                {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
            </View>
            {children}
        </View>
    );
}

const styles = StyleSheet.create({
    card: {
        backgroundColor: colors.card,
        borderRadius: radius.lg,
        borderWidth: 1,
        borderColor: colors.border,
        padding: spacing.md,
        overflow: 'hidden',
        ...shadow.card,
    },
    accent: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: 3,
    },
    head: { gap: 2, marginBottom: spacing.sm },
    title: { ...typography.label, color: colors.textMuted, fontSize: 11 },
    subtitle: { fontSize: 15, fontWeight: '700', color: colors.text },
});
