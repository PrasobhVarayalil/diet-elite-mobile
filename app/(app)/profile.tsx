import { Button } from '@/components/ui/Button';
import { Screen } from '@/components/ui/Screen';
import { colors, spacing } from '@/constants/theme';
import { useAuth } from '@/src/context/auth-context';
import { apiBaseUrl } from '@/src/lib/config';
import { router } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

export default function ProfileScreen() {
    const { user, logout } = useAuth();

    async function onLogout() {
        await logout();
        router.replace('/login');
    }

    return (
        <Screen title="Profile">
            <View style={styles.card}>
                <Text style={styles.label}>Name</Text>
                <Text style={styles.value}>{user?.name}</Text>
            </View>
            <View style={styles.card}>
                <Text style={styles.label}>Email</Text>
                <Text style={styles.value}>{user?.email}</Text>
            </View>
            <View style={styles.card}>
                <Text style={styles.label}>Username</Text>
                <Text style={styles.value}>{user?.username}</Text>
            </View>
            <View style={styles.card}>
                <Text style={styles.label}>Role</Text>
                <Text style={styles.value}>{user?.role_label}</Text>
            </View>
            <View style={styles.card}>
                <Text style={styles.label}>API server</Text>
                <Text style={styles.mono}>{apiBaseUrl()}</Text>
            </View>
            <Button label="Sign out" onPress={onLogout} variant="secondary" />
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
        gap: spacing.xs,
    },
    label: {
        fontSize: 13,
        fontWeight: '600',
        color: colors.textMuted,
    },
    value: {
        fontSize: 16,
        color: colors.text,
    },
    mono: {
        fontSize: 13,
        color: colors.textMuted,
    },
});
