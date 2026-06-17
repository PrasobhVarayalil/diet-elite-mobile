import { AdminPortalDashboard } from '@/components/home/AdminPortalDashboard';
import { AppHeader } from '@/components/ui/AppHeader';
import { colors } from '@/constants/theme';
import { Stack } from 'expo-router';
import { StyleSheet, View } from 'react-native';

/** Portal analytics — charts, revenue, and platform metrics (distinct from Home tab). */
export default function AdminDashboardScreen() {
    return (
        <View style={styles.root}>
            <Stack.Screen options={{ headerShown: false }} />
            <AppHeader subtitle="Revenue, charts & growth" title="Analytics dashboard" />
            <AdminPortalDashboard />
        </View>
    );
}

const styles = StyleSheet.create({
    root: { flex: 1, backgroundColor: colors.background },
});
