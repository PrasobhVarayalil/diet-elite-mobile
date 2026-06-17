import { BrandLogo } from '@/components/ui/BrandLogo';
import { colors, radius, spacing, typography } from '@/constants/theme';
import { LinearGradient } from 'expo-linear-gradient';
import { ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type AppHeaderProps = {
    title: string;
    subtitle?: string;
    right?: ReactNode;
    /** Show Diet Elite logo (Noom / HealthifyMe-style branded header). */
    showLogo?: boolean;
};

export function AppHeader({ title, subtitle, right, showLogo = true }: AppHeaderProps) {
    const insets = useSafeAreaInsets();

    return (
        <LinearGradient
            colors={['#3d9e2a', colors.brandDark, '#1a5c10']}
            end={{ x: 1, y: 1 }}
            locations={[0, 0.55, 1]}
            start={{ x: 0, y: 0 }}
            style={[styles.wrap, { paddingTop: insets.top + spacing.md }]}
        >
            <View style={styles.inner}>
                {showLogo ? (
                    <View style={styles.logoRow}>
                        <BrandLogo bordered size="sm" />
                        <Text style={styles.brandName}>Diet Elite</Text>
                    </View>
                ) : null}
                <View style={styles.titleRow}>
                    <View style={styles.textBlock}>
                        <Text ellipsizeMode="tail" numberOfLines={2} style={styles.title}>
                            {title}
                        </Text>
                        {subtitle ? (
                            <Text ellipsizeMode="tail" numberOfLines={2} style={styles.subtitle}>
                                {subtitle}
                            </Text>
                        ) : null}
                    </View>
                    {right ? <View style={styles.right}>{right}</View> : null}
                </View>
            </View>
        </LinearGradient>
    );
}

const styles = StyleSheet.create({
    wrap: {
        paddingHorizontal: spacing.lg,
        paddingBottom: spacing.lg,
        borderBottomLeftRadius: radius.xl,
        borderBottomRightRadius: radius.xl,
    },
    inner: { gap: spacing.sm },
    logoRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.sm,
        marginBottom: 2,
    },
    brandName: {
        fontSize: 13,
        fontWeight: '800',
        letterSpacing: 0.6,
        textTransform: 'uppercase',
        color: 'rgba(255,255,255,0.92)',
    },
    titleRow: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm },
    textBlock: { gap: 4, flex: 1, minWidth: 0 },
    right: { flexShrink: 0 },
    title: { ...typography.hero, fontSize: 26, color: colors.white },
    subtitle: { ...typography.subtitle, color: 'rgba(255,255,255,0.88)' },
});
