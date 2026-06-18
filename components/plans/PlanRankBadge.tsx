import { Badge } from '@/components/ui/Badge';
import { chartPalette } from '@/constants/theme';
import { planRankName, planRankToneIndex } from '@/src/lib/plan-rank';
import type { PlanSummary } from '@/src/types/plans';
import { StyleSheet, Text, View } from 'react-native';

type Props = {
    rank?: PlanSummary['plan_rank'];
    large?: boolean;
};

export function PlanRankBadge({ rank, large = false }: Props) {
    const name = planRankName(rank);
    if (!name) {
        return null;
    }

    const accent = chartPalette[planRankToneIndex(rank) % chartPalette.length];

    return (
        <View style={[styles.wrap, large && styles.wrapLarge]}>
            <View style={[styles.dot, { backgroundColor: accent }]} />
            <Badge label={name} tone="neutral" />
        </View>
    );
}

export function PlanHighlights({ highlights }: { highlights?: string[] | null }) {
    if (!highlights?.length) {
        return null;
    }

    return (
        <View style={styles.highlights}>
            {highlights.slice(0, 4).map((item) => (
                <Text key={item} style={styles.highlightItem}>
                    • {item}
                </Text>
            ))}
        </View>
    );
}

const styles = StyleSheet.create({
    wrap: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        marginTop: 4,
    },
    wrapLarge: { marginTop: 8, marginBottom: 4 },
    dot: {
        width: 8,
        height: 8,
        borderRadius: 4,
    },
    highlights: { gap: 4, marginTop: 4 },
    highlightItem: { fontSize: 13, lineHeight: 18, color: '#5a7354' },
});
