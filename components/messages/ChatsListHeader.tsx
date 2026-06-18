import { UnreadBadge } from '@/components/messages/UnreadBadge';
import { NotificationBellButton } from '@/components/notifications/NotificationBellButton';
import { colors, spacing } from '@/constants/theme';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type Props = {
    title?: string;
    unreadTotal?: number;
    onCompose?: () => void;
};

export function ChatsListHeader({ title = 'Chats', unreadTotal = 0, onCompose }: Props) {
    const insets = useSafeAreaInsets();

    return (
        <LinearGradient
            colors={['#3d9e2a', colors.brandDark, '#1a5c10']}
            end={{ x: 1, y: 1 }}
            start={{ x: 0, y: 0 }}
            style={[styles.wrap, { paddingTop: insets.top + spacing.sm }]}
        >
            <View style={styles.row}>
                <View style={styles.text}>
                    <Text style={styles.title}>{title}</Text>
                    <Text style={styles.sub}>
                        {unreadTotal > 0
                            ? `${unreadTotal} unread message${unreadTotal === 1 ? '' : 's'}`
                            : 'All caught up'}
                    </Text>
                </View>
                <View style={styles.actions}>
                    {onCompose ? (
                        <Pressable
                            accessibilityLabel="Start new message"
                            hitSlop={8}
                            onPress={onCompose}
                            style={({ pressed }) => [styles.composeBtn, pressed && styles.composePressed]}
                        >
                            <Ionicons color={colors.white} name="create-outline" size={22} />
                        </Pressable>
                    ) : null}
                    <UnreadBadge count={unreadTotal} />
                    <NotificationBellButton accessibilityLabel="Open notifications" />
                </View>
            </View>
        </LinearGradient>
    );
}

const styles = StyleSheet.create({
    wrap: {
        paddingHorizontal: spacing.lg,
        paddingBottom: spacing.md,
        borderBottomLeftRadius: 20,
        borderBottomRightRadius: 20,
    },
    row: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.md,
        minHeight: 48,
    },
    text: { flex: 1, minWidth: 0 },
    actions: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, flexShrink: 0 },
    composeBtn: {
        width: 40,
        height: 40,
        borderRadius: 20,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(255,255,255,0.2)',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.35)',
    },
    composePressed: { opacity: 0.85 },
    title: { fontSize: 24, fontWeight: '800', color: colors.white, letterSpacing: -0.3 },
    sub: { fontSize: 13, color: 'rgba(255,255,255,0.88)', marginTop: 2 },
});
