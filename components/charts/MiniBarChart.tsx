import { colors, spacing } from '@/constants/theme';
import { chartColorAt } from '@/src/lib/chart-colors';
import { StyleSheet, Text, View } from 'react-native';

export type BarPoint = {
    label: string;
    value: number;
};

type Props = {
    data: BarPoint[];
    valueSuffix?: string;
    colorIndex?: number;
    height?: number;
};

export function MiniBarChart({ data, valueSuffix = '', colorIndex = 0, height = 96 }: Props) {
    if (data.length === 0) {
        return <Text style={styles.empty}>No data yet</Text>;
    }

    const max = Math.max(...data.map((d) => d.value), 1);
    const barColor = chartColorAt(colorIndex);

    return (
        <View style={styles.wrap}>
            <View style={[styles.bars, { height }]}>
                {data.map((point, i) => {
                    const h = Math.max(4, (point.value / max) * (height - 8));
                    return (
                        <View key={`${point.label}-${i}`} style={styles.col}>
                            <View style={[styles.bar, { height: h, backgroundColor: barColor }]} />
                        </View>
                    );
                })}
            </View>
            <View style={styles.labels}>
                {data.map((point, i) => (
                    <Text key={`${point.label}-l-${i}`} numberOfLines={1} style={styles.label}>
                        {point.label}
                    </Text>
                ))}
            </View>
            {valueSuffix ? (
                <Text style={styles.hint}>
                    Peak {max}
                    {valueSuffix}
                </Text>
            ) : null}
        </View>
    );
}

const styles = StyleSheet.create({
    wrap: { gap: spacing.xs },
    bars: {
        flexDirection: 'row',
        alignItems: 'flex-end',
        gap: 6,
    },
    col: { flex: 1, alignItems: 'center', justifyContent: 'flex-end' },
    bar: {
        width: '100%',
        maxWidth: 28,
        borderRadius: 6,
        minHeight: 4,
    },
    labels: { flexDirection: 'row', gap: 6 },
    label: {
        flex: 1,
        fontSize: 10,
        fontWeight: '600',
        color: colors.textMuted,
        textAlign: 'center',
    },
    hint: { fontSize: 11, color: colors.textMuted, marginTop: 2 },
    empty: { fontSize: 13, color: colors.textMuted, fontStyle: 'italic' },
});
