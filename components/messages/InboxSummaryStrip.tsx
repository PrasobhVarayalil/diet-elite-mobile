import { colors, radius, spacing } from '@/constants/theme';
import { chartColorAt } from '@/src/lib/chart-colors';
import { StyleSheet, Text, View } from 'react-native';

type Props = {
    threadCount: number;
    contactCount: number;
    unreadTotal: number;
};

export function InboxSummaryStrip({ threadCount, contactCount, unreadTotal }: Props) {
    const items = [
        { label: 'Conversations', value: threadCount, colorIndex: 2 },
        { label: 'Unread', value: unreadTotal, colorIndex: 5 },
        { label: 'Contacts', value: contactCount, colorIndex: 4 },
    ];

    return (
        <View style={styles.wrap}>
            {items.map((item) => (
                <View key={item.label} style={styles.pill}>
                    <View style={[styles.dot, { backgroundColor: chartColorAt(item.colorIndex) }]} />
                    <Text style={styles.value}>{item.value}</Text>
                    <Text style={styles.label}>{item.label}</Text>
                </View>
            ))}
        </View>
    );
}

const styles = StyleSheet.create({
    wrap: {
        flexDirection: 'row',
        gap: spacing.sm,
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.sm,
        backgroundColor: colors.card,
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderBottomColor: colors.border,
    },
    pill: {
        flex: 1,
        alignItems: 'center',
        paddingVertical: spacing.sm,
        paddingHorizontal: spacing.xs,
        borderRadius: radius.md,
        backgroundColor: colors.background,
        borderWidth: 1,
        borderColor: colors.border,
        gap: 2,
    },
    dot: { width: 6, height: 6, borderRadius: 3, marginBottom: 2 },
    value: { fontSize: 18, fontWeight: '800', color: colors.text },
    label: { fontSize: 10, fontWeight: '600', color: colors.textMuted, textAlign: 'center' },
});
