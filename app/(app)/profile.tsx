import { AppHeader } from '@/components/ui/AppHeader';
import { BrandLogo } from '@/components/ui/BrandLogo';
import { MenuRow } from '@/components/ui/MenuRow';
import { Button } from '@/components/ui/Button';
import { colors, spacing } from '@/constants/theme';
import { useAuth } from '@/src/context/auth-context';
import { useUnreadMessages } from '@/src/context/unread-messages-context';
import { useUnreadNotifications } from '@/src/context/unread-notifications-context';
import { apiBaseUrl } from '@/src/lib/config';
import { profileMenuFor, staffPortalMessage } from '@/src/lib/role-nav';
import { isCustomer } from '@/src/lib/user-access';
import { useRouter } from 'expo-router';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

export default function ProfileScreen() {
    const router = useRouter();
    const { user, logout } = useAuth();
    const { unreadTotal } = useUnreadMessages();
    const { unreadCount: unreadNotifications } = useUnreadNotifications();
    const menu = profileMenuFor(user);
    const programItems = menu.filter((item) => item.section === 'program');
    const accountItems = menu.filter((item) => item.section === 'account');
    const portalMessage = staffPortalMessage(user);

    async function onLogout() {
        await logout();
        router.replace('/login');
    }

    return (
        <View style={styles.root}>
            <AppHeader showLogo={false} subtitle="Account & settings" title={user?.name ?? 'Profile'} />
            <ScrollView contentContainerStyle={styles.content}>
                <View style={styles.heroCard}>
                    <BrandLogo bordered size="lg" />
                    <Text style={styles.name}>{user?.name}</Text>
                    <Text style={styles.role}>{user?.role_label}</Text>
                    <Text style={styles.meta}>
                        {isCustomer(user)
                            ? `Member ${user?.member_code ?? '—'}`
                            : `Code ${user?.employee_code ?? user?.member_code ?? '—'}`}
                    </Text>
                </View>

                {portalMessage ? (
                    <Text style={styles.portalHint}>{portalMessage}</Text>
                ) : null}

                {programItems.length > 0 ? (
                    <>
                        <Text style={styles.sectionLabel}>
                            {isCustomer(user) ? 'Your program' : 'Work'}
                        </Text>
                        {programItems.map((item) => (
                            <MenuRow
                                key={item.route}
                                badge={
                                    item.route.includes('/messages') && unreadTotal > 0
                                        ? unreadTotal
                                        : undefined
                                }
                                icon={item.icon}
                                label={item.label}
                                onPress={() => router.push(item.route as never)}
                                subtitle={item.subtitle}
                            />
                        ))}
                    </>
                ) : null}

                <Text style={styles.sectionLabel}>Account</Text>
                {accountItems.map((item) => (
                    <MenuRow
                        key={item.route}
                        badge={
                            item.route.includes('/notifications') && unreadNotifications > 0
                                ? unreadNotifications
                                : undefined
                        }
                        icon={item.icon}
                        label={item.label}
                        onPress={() => router.push(item.route as never)}
                        subtitle={item.subtitle}
                    />
                ))}

                <Text style={styles.devMeta}>API: {apiBaseUrl()}</Text>

                <Button label="Sign out" onPress={onLogout} style={{ marginTop: spacing.lg }} variant="secondary" />
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    root: { flex: 1, backgroundColor: colors.background },
    content: { padding: spacing.lg, paddingBottom: spacing.xl },
    heroCard: {
        backgroundColor: colors.card,
        borderRadius: 20,
        padding: spacing.lg,
        marginBottom: spacing.lg,
        borderWidth: 1,
        borderColor: colors.border,
        alignItems: 'center',
        gap: 6,
    },
    name: { fontSize: 20, fontWeight: '800', color: colors.text, marginTop: spacing.sm },
    role: { fontSize: 14, fontWeight: '700', color: colors.brandDark },
    meta: { fontSize: 13, color: colors.textMuted },
    portalHint: {
        fontSize: 13,
        color: colors.textMuted,
        lineHeight: 20,
        marginBottom: spacing.md,
        textAlign: 'center',
    },
    sectionLabel: {
        fontSize: 12,
        fontWeight: '700',
        letterSpacing: 0.5,
        textTransform: 'uppercase',
        color: colors.textMuted,
        marginBottom: spacing.sm,
        marginTop: spacing.sm,
    },
    devMeta: { fontSize: 11, color: colors.textMuted, marginTop: spacing.md, textAlign: 'center' },
});
