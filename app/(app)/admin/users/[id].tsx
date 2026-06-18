import { AppHeader } from '@/components/ui/AppHeader';
import { Button } from '@/components/ui/Button';
import { FormSwitch } from '@/components/ui/FormSwitch';
import { TextField } from '@/components/ui/TextField';
import { colors, spacing } from '@/constants/theme';
import { apiGet, apiPost, apiPut } from '@/src/lib/api-client';
import { apiRoutes } from '@/src/lib/api-routes';
import { appHref } from '@/src/lib/navigation';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, StyleSheet, Text, View } from 'react-native';

type UserRecord = {
    id?: string;
    name?: string;
    email?: string;
    username?: string;
    phone?: string | null;
    role?: string;
    role_label?: string;
    is_active?: boolean;
};

export default function AdminUserShowScreen() {
    const router = useRouter();
    const { id } = useLocalSearchParams<{ id: string }>();
    const [loading, setLoading] = useState(true);
    const [profile, setProfile] = useState<Record<string, unknown> | null>(null);
    const [downgradePlanId, setDowngradePlanId] = useState('');
    const [downgradeReason, setDowngradeReason] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [togglingStatus, setTogglingStatus] = useState(false);

    const load = useCallback(async () => {
        if (!id) {
            return;
        }
        setLoading(true);
        const result = await apiGet<Record<string, unknown>>(apiRoutes.admin.users.show(id));
        if (result.ok && result.data) {
            setProfile(result.data);
        }
        setLoading(false);
    }, [id]);

    useEffect(() => {
        load();
    }, [load]);

    async function toggleActive(nextActive: boolean) {
        if (!id) {
            return;
        }
        const user = ((profile?.user as UserRecord | undefined) ?? profile) as UserRecord;
        if (!user?.name || !user?.email || !user?.role) {
            Alert.alert('Unable to update', 'User details are incomplete. Open edit form instead.');
            return;
        }

        setTogglingStatus(true);
        const payload: Record<string, unknown> = {
            name: String(user.name),
            email: String(user.email),
            role: String(user.role),
            phone: user.phone ?? null,
            is_active: nextActive,
        };
        if (user.role === 'customer' && user.username) {
            payload.username = user.username;
        }

        const result = await apiPut(apiRoutes.admin.users.update(id), payload);
        setTogglingStatus(false);
        if (result.ok) {
            load();
        } else {
            Alert.alert('Error', result.message);
        }
    }

    async function downgrade() {
        if (!id || !downgradePlanId.trim()) {
            Alert.alert('Plan required', 'Enter a diet plan ID to downgrade to.');
            return;
        }
        setSubmitting(true);
        const result = await apiPost(apiRoutes.admin.users.downgradePlan(id), {
            diet_plan_id: downgradePlanId.trim(),
            reason: downgradeReason.trim() || null,
        });
        setSubmitting(false);
        if (result.ok) {
            Alert.alert('Downgraded', result.message, [{ text: 'OK', onPress: load }]);
        } else {
            Alert.alert('Error', result.message);
        }
    }

    if (loading) {
        return <ActivityIndicator color={colors.brandDark} style={{ marginTop: 40 }} />;
    }

    const user = ((profile?.user as UserRecord | undefined) ?? profile) as UserRecord;
    const enrollment = profile?.activeEnrollment as Record<string, unknown> | undefined;
    const isActive = user?.is_active !== false;

    return (
        <View style={styles.root}>
            <Stack.Screen options={{ headerShown: false }} />
            <AppHeader subtitle={String(user?.email ?? '')} title={String(user?.name ?? 'User')} />
            <ScrollView contentContainerStyle={styles.content}>
                <Text style={styles.label}>Role</Text>
                <Text style={styles.value}>{String(user?.role_label ?? user?.role ?? '—')}</Text>
                <FormSwitch
                    disabled={togglingStatus}
                    hint="Inactive users cannot sign in to the app"
                    label="Account active"
                    onValueChange={toggleActive}
                    value={isActive}
                />
                {enrollment ? (
                    <>
                        <Text style={styles.label}>Active plan</Text>
                        <Text style={styles.value}>
                            {String((enrollment.diet_plan as Record<string, unknown> | undefined)?.name ?? '—')}
                        </Text>
                    </>
                ) : null}
                <Button label="Edit user" onPress={() => router.push(appHref(`/(app)/admin/users/form?id=${id}`))} />
                {user?.role === 'customer' && enrollment ? (
                    <View style={styles.panel}>
                        <Text style={styles.panelTitle}>Downgrade plan</Text>
                        <TextField label="Target diet plan ID" onChangeText={setDowngradePlanId} value={downgradePlanId} />
                        <TextField label="Reason (optional)" onChangeText={setDowngradeReason} value={downgradeReason} />
                        <Button label="Apply downgrade" loading={submitting} onPress={downgrade} variant="secondary" />
                    </View>
                ) : null}
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    root: { flex: 1, backgroundColor: colors.background },
    content: { padding: spacing.lg, gap: spacing.sm },
    label: { fontSize: 12, fontWeight: '700', color: colors.textMuted, marginTop: spacing.sm },
    value: { fontSize: 16, color: colors.text },
    panel: { marginTop: spacing.lg, gap: spacing.sm, padding: spacing.md, backgroundColor: colors.card, borderRadius: 12, borderWidth: 1, borderColor: colors.border },
    panelTitle: { fontSize: 16, fontWeight: '700', color: colors.text, marginBottom: spacing.xs },
});
