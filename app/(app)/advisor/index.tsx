import { AppHeader } from '@/components/ui/AppHeader';
import { MenuRow } from '@/components/ui/MenuRow';
import { colors, spacing } from '@/constants/theme';
import { appHref } from '@/src/lib/navigation';
import { Stack, useRouter } from 'expo-router';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

export default function AdvisorHubScreen() {
    const router = useRouter();

    return (
        <View style={styles.root}>
            <Stack.Screen options={{ headerShown: false }} />
            <AppHeader subtitle="Enrollments & first consults" title="Advisor portal" />
            <ScrollView contentContainerStyle={styles.content}>
                <Text style={styles.note}>
                    Create enrollments and book first consultations for new customers.
                </Text>
                <MenuRow
                    icon="list-outline"
                    label="Enrollments"
                    onPress={() => router.push(appHref('/(app)/advisor/enrollments'))}
                    subtitle="Plans you enrolled customers into"
                />
                <MenuRow
                    icon="person-add-outline"
                    label="New enrollment"
                    onPress={() => router.push(appHref('/(app)/advisor/enrollments/create'))}
                />
                <MenuRow
                    icon="calendar-outline"
                    label="First consult bookings"
                    onPress={() => router.push(appHref('/(app)/bookings'))}
                />
                <MenuRow
                    icon="add-circle-outline"
                    label="Book first consult"
                    onPress={() => router.push(appHref('/(app)/advisor/bookings/create'))}
                />
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    root: { flex: 1, backgroundColor: colors.background },
    content: { padding: spacing.lg, gap: spacing.xs, paddingBottom: spacing.xl },
    note: { fontSize: 13, color: colors.textMuted, marginBottom: spacing.md, lineHeight: 20 },
});
