import { colors, radius, shadow, spacing } from '@/constants/theme';
import { ReactNode } from 'react';
import { StyleSheet, Text, View, type ViewProps } from 'react-native';

type CardProps = ViewProps & {
    children: ReactNode;
    tone?: 'default' | 'accent' | 'muted';
};

export function Card({ children, tone = 'default', style, ...rest }: CardProps) {
    return (
        <View
            style={[
                styles.base,
                tone === 'accent' && styles.accent,
                tone === 'muted' && styles.muted,
                style,
            ]}
            {...rest}
        >
            {children}
        </View>
    );
}

export function SectionTitle({ children }: { children: string }) {
    return <Text style={styles.sectionTitle}>{children}</Text>;
}

const styles = StyleSheet.create({
    base: {
        backgroundColor: colors.card,
        borderRadius: radius.lg,
        padding: spacing.lg,
        borderWidth: 1,
        borderColor: colors.border,
        gap: spacing.md,
        ...shadow.card,
    },
    accent: {
        backgroundColor: colors.brandMuted,
        borderColor: colors.brandLight,
    },
    muted: {
        backgroundColor: colors.background,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: colors.text,
        marginBottom: spacing.sm,
    },
});
