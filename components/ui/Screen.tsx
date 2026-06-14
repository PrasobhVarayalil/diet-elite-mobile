import { colors, spacing } from '@/constants/theme';
import { ActivityIndicator, StyleSheet, Text, View, type ViewProps } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

type ScreenProps = ViewProps & {
    title?: string;
    subtitle?: string;
    loading?: boolean;
    padded?: boolean;
};

export function Screen({ title, subtitle, loading, padded = true, children, style, ...rest }: ScreenProps) {
    return (
        <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
            <View style={[styles.container, padded && styles.padded, style]} {...rest}>
                {title ? <Text style={styles.title}>{title}</Text> : null}
                {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
                {loading ? (
                    <View style={styles.loadingWrap}>
                        <ActivityIndicator size="large" color={colors.brandDark} />
                    </View>
                ) : (
                    children
                )}
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safe: {
        flex: 1,
        backgroundColor: colors.background,
    },
    container: {
        flex: 1,
    },
    padded: {
        padding: spacing.lg,
    },
    title: {
        fontSize: 28,
        fontWeight: '700',
        color: colors.text,
        marginBottom: spacing.sm,
    },
    subtitle: {
        fontSize: 15,
        color: colors.textMuted,
        marginBottom: spacing.lg,
        lineHeight: 22,
    },
    loadingWrap: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
});
