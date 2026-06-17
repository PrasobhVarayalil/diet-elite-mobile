import { AppHeader } from '@/components/ui/AppHeader';
import { Button } from '@/components/ui/Button';
import { TextField } from '@/components/ui/TextField';
import { colors, spacing } from '@/constants/theme';
import { apiGet, apiPost, apiPut } from '@/src/lib/api-client';
import { apiRoutes } from '@/src/lib/api-routes';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, StyleSheet, Text, View } from 'react-native';

type RankForm = {
    id?: string;
    name: string;
    slug: string;
    sort_order: number;
    is_active: boolean;
    features?: Record<string, unknown>;
};

export default function AdminPlanRankFormScreen() {
    const router = useRouter();
    const { id } = useLocalSearchParams<{ id?: string }>();
    const isEdit = Boolean(id);
    const [loading, setLoading] = useState(isEdit);
    const [saving, setSaving] = useState(false);
    const [form, setForm] = useState<RankForm>({ name: '', slug: '', sort_order: 0, is_active: true, features: {} });
    const [error, setError] = useState<string | null>(null);

    const load = useCallback(async () => {
        if (!id) {
            return;
        }
        setLoading(true);
        const result = await apiGet<{ rank?: RankForm }>(apiRoutes.admin.planRanks.edit(id));
        if (result.ok && result.data?.rank) {
            setForm({
                ...result.data.rank,
                sort_order: Number(result.data.rank.sort_order ?? 0),
                features: result.data.rank.features ?? {},
            });
        }
        setLoading(false);
    }, [id]);

    useEffect(() => {
        load();
    }, [load]);

    async function save() {
        setSaving(true);
        const payload = {
            name: form.name.trim(),
            slug: form.slug.trim() || null,
            sort_order: form.sort_order,
            is_active: form.is_active,
            features: form.features ?? {},
        };
        const result = isEdit
            ? await apiPut(apiRoutes.admin.planRanks.update(id!), payload)
            : await apiPost(apiRoutes.admin.planRanks.store, payload);
        setSaving(false);
        if (result.ok) {
            Alert.alert('Saved', result.message, [{ text: 'OK', onPress: () => router.back() }]);
        } else {
            setError(result.message);
        }
    }

    if (loading) {
        return <ActivityIndicator color={colors.brandDark} style={{ marginTop: 40 }} />;
    }

    return (
        <View style={styles.root}>
            <Stack.Screen options={{ headerShown: false }} />
            <AppHeader subtitle="Tier features" title={isEdit ? 'Edit rank' : 'New rank'} />
            <ScrollView contentContainerStyle={styles.content}>
                <TextField label="Name" onChangeText={(v) => setForm((f) => ({ ...f, name: v }))} value={form.name} />
                <TextField label="Slug" onChangeText={(v) => setForm((f) => ({ ...f, slug: v }))} value={form.slug} />
                <TextField
                    keyboardType="number-pad"
                    label="Sort order"
                    onChangeText={(v) => setForm((f) => ({ ...f, sort_order: Number(v) || 0 }))}
                    value={String(form.sort_order)}
                />
                <Text style={styles.hint}>Feature matrix edits are preserved from the server on update.</Text>
                {error ? <Text style={styles.error}>{error}</Text> : null}
                <Button label={isEdit ? 'Update' : 'Create'} loading={saving} onPress={save} />
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    root: { flex: 1, backgroundColor: colors.background },
    content: { padding: spacing.lg, gap: spacing.md },
    hint: { fontSize: 13, color: colors.textMuted },
    error: { color: colors.error },
});
