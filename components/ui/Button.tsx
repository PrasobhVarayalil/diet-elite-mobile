import { colors, spacing } from '@/constants/theme';
import { ActivityIndicator, Pressable, StyleSheet, Text, type PressableProps } from 'react-native';

type ButtonProps = PressableProps & {
    label: string;
    loading?: boolean;
    variant?: 'primary' | 'secondary';
};

export function Button({ label, loading, variant = 'primary', disabled, ...rest }: ButtonProps) {
    const isPrimary = variant === 'primary';

    return (
        <Pressable
            accessibilityRole="button"
            disabled={disabled || loading}
            style={({ pressed }) => [
                styles.base,
                isPrimary ? styles.primary : styles.secondary,
                (disabled || loading) && styles.disabled,
                pressed && !disabled && !loading ? styles.pressed : null,
            ]}
            {...rest}
        >
            {loading ? (
                <ActivityIndicator color={isPrimary ? colors.white : colors.brandDark} />
            ) : (
                <Text style={[styles.label, isPrimary ? styles.primaryLabel : styles.secondaryLabel]}>
                    {label}
                </Text>
            )}
        </Pressable>
    );
}

const styles = StyleSheet.create({
    base: {
        minHeight: 48,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: spacing.lg,
    },
    primary: {
        backgroundColor: colors.brandDark,
    },
    secondary: {
        backgroundColor: colors.white,
        borderWidth: 1,
        borderColor: colors.border,
    },
    disabled: {
        opacity: 0.6,
    },
    pressed: {
        opacity: 0.9,
    },
    label: {
        fontSize: 16,
        fontWeight: '600',
    },
    primaryLabel: {
        color: colors.white,
    },
    secondaryLabel: {
        color: colors.brandDark,
    },
});
