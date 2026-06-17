import { BrandLogo } from '@/components/ui/BrandLogo';
import { Card, SectionTitle } from '@/components/ui/Card';
import { MenuRow } from '@/components/ui/MenuRow';
import { colors, spacing } from '@/constants/theme';
import { useAuth } from '@/src/context/auth-context';
import { APP_ROUTES } from '@/src/lib/navigation';
import { staffPortalMessage } from '@/src/lib/role-nav';
import { useRouter } from 'expo-router';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

export function StaffHomeScreen() {
    const router = useRouter();
    const { user } = useAuth();
    const portalMessage = staffPortalMessage(user);
    const firstName = user?.name?.split(' ')[0] ?? 'there';

    return (
        <ScrollView contentContainerStyle={styles.content} style={styles.flex}>
            <View style={styles.hero}>
                <BrandLogo bordered size="md" />
                <Text style={styles.greeting}>Hello, {firstName}</Text>
                <Text style={styles.role}>{user?.role_label}</Text>
            </View>

            <Card>
                <SectionTitle>Mobile access</SectionTitle>
                {portalMessage ? <Text style={styles.body}>{portalMessage}</Text> : null}
                <Text style={styles.body}>
                    Sign in on a desktop browser for additional {user?.role_label?.toLowerCase()} tools.
                </Text>
            </Card>

            <Card>
                <SectionTitle>On this device</SectionTitle>
                <MenuRow
                    icon="notifications-outline"
                    label="Notifications"
                    onPress={() => router.push(APP_ROUTES.notifications)}
                />
                <MenuRow
                    icon="person-outline"
                    label="Profile"
                    onPress={() => router.push(APP_ROUTES.profile)}
                />
            </Card>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    flex: { flex: 1 },
    content: { padding: spacing.lg, gap: spacing.md, paddingBottom: spacing.xl },
    hero: { alignItems: 'center', gap: 6, marginBottom: spacing.sm },
    greeting: { fontSize: 22, fontWeight: '800', color: colors.text, marginTop: spacing.sm },
    role: { fontSize: 14, fontWeight: '700', color: colors.brandDark },
    body: { fontSize: 15, color: colors.textMuted, lineHeight: 22 },
});
