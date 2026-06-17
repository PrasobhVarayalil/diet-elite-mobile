import { chartPalette, colors } from '@/constants/theme';
import { StyleSheet, Text, View, type ViewStyle } from 'react-native';

type Size = 'sm' | 'md' | 'lg';

const SIZES: Record<Size, { box: number; font: number }> = {
    sm: { box: 36, font: 13 },
    md: { box: 48, font: 16 },
    lg: { box: 56, font: 18 },
};

function initials(name: string): string {
    const parts = name.trim().split(/\s+/).filter(Boolean);
    if (parts.length === 0) {
        return '?';
    }
    if (parts.length === 1) {
        return parts[0].slice(0, 2).toUpperCase();
    }
    return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
}

function accentForName(name: string): string {
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
        hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    return chartPalette[Math.abs(hash) % chartPalette.length];
}

type Props = {
    name: string;
    size?: Size;
    style?: ViewStyle;
};

export function ConversationAvatar({ name, size = 'md', style }: Props) {
    const dim = SIZES[size];
    const accent = accentForName(name);

    return (
        <View
            style={[
                styles.base,
                {
                    width: dim.box,
                    height: dim.box,
                    borderRadius: dim.box / 2,
                    backgroundColor: `${accent}33`,
                },
                style,
            ]}
        >
            <Text style={[styles.text, { fontSize: dim.font, color: accent }]}>{initials(name)}</Text>
        </View>
    );
}

const styles = StyleSheet.create({
    base: {
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: colors.border,
    },
    text: { fontWeight: '800', letterSpacing: 0.3 },
});
