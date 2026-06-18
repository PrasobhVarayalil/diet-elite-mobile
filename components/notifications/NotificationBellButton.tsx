import { formatUnreadLabel } from '@/components/messages/UnreadBadge';
import { colors, radius } from '@/constants/theme';
import { useUnreadNotifications } from '@/src/context/unread-notifications-context';
import { APP_ROUTES } from '@/src/lib/navigation';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

type Props = {
    accessibilityLabel?: string;
};

export function NotificationBellButton({
    accessibilityLabel = 'Open notifications',
}: Props) {
    const router = useRouter();
    const { unreadCount } = useUnreadNotifications();
    const badge = formatUnreadLabel(unreadCount);

    return (
        <Pressable
            accessibilityLabel={accessibilityLabel}
            accessibilityRole="button"
            hitSlop={8}
            onPress={() => router.push(APP_ROUTES.notifications)}
            style={({ pressed }) => [styles.wrap, pressed && styles.pressed]}
        >
            <Ionicons color={colors.white} name="notifications-outline" size={22} />
            {badge ? (
                <View style={styles.badge}>
                    <Text style={styles.badgeText}>{badge}</Text>
                </View>
            ) : null}
        </Pressable>
    );
}

const styles = StyleSheet.create({
    wrap: {
        alignItems: 'center',
        justifyContent: 'center',
        width: 44,
        height: 44,
        borderRadius: radius.md,
        backgroundColor: 'rgba(255,255,255,0.18)',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.28)',
    },
    pressed: { opacity: 0.85 },
    badge: {
        position: 'absolute',
        top: 4,
        right: 4,
        minWidth: 18,
        height: 18,
        paddingHorizontal: 4,
        borderRadius: 9,
        backgroundColor: '#ef4444',
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1.5,
        borderColor: colors.brandDark,
    },
    badgeText: {
        color: colors.white,
        fontSize: 10,
        fontWeight: '800',
    },
});
