import { colors } from '@/constants/theme';
import { StyleSheet, Text, View } from 'react-native';

type Props = {
    count: number;
    size?: 'sm' | 'md';
};

export function formatUnreadLabel(count: number): string {
    if (count <= 0) {
        return '';
    }
    if (count > 99) {
        return '99+';
    }
    return String(count);
}

export function UnreadBadge({ count, size = 'md' }: Props) {
    const label = formatUnreadLabel(count);
    if (!label) {
        return null;
    }

    const isSm = size === 'sm';

    return (
        <View style={[styles.base, isSm && styles.sm]}>
            <Text style={[styles.text, isSm && styles.textSm]}>{label}</Text>
        </View>
    );
}

const styles = StyleSheet.create({
    base: {
        minWidth: 22,
        height: 22,
        paddingHorizontal: 6,
        borderRadius: 11,
        backgroundColor: colors.brandDark,
        alignItems: 'center',
        justifyContent: 'center',
    },
    sm: {
        minWidth: 18,
        height: 18,
        paddingHorizontal: 4,
        borderRadius: 9,
    },
    text: {
        color: colors.white,
        fontSize: 12,
        fontWeight: '800',
    },
    textSm: { fontSize: 10 },
});
