import { colors } from '@/constants/theme';
import { useAuth } from '@/src/context/auth-context';
import { Redirect, Tabs } from 'expo-router';
import { ActivityIndicator, StyleSheet, View } from 'react-native';

export default function AppLayout() {
    const { user, bootstrapping } = useAuth();

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

    return (
        <Tabs
            screenOptions={{
                headerShown: true,
                headerStyle: { backgroundColor: colors.background },
                headerTintColor: colors.brandDark,
                tabBarActiveTintColor: colors.brandDark,
                tabBarInactiveTintColor: colors.textMuted,
                tabBarStyle: { backgroundColor: colors.white, borderTopColor: colors.border },
            }}
        >
            <Tabs.Screen name="index" options={{ title: 'Home', tabBarLabel: 'Home' }} />
            <Tabs.Screen name="plans/index" options={{ title: 'Plans', tabBarLabel: 'Plans' }} />
            <Tabs.Screen name="bookings/index" options={{ title: 'Bookings', tabBarLabel: 'Bookings' }} />
            <Tabs.Screen name="payments" options={{ title: 'Payments', tabBarLabel: 'Payments' }} />
            <Tabs.Screen name="profile" options={{ title: 'Profile', tabBarLabel: 'Profile' }} />
            <Tabs.Screen
                name="bookings/create"
                options={{
                    href: null,
                    title: 'Book consultation',
                }}
            />
            <Tabs.Screen
                name="plans/[id]"
                options={{
                    href: null,
                    title: 'Plan details',
                }}
            />
            <Tabs.Screen
                name="plans/[id]/checkout"
                options={{
                    href: null,
                    title: 'Checkout',
                }}
            />
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
