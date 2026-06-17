import { colors, radius, spacing } from '@/constants/theme';
import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, type PressableProps } from 'react-native';

type Props = PressableProps & {
    icon: keyof typeof Ionicons.glyphMap;
    label?: string;
    accessibilityLabel: string;
};

export function HeaderIconButton({ icon, label, accessibilityLabel, ...rest }: Props) {
    return (
        <Pressable
            accessibilityLabel={accessibilityLabel}
            accessibilityRole="button"
            hitSlop={8}
            style={({ pressed }) => [styles.wrap, pressed && styles.pressed]}
            {...rest}
        >
            <Ionicons color={colors.white} name={icon} size={22} />
            {label ? <Text style={styles.label}>{label}</Text> : null}
        </Pressable>
    );
}

const styles = StyleSheet.create({
    wrap: {
        alignItems: 'center',
        justifyContent: 'center',
        minWidth: 44,
        minHeight: 44,
        paddingHorizontal: spacing.sm,
        borderRadius: radius.md,
        backgroundColor: 'rgba(255,255,255,0.18)',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.28)',
        gap: 2,
    },
    pressed: { opacity: 0.85 },
    label: {
        fontSize: 10,
        fontWeight: '700',
        color: 'rgba(255,255,255,0.95)',
        letterSpacing: 0.2,
    },
});
