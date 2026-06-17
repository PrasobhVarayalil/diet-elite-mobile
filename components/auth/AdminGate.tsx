import { colors, spacing } from '@/constants/theme';
import { useAuth } from '@/src/context/auth-context';
import { isAdmin } from '@/src/lib/user-access';
import { useRouter } from 'expo-router';
import type { ReactNode } from 'react';
import { useEffect } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';

type Props = {
    children: ReactNode;
};

/** Client-side guard — server enforces role:admin on every /api/v1/admin/* call. */
export function AdminGate({ children }: Props) {
    const router = useRouter();
    const { user, bootstrapping } = useAuth();

    useEffect(() => {
        if (!bootstrapping && user && !isAdmin(user)) {
            router.replace('/(app)');
        }
    }, [bootstrapping, user, router]);

    if (bootstrapping) {
        return (
            <View style={styles.center}>
                <ActivityIndicator color={colors.brandDark} size="large" />
            </View>
        );
    }

    if (!isAdmin(user)) {
        return (
            <View style={styles.center}>
                <Text style={styles.title}>Admin access required</Text>
                <Text style={styles.hint}>This area is restricted to administrators.</Text>
            </View>
        );
    }

    return <>{children}</>;
}

const styles = StyleSheet.create({
    center: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        padding: spacing.lg,
        backgroundColor: colors.background,
        gap: spacing.sm,
    },
    title: { fontSize: 18, fontWeight: '700', color: colors.text },
    hint: { fontSize: 14, color: colors.textMuted, textAlign: 'center' },
});
