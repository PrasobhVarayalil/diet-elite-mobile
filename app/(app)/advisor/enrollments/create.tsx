import { AppHeader } from '@/components/ui/AppHeader';
import { Button } from '@/components/ui/Button';
import { TextField } from '@/components/ui/TextField';
import { colors, spacing } from '@/constants/theme';
import { apiGet, apiPost } from '@/src/lib/api-client';
import { apiRoutes } from '@/src/lib/api-routes';
import { Stack, useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    View,
} from 'react-native';

type CustomerResult = { id: string; name: string; email?: string; member_code?: string };
type PlanOption = { id: string; name: string; slug: string };

export default function AdvisorEnrollmentCreateScreen() {
    const router = useRouter();
    const [query, setQuery] = useState('');
    const [searching, setSearching] = useState(false);
    const [customers, setCustomers] = useState<CustomerResult[]>([]);
    const [selectedCustomer, setSelectedCustomer] = useState<CustomerResult | null>(null);
    const [plans, setPlans] = useState<PlanOption[]>([]);
    const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null);
    const [notes, setNotes] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const loadPlans = useCallback(async () => {
        const result = await apiGet<{ plans?: PlanOption[] }>(apiRoutes.advisor.enrollments);
        if (result.ok) {
            setPlans(result.data?.plans ?? []);
        }
    }, []);

    useEffect(() => {
        loadPlans();
    }, [loadPlans]);

    const searchCustomers = useCallback(async (term: string) => {
        if (term.trim().length < 2) {
            setCustomers([]);
            return;
        }
        setSearching(true);
        const path = `${apiRoutes.advisor.customersSearch}?q=${encodeURIComponent(term.trim())}`;
        const result = await apiGet<{ customers?: CustomerResult[] }>(path);
        if (result.ok) {
            setCustomers(result.data?.customers ?? []);
        }
        setSearching(false);
    }, []);

    useEffect(() => {
        const timer = setTimeout(() => searchCustomers(query), 300);
        return () => clearTimeout(timer);
    }, [query, searchCustomers]);

    async function onSubmit() {
        if (!selectedCustomer || !selectedPlanId) {
            setError('Select a customer and plan.');
            return;
        }
        setSubmitting(true);
        setError(null);
        const result = await apiPost(apiRoutes.advisor.enrollmentsStore, {
            user_id: selectedCustomer.id,
            diet_plan_id: selectedPlanId,
            notes: notes.trim() || null,
        });
        setSubmitting(false);
        if (!result.ok) {
            setError(result.message);
            return;
        }
        Alert.alert('Enrollment created', result.message, [
            { text: 'OK', onPress: () => router.back() },
        ]);
    }

    return (
        <View style={styles.root}>
            <Stack.Screen options={{ headerShown: false }} />
            <AppHeader subtitle="Assign a diet plan" title="New enrollment" />
            <ScrollView contentContainerStyle={styles.content}>
                <TextField
                    autoCapitalize="none"
                    label="Search customer"
                    onChangeText={setQuery}
                    placeholder="Name, email, or member code"
                    value={query}
                />
                {searching ? <ActivityIndicator color={colors.brandDark} /> : null}
                {customers.length > 0 && !selectedCustomer ? (
                    <View>
                        {customers.map((item) => (
                            <Pressable key={item.id} onPress={() => setSelectedCustomer(item)} style={styles.pick}>
                                <Text ellipsizeMode="tail" numberOfLines={1} style={styles.pickTitle}>
                                    {item.name}
                                </Text>
                                <Text ellipsizeMode="tail" numberOfLines={1} style={styles.pickMeta}>
                                    {item.email ?? item.member_code}
                                </Text>
                            </Pressable>
                        ))}
                    </View>
                ) : null}
                {selectedCustomer ? (
                    <View style={styles.selected}>
                        <Text style={styles.selectedLabel}>Customer</Text>
                        <Text style={styles.selectedValue}>{selectedCustomer.name}</Text>
                        <Pressable onPress={() => setSelectedCustomer(null)}>
                            <Text style={styles.change}>Change</Text>
                        </Pressable>
                    </View>
                ) : null}

                <Text style={styles.section}>Diet plan</Text>
                {plans.map((plan) => (
                    <Pressable
                        key={plan.id}
                        onPress={() => setSelectedPlanId(plan.id)}
                        style={[styles.plan, selectedPlanId === plan.id && styles.planActive]}
                    >
                        <Text style={styles.planText}>{plan.name}</Text>
                    </Pressable>
                ))}

                <TextField label="Notes (optional)" multiline onChangeText={setNotes} value={notes} />

                {error ? <Text style={styles.error}>{error}</Text> : null}
                <Button label="Create enrollment" loading={submitting} onPress={onSubmit} />
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    root: { flex: 1, backgroundColor: colors.background },
    content: { padding: spacing.lg, gap: spacing.md, paddingBottom: spacing.xl },
    pick: {
        padding: spacing.md,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: colors.border,
        backgroundColor: colors.card,
        marginBottom: spacing.sm,
    },
    pickTitle: { fontSize: 15, fontWeight: '600', color: colors.text },
    pickMeta: { fontSize: 13, color: colors.textMuted },
    selected: { padding: spacing.md, backgroundColor: colors.card, borderRadius: 12, borderWidth: 1, borderColor: colors.border },
    selectedLabel: { fontSize: 12, color: colors.textMuted },
    selectedValue: { fontSize: 16, fontWeight: '700', color: colors.text },
    change: { color: colors.brandDark, marginTop: spacing.sm, fontWeight: '600' },
    section: { fontSize: 14, fontWeight: '700', color: colors.text },
    plan: {
        padding: spacing.md,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: colors.border,
        backgroundColor: colors.card,
    },
    planActive: { borderColor: colors.brandDark, backgroundColor: '#f0f7e8' },
    planText: { fontSize: 15, fontWeight: '600', color: colors.text },
    error: { color: colors.error },
});
