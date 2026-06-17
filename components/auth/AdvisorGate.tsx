import { colors, spacing } from '@/constants/theme';
import { useAuth } from '@/src/context/auth-context';
import { isAdvisor } from '@/src/lib/user-access';
import { useRouter } from 'expo-router';
import type { ReactNode } from 'react';
import { useEffect } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';

type Props = {
    children: ReactNode;
};

export function AdvisorGate({ children }: Props) {
    const router = useRouter();
    const { user, bootstrapping } = useAuth();

    useEffect(() => {
        if (!bootstrapping && user && !isAdvisor(user)) {
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

    if (!isAdvisor(user)) {
        return (
            <View style={styles.center}>
                <Text style={styles.title}>Advisor access required</Text>
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
    },
    title: { fontSize: 18, fontWeight: '700', color: colors.text },
});
