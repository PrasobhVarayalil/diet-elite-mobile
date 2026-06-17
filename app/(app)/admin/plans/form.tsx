import { AppHeader } from '@/components/ui/AppHeader';
import { Button } from '@/components/ui/Button';
import { TextField } from '@/components/ui/TextField';
import { colors, spacing } from '@/constants/theme';
import { apiGet, apiPost, apiPut } from '@/src/lib/api-client';
import { apiRoutes } from '@/src/lib/api-routes';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, StyleSheet, Text, View } from 'react-native';

type PickerOption = { id: string; name: string };

export default function AdminPlanFormScreen() {
    const router = useRouter();
    const { id } = useLocalSearchParams<{ id?: string }>();
    const isEdit = Boolean(id);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [categories, setCategories] = useState<PickerOption[]>([]);
    const [ranks, setRanks] = useState<PickerOption[]>([]);
    const [name, setName] = useState('');
    const [tagline, setTagline] = useState('');
    const [description, setDescription] = useState('');
    const [categoryId, setCategoryId] = useState('');
    const [rankId, setRankId] = useState('');
    const [durationWeeks, setDurationWeeks] = useState('12');
    const [priceInr, setPriceInr] = useState('');
    const [error, setError] = useState<string | null>(null);

    const load = useCallback(async () => {
        setLoading(true);
        const path = isEdit ? apiRoutes.admin.plans.edit(id!) : apiRoutes.admin.plans.create;
        const result = await apiGet<{
            plan?: Record<string, unknown>;
            categories?: PickerOption[];
            planRanks?: PickerOption[];
        }>(path);
        if (result.ok && result.data) {
            setCategories(result.data.categories ?? []);
            setRanks(result.data.planRanks ?? []);
            const p = result.data.plan;
            if (p) {
                setName(String(p.name ?? ''));
                setTagline(String(p.tagline ?? ''));
                setDescription(String(p.description ?? ''));
                setCategoryId(String(p.plan_category_id ?? ''));
                setRankId(String(p.plan_rank_id ?? ''));
                setDurationWeeks(String(p.duration_weeks ?? 12));
                setPriceInr(String(p.price_inr ?? (Number(p.price_paise ?? 0) / 100)));
            } else if (result.data.categories?.[0]) {
                setCategoryId(result.data.categories[0].id);
            }
            if (!rankId && result.data.planRanks?.[0]) {
                setRankId(result.data.planRanks[0].id);
            }
        }
        setLoading(false);
    }, [id, isEdit]);

    useEffect(() => {
        load();
    }, [load]);

    async function save() {
        setSaving(true);
        setError(null);
        const payload = {
            name: name.trim(),
            tagline: tagline.trim() || null,
            description: description.trim(),
            plan_category_id: categoryId,
            plan_rank_id: rankId,
            duration_weeks: Number(durationWeeks) || 12,
            price_inr: Number(priceInr) || 0,
            is_active: true,
            is_featured: false,
        };
        const result = isEdit
            ? await apiPut(apiRoutes.admin.plans.update(id!), payload)
            : await apiPost(apiRoutes.admin.plans.store, payload);
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
            <AppHeader subtitle="Diet program" title={isEdit ? 'Edit plan' : 'New plan'} />
            <ScrollView contentContainerStyle={styles.content}>
                <TextField label="Name" onChangeText={setName} value={name} />
                <TextField label="Tagline" onChangeText={setTagline} value={tagline} />
                <TextField label="Description" multiline onChangeText={setDescription} value={description} />
                <TextField label="Category ID" onChangeText={setCategoryId} value={categoryId} />
                <Text style={styles.hint}>Categories: {categories.map((c) => c.name).join(', ') || '—'}</Text>
                <TextField label="Plan rank ID" onChangeText={setRankId} value={rankId} />
                <Text style={styles.hint}>Ranks: {ranks.map((r) => r.name).join(', ') || '—'}</Text>
                <TextField keyboardType="number-pad" label="Duration (weeks)" onChangeText={setDurationWeeks} value={durationWeeks} />
                <TextField keyboardType="decimal-pad" label="Price (INR)" onChangeText={setPriceInr} value={priceInr} />
                {error ? <Text style={styles.error}>{error}</Text> : null}
                <Button label={isEdit ? 'Update plan' : 'Create plan'} loading={saving} onPress={save} />
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    root: { flex: 1, backgroundColor: colors.background },
    content: { padding: spacing.lg, gap: spacing.md },
    hint: { fontSize: 12, color: colors.textMuted },
    error: { color: colors.error },
});
