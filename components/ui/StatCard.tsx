import { chartPalette, colors, radius, shadow, spacing } from '@/constants/theme';
import { StyleSheet, Text, View } from 'react-native';

type StatCardProps = {
    label: string;
    value: string;
    hint?: string;
    colorIndex?: number;
};

export function StatCard({ label, value, hint, colorIndex = 0 }: StatCardProps) {
    const accent = chartPalette[colorIndex % chartPalette.length];

    return (
        <View style={[styles.card, { borderTopColor: accent }]}>
            <Text style={styles.label}>{label}</Text>
            <Text style={styles.value}>{value}</Text>
            {hint ? <Text style={styles.hint}>{hint}</Text> : null}
        </View>
    );
}

const styles = StyleSheet.create({
    card: {
        flex: 1,
        minWidth: '46%',
        backgroundColor: colors.card,
        borderRadius: radius.md,
        padding: spacing.md,
        borderWidth: 1,
        borderColor: colors.border,
        borderTopWidth: 3,
        gap: 4,
        ...shadow.card,
    },
    label: {
        fontSize: 12,
        fontWeight: '600',
        color: colors.textMuted,
        textTransform: 'uppercase',
        letterSpacing: 0.3,
    },
    value: {
        fontSize: 20,
        fontWeight: '800',
        color: colors.text,
    },
    hint: {
        fontSize: 12,
        color: colors.textMuted,
    },
});
