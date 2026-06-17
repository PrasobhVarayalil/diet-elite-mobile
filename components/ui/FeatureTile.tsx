import { chartPalette, colors, radius, spacing } from '@/constants/theme';
import { Ionicons } from '@expo/vector-icons';
import { ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

type FeatureTileProps = {
    icon: keyof typeof Ionicons.glyphMap;
    label: string;
    colorIndex?: number;
    onPress: () => void;
};

export function FeatureTile({ icon, label, colorIndex = 0, onPress }: FeatureTileProps) {
    const accent = chartPalette[colorIndex % chartPalette.length];

    return (
        <Pressable onPress={onPress} style={({ pressed }) => [styles.tile, pressed && styles.pressed]}>
            <View style={[styles.iconWrap, { backgroundColor: `${accent}22` }]}>
                <Ionicons color={accent} name={icon} size={22} />
            </View>
            <Text style={styles.label}>{label}</Text>
        </Pressable>
    );
}

type FeatureGridProps = {
    children: ReactNode;
};

export function FeatureGrid({ children }: FeatureGridProps) {
    return <View style={styles.grid}>{children}</View>;
}

const styles = StyleSheet.create({
    grid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: spacing.sm,
    },
    tile: {
        flexGrow: 1,
        flexBasis: '47%',
        minWidth: '45%',
        maxWidth: '50%',
        minHeight: 96,
        backgroundColor: colors.card,
        borderRadius: radius.lg,
        borderWidth: 1,
        borderColor: colors.border,
        padding: spacing.md,
        gap: spacing.sm,
        justifyContent: 'center',
    },
    pressed: { opacity: 0.92 },
    iconWrap: {
        width: 44,
        height: 44,
        borderRadius: 14,
        alignItems: 'center',
        justifyContent: 'center',
    },
    label: {
        fontSize: 14,
        fontWeight: '700',
        color: colors.text,
        lineHeight: 18,
        flexShrink: 1,
    },
});
