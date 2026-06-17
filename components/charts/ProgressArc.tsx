import { colors, spacing } from '@/constants/theme';
import { chartColorAt } from '@/src/lib/chart-colors';
import { StyleSheet, Text, View } from 'react-native';

type Props = {
    percent: number;
    label: string;
    colorIndex?: number;
};

export function ProgressArc({ percent, label, colorIndex = 1 }: Props) {
    const clamped = Math.min(100, Math.max(0, percent));
    const accent = chartColorAt(colorIndex);

    return (
        <View style={styles.wrap}>
            <View style={styles.ring}>
                <View style={[styles.ringTrack]} />
                <View
                    style={[
                        styles.ringFill,
                        {
                            width: `${clamped}%`,
                            backgroundColor: accent,
                        },
                    ]}
                />
                <Text style={styles.percent}>{clamped}%</Text>
            </View>
            <Text style={styles.label}>{label}</Text>
        </View>
    );
}

const styles = StyleSheet.create({
    wrap: { alignItems: 'center', gap: spacing.xs, paddingVertical: spacing.sm },
    ring: {
        width: '100%',
        height: 14,
        borderRadius: 999,
        backgroundColor: colors.brandMuted,
        overflow: 'hidden',
        justifyContent: 'center',
    },
    ringTrack: { ...StyleSheet.absoluteFillObject, backgroundColor: colors.brandMuted },
    ringFill: { position: 'absolute', left: 0, top: 0, bottom: 0, borderRadius: 999 },
    percent: {
        alignSelf: 'center',
        fontSize: 11,
        fontWeight: '800',
        color: colors.text,
        zIndex: 1,
    },
    label: { fontSize: 12, color: colors.textMuted, textAlign: 'center' },
});
