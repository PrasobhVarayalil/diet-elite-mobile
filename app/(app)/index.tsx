import { Screen } from '@/components/ui/Screen';
import { colors, spacing } from '@/constants/theme';
import { useAuth } from '@/src/context/auth-context';
import { StyleSheet, Text, View } from 'react-native';

export default function HomeScreen() {
    const { user } = useAuth();

    const planLine =
        user?.has_active_plan === true
            ? 'Your plan is active — browse bookings and health tools on web for now.'
            : user?.plan_access === 'expired'
              ? `Your plan expired${user.expired_plan_name ? `: ${user.expired_plan_name}` : ''}. Renew from Plans.`
              : 'Browse plans and enroll to unlock your dashboard features.';

    return (
        <Screen title={`Hello, ${user?.name?.split(' ')[0] ?? 'there'}`} subtitle={planLine}>
            <View style={styles.card}>
                <Text style={styles.label}>Role</Text>
                <Text style={styles.value}>{user?.role_label}</Text>
            </View>

            <View style={styles.card}>
                <Text style={styles.label}>Plan access</Text>
                <Text style={styles.value}>{user?.plan_access ?? 'none'}</Text>
            </View>

            <View style={styles.card}>
                <Text style={styles.label}>Mobile MVP</Text>
                <Text style={styles.body}>
                    Login, plans list, and plan details are wired to the same Laravel API as the web app.
                    Bookings, messages, and checkout will follow in the next iterations.
                </Text>
            </View>
        </Screen>
    );
}

const styles = StyleSheet.create({
    card: {
        backgroundColor: colors.card,
        borderRadius: 16,
        padding: spacing.lg,
        marginBottom: spacing.md,
        borderWidth: 1,
        borderColor: colors.border,
        gap: spacing.sm,
    },
    label: {
        fontSize: 13,
        fontWeight: '600',
        color: colors.textMuted,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    value: {
        fontSize: 18,
        fontWeight: '600',
        color: colors.text,
    },
    body: {
        fontSize: 15,
        lineHeight: 22,
        color: colors.textMuted,
    },
});
