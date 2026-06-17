import { colors, radius, spacing } from '@/constants/theme';
import { chartColorAt, resolveChartFill } from '@/src/lib/chart-colors';
import { StyleSheet, Text, View } from 'react-native';

export type SegmentPoint = {
    name: string;
    value: number;
    fill?: string;
};

type Props = {
    data: SegmentPoint[];
};

export function SegmentChart({ data }: Props) {
    const filtered = data.filter((d) => d.value > 0);
    const total = filtered.reduce((sum, d) => sum + d.value, 0);

    if (total === 0) {
        return <Text style={styles.empty}>No data yet</Text>;
    }

    return (
        <View style={styles.wrap}>
            <View style={styles.bar}>
                {filtered.map((segment, i) => (
                    <View
                        key={`${segment.name}-${i}`}
                        style={{
                            flex: segment.value,
                            backgroundColor: segment.fill
                                ? resolveChartFill(segment.fill, i)
                                : chartColorAt(i),
                            minWidth: 4,
                        }}
                    />
                ))}
            </View>
            <View style={styles.legend}>
                {filtered.map((segment, i) => (
                    <View key={`${segment.name}-leg-${i}`} style={styles.legendRow}>
                        <View
                            style={[
                                styles.dot,
                                {
                                    backgroundColor: segment.fill
                                        ? resolveChartFill(segment.fill, i)
                                        : chartColorAt(i),
                                },
                            ]}
                        />
                        <Text style={styles.legendText} numberOfLines={1}>
                            {segment.name}
                        </Text>
                        <Text style={styles.legendValue}>{segment.value}</Text>
                    </View>
                ))}
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    wrap: { gap: spacing.sm },
    bar: {
        flexDirection: 'row',
        height: 12,
        borderRadius: radius.pill,
        overflow: 'hidden',
        backgroundColor: colors.brandMuted,
    },
    legend: { gap: 6 },
    legendRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    dot: { width: 8, height: 8, borderRadius: 4 },
    legendText: { flex: 1, fontSize: 13, color: colors.text },
    legendValue: { fontSize: 13, fontWeight: '700', color: colors.text },
    empty: { fontSize: 13, color: colors.textMuted, fontStyle: 'italic' },
});
