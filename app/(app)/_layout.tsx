import { colors, spacing } from '@/constants/theme';
import { useAuth } from '@/src/context/auth-context';
import { useUnreadMessages } from '@/src/context/unread-messages-context';
import { tabLabel, visibleTabs, type MobileTabId } from '@/src/lib/role-nav';
import { formatUnreadLabel } from '@/components/messages/UnreadBadge';
import { Ionicons } from '@expo/vector-icons';
import { Redirect, Tabs } from 'expo-router';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

function tabIcon(name: keyof typeof Ionicons.glyphMap, focused: boolean) {
    return <Ionicons color={focused ? colors.brandDark : colors.textMuted} name={name} size={22} />;
}

const TAB_SCREEN: Record<MobileTabId, { name: string; icon: keyof typeof Ionicons.glyphMap }> = {
    home: { name: 'index', icon: 'home-outline' },
    plans: { name: 'plans', icon: 'nutrition-outline' },
    bookings: { name: 'bookings', icon: 'calendar-outline' },
    messages: { name: 'messages', icon: 'chatbubbles-outline' },
    profile: { name: 'profile', icon: 'person-outline' },
};

export default function AppLayout() {
    const { user, bootstrapping } = useAuth();
    const insets = useSafeAreaInsets();
    const { unreadTotal } = useUnreadMessages();

    if (bootstrapping) {
        return (
            <View style={styles.center}>
                <ActivityIndicator size="large" color={colors.brandDark} />
            </View>
        );
    }

    if (!user) {
        return <Redirect href="/login" />;
    }

    const tabs = visibleTabs(user);

    function tabOptions(tab: MobileTabId) {
        const visible = tabs.includes(tab);
        const config = TAB_SCREEN[tab];
        const badge =
            tab === 'messages' && unreadTotal > 0 ? formatUnreadLabel(unreadTotal) : undefined;

        return {
            title: tabLabel(tab, user),
            href: visible ? undefined : null,
            tabBarBadge: badge,
            tabBarBadgeStyle: {
                backgroundColor: colors.brandDark,
                fontSize: 10,
                fontWeight: '700' as const,
                minWidth: 18,
            },
            tabBarIcon: ({ focused }: { focused: boolean }) => tabIcon(config.icon, focused),
        };
    }

    return (
        <Tabs
            screenOptions={{
                headerShown: false,
                tabBarActiveTintColor: colors.brandDark,
                tabBarInactiveTintColor: colors.textMuted,
                tabBarStyle: {
                    backgroundColor: colors.white,
                    borderTopColor: colors.border,
                    height: 56 + insets.bottom,
                    paddingBottom: Math.max(insets.bottom, spacing.sm),
                    paddingTop: 6,
                },
                tabBarLabelStyle: { fontSize: 11, fontWeight: '600' },
            }}
        >
            <Tabs.Screen name="index" options={tabOptions('home')} />
            <Tabs.Screen name="plans" options={tabOptions('plans')} />
            <Tabs.Screen name="bookings" options={tabOptions('bookings')} />
            <Tabs.Screen name="messages" options={tabOptions('messages')} />
            <Tabs.Screen name="profile" options={tabOptions('profile')} />
            <Tabs.Screen name="admin" options={{ href: null }} />
            <Tabs.Screen name="advisor" options={{ href: null }} />
            <Tabs.Screen name="clients" options={{ href: null }} />
            <Tabs.Screen name="payments" options={{ href: null, title: 'Payments' }} />
            <Tabs.Screen name="health-profile" options={{ href: null }} />
            <Tabs.Screen name="meal-plan" options={{ href: null }} />
            <Tabs.Screen name="ai-coach" options={{ href: null }} />
            <Tabs.Screen name="notifications" options={{ href: null }} />
            <Tabs.Screen name="reviews" options={{ href: null }} />
            <Tabs.Screen name="profile-edit" options={{ href: null }} />
        </Tabs>
    );
}

const styles = StyleSheet.create({
    center: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: colors.background,
    },
});
