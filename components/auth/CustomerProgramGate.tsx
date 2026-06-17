import { Button } from '@/components/ui/Button';
import { colors, spacing } from '@/constants/theme';
import { useAuth } from '@/src/context/auth-context';
import { PLANS_LIST_HREF } from '@/src/lib/navigation';
import { customerNeedsActivePlan } from '@/src/lib/user-access';
import { isCustomer } from '@/src/lib/user-access';
import { useRouter } from 'expo-router';
import type { ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';

type Props = {
    children: ReactNode;
    /** When true, customers must have an active plan (mirrors web customer.plan middleware). */
    requireActivePlan?: boolean;
};

export function CustomerProgramGate({ children, requireActivePlan = true }: Props) {
    const router = useRouter();
    const { user } = useAuth();

    if (!isCustomer(user)) {
        return (
            <View style={styles.blocked}>
                <Text style={styles.blockedTitle}>Not available</Text>
                <Text style={styles.blockedHint}>
                    This feature is for customers only. Staff tools are on the Diet Elite web portal.
                </Text>
            </View>
        );
    }

    if (requireActivePlan && customerNeedsActivePlan(user)) {
        return (
            <View style={styles.blocked}>
                <Text style={styles.blockedTitle}>Active plan required</Text>
                <Text style={styles.blockedHint}>Choose an active diet plan to unlock this feature.</Text>
                <Button label="Browse plans" onPress={() => router.push(PLANS_LIST_HREF)} />
            </View>
        );
    }

    return <>{children}</>;
}

const styles = StyleSheet.create({
    blocked: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        padding: spacing.lg,
        gap: spacing.md,
        backgroundColor: colors.background,
    },
    blockedTitle: { fontSize: 20, fontWeight: '700', color: colors.text, textAlign: 'center' },
    blockedHint: { fontSize: 14, color: colors.textMuted, textAlign: 'center', lineHeight: 20 },
});
