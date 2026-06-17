import { colors, radius, spacing } from '@/constants/theme';
import { formatUnreadLabel } from '@/components/messages/UnreadBadge';
import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';

type MenuRowProps = {
    icon: keyof typeof Ionicons.glyphMap;
    label: string;
    subtitle?: string;
    onPress: () => void;
    badge?: string | number;
};

export function MenuRow({ icon, label, subtitle, onPress, badge }: MenuRowProps) {
    return (
        <Pressable onPress={onPress} style={({ pressed }) => [styles.row, pressed && styles.pressed]}>
            <View style={styles.iconWrap}>
                <Ionicons color={colors.brandDark} name={icon} size={20} />
            </View>
            <View style={styles.content}>
                <Text ellipsizeMode="tail" numberOfLines={1} style={styles.label}>
                    {label}
                </Text>
                {subtitle ? (
                    <Text ellipsizeMode="tail" numberOfLines={2} style={styles.subtitle}>
                        {subtitle}
                    </Text>
                ) : null}
            </View>
            {badge != null && Number(badge) > 0 ? (
                <View style={styles.badge}>
                    <Text style={styles.badgeText}>{formatUnreadLabel(Number(badge))}</Text>
                </View>
            ) : null}
            <Ionicons color={colors.textMuted} name="chevron-forward" size={18} />
        </Pressable>
    );
}

const styles = StyleSheet.create({
    row: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.md,
        paddingVertical: spacing.md,
        paddingHorizontal: spacing.md,
        backgroundColor: colors.card,
        borderRadius: radius.md,
        borderWidth: 1,
        borderColor: colors.border,
        marginBottom: spacing.sm,
    },
    pressed: { opacity: 0.92 },
    iconWrap: {
        width: 40,
        height: 40,
        borderRadius: 12,
        backgroundColor: colors.brandMuted,
        alignItems: 'center',
        justifyContent: 'center',
    },
    content: { flex: 1, gap: 2, minWidth: 0 },
    label: { fontSize: 16, fontWeight: '600', color: colors.text },
    subtitle: { fontSize: 13, color: colors.textMuted },
    badge: {
        minWidth: 22,
        height: 22,
        borderRadius: 11,
        backgroundColor: colors.brandDark,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 6,
    },
    badgeText: { color: colors.white, fontSize: 11, fontWeight: '700' },
});
