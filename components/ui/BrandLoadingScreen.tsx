import { BrandLogo } from '@/components/ui/BrandLogo';
import { colors, spacing, typography } from '@/constants/theme';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';

type Props = {
    message?: string;
};

export function BrandLoadingScreen({ message = 'Loading…' }: Props) {
    return (
        <View style={styles.root}>
            <View style={styles.card}>
                <BrandLogo bordered size="lg" />
                <Text style={styles.brand}>Diet Elite</Text>
                <ActivityIndicator color={colors.brandDark} size="small" style={styles.spinner} />
                <Text style={styles.message}>{message}</Text>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    root: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: colors.background,
        padding: spacing.lg,
    },
    card: {
        alignItems: 'center',
        gap: spacing.sm,
        paddingVertical: spacing.xl,
        paddingHorizontal: spacing.xl,
    },
    brand: {
        ...typography.title,
        color: colors.brandDark,
        marginTop: spacing.xs,
    },
    spinner: { marginTop: spacing.md },
    message: {
        fontSize: 14,
        color: colors.textMuted,
        marginTop: spacing.xs,
    },
});
