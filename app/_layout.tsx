import { AuthProvider } from '@/src/context/auth-context';
import { UnreadMessagesProvider } from '@/src/context/unread-messages-context';
import { colors } from '@/constants/theme';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

export default function RootLayout() {
    return (
        <AuthProvider>
            <UnreadMessagesProvider>
                <StatusBar style="dark" />
                <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.background } }}>
                    <Stack.Screen name="index" />
                    <Stack.Screen name="login" />
                    <Stack.Screen name="(app)" />
                </Stack>
            </UnreadMessagesProvider>
        </AuthProvider>
    );
}
