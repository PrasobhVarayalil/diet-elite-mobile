import { AppHeader } from '@/components/ui/AppHeader';
import { MenuRow } from '@/components/ui/MenuRow';
import { colors, spacing } from '@/constants/theme';
import { ADMIN_MENU } from '@/src/lib/admin-nav';
import { Stack, useRouter } from 'expo-router';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function AdminHubScreen() {
    const router = useRouter();
    const insets = useSafeAreaInsets();

    return (
        <View style={styles.root}>
            <Stack.Screen options={{ headerShown: false }} />
            <AppHeader subtitle="Full platform management" title="Admin portal" />
            <ScrollView
                contentContainerStyle={[styles.content, { paddingBottom: spacing.xl + insets.bottom }]}
                showsVerticalScrollIndicator={false}
            >
                <Text style={styles.note}>
                    All actions are secured server-side. Only active admin accounts can use these tools.
                </Text>
                {ADMIN_MENU.map((item) => (
                    <MenuRow
                        key={item.label}
                        icon={item.icon}
                        label={item.label}
                        onPress={() => router.push(item.href)}
                        subtitle={item.subtitle}
                    />
                ))}
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    root: { flex: 1, backgroundColor: colors.background },
    content: { padding: spacing.lg, paddingTop: spacing.md },
    note: { fontSize: 13, color: colors.textMuted, marginBottom: spacing.lg, lineHeight: 20 },
});
