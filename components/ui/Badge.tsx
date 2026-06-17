import { colors, radius, spacing } from '@/constants/theme';
import { StyleSheet, Text, View } from 'react-native';

type BadgeProps = {
    label: string;
    tone?: 'brand' | 'success' | 'warning' | 'neutral';
};

export function Badge({ label, tone = 'brand' }: BadgeProps) {
    return (
        <View style={[styles.base, styles[tone]]}>
            <Text
                ellipsizeMode="tail"
                numberOfLines={2}
                style={[styles.text, styles[`${tone}Text` as keyof typeof styles]]}
            >
                {label}
            </Text>
        </View>
    );
}

const styles = StyleSheet.create({
    base: {
        alignSelf: 'flex-start',
        maxWidth: '100%',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: radius.pill,
    },
    brand: { backgroundColor: colors.brandMuted },
    success: { backgroundColor: colors.successBg },
    warning: { backgroundColor: colors.warningBg },
    neutral: { backgroundColor: colors.overlay },
    text: { fontSize: 12, fontWeight: '700' },
    brandText: { color: colors.brandDark },
    successText: { color: colors.success },
    warningText: { color: colors.warning },
    neutralText: { color: colors.textMuted },
});
