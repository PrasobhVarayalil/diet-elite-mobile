import { ConversationAvatar } from '@/components/messages/ConversationAvatar';
import { colors, spacing } from '@/constants/theme';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type Props = {
    name: string;
    subtitle?: string;
    onBack: () => void;
};

export function ChatHeader({ name, subtitle = 'Secure chat', onBack }: Props) {
    const insets = useSafeAreaInsets();

    return (
        <LinearGradient
            colors={[colors.brandDark, '#1a5c10']}
            end={{ x: 1, y: 1 }}
            start={{ x: 0, y: 0 }}
            style={[styles.wrap, { paddingTop: insets.top + spacing.xs }]}
        >
            <View style={styles.row}>
                <Pressable hitSlop={12} onPress={onBack} style={styles.back}>
                    <Ionicons color={colors.white} name="chevron-back" size={26} />
                </Pressable>
                <ConversationAvatar name={name} size="sm" style={styles.avatar} />
                <View style={styles.text}>
                    <Text ellipsizeMode="tail" numberOfLines={1} style={styles.name}>
                        {name}
                    </Text>
                    <Text ellipsizeMode="tail" numberOfLines={1} style={styles.sub}>
                        {subtitle}
                    </Text>
                </View>
            </View>
        </LinearGradient>
    );
}

const styles = StyleSheet.create({
    wrap: {
        paddingBottom: spacing.sm,
        paddingHorizontal: spacing.sm,
    },
    row: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.sm,
        minHeight: 44,
    },
    back: {
        width: 36,
        height: 36,
        alignItems: 'center',
        justifyContent: 'center',
    },
    avatar: {
        borderColor: 'rgba(255,255,255,0.35)',
    },
    text: { flex: 1, minWidth: 0 },
    name: { fontSize: 17, fontWeight: '700', color: colors.white },
    sub: { fontSize: 12, color: 'rgba(255,255,255,0.82)', marginTop: 1 },
});
