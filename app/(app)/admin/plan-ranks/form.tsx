import { AppHeader } from '@/components/ui/AppHeader';
import { Button } from '@/components/ui/Button';
import { BrandLoadingScreen } from '@/components/ui/BrandLoadingScreen';
import { FormSwitch } from '@/components/ui/FormSwitch';
import { TextField } from '@/components/ui/TextField';
import { colors, spacing } from '@/constants/theme';
import { apiGet, apiPost, apiPut } from '@/src/lib/api-client';
import { apiRoutes } from '@/src/lib/api-routes';
import { applyValidationErrors, firstFieldError } from '@/src/lib/form-errors';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, View } from 'react-native';

type RankForm = {
    id?: string;
    name: string;
    slug: string;
    sort_order: number;
    is_active: boolean;
    features?: Record<string, unknown>;
};

type FieldErrors = Partial<Record<'name' | 'slug' | 'sort_order', string>>;

export default function AdminPlanRankFormScreen() {
    const router = useRouter();
    const { id } = useLocalSearchParams<{ id?: string }>();
    const isEdit = Boolean(id);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [form, setForm] = useState<RankForm>({
        name: '',
        slug: '',
        sort_order: 1,
        is_active: true,
        features: {},
    });
    const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
    const [formError, setFormError] = useState<string | null>(null);

    const load = useCallback(async () => {
        if (!isEdit) {
            setLoading(false);
            return;
        }

        setLoading(true);
        const result = await apiGet<{ rank?: RankForm }>(apiRoutes.admin.planRanks.edit(id!));
        if (result.ok && result.data?.rank) {
            setForm({
                ...result.data.rank,
                sort_order: Number(result.data.rank.sort_order ?? 1),
                features: result.data.rank.features ?? {},
            });
        } else {
            setFormError(result.ok ? 'Could not load rank.' : result.message);
        }
        setLoading(false);
    }, [id, isEdit]);

    useEffect(() => {
        load();
    }, [load]);

    function updateField<K extends keyof RankForm>(key: K, value: RankForm[K]) {
        setForm((current) => ({ ...current, [key]: value }));
        setFieldErrors((current) => {
            if (!current[key as keyof FieldErrors]) {
                return current;
            }
            const next = { ...current };
            delete next[key as keyof FieldErrors];
            return next;
        });
    }

    async function save() {
        const errors: FieldErrors = {};
        if (!form.name.trim()) {
            errors.name = 'Name is required.';
        }
        if (!form.sort_order || form.sort_order < 1) {
            errors.sort_order = 'Sort order (tier) must be at least 1.';
        }

        if (Object.keys(errors).length > 0) {
            setFieldErrors(errors);
            setFormError(firstFieldError(errors));
            return;
        }

        setSaving(true);
        setFormError(null);
        setFieldErrors({});

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
            return;
        }

        if (result.status === 422 && applyValidationErrors(result.errors, (field, message) => {
            setFieldErrors((current) => ({ ...current, [field]: message }));
        })) {
            setFormError(result.message);
            return;
        }

        setFormError(result.message);
    }

    if (loading) {
        return <BrandLoadingScreen message="Loading…" />;
    }

    return (
        <View style={styles.root}>
            <Stack.Screen options={{ headerShown: false }} />
            <AppHeader subtitle="Tier features" title={isEdit ? 'Edit rank' : 'New rank'} />
            <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
                <TextField
                    error={fieldErrors.name}
                    label="Name"
                    onChangeText={(value) => updateField('name', value)}
                    required
                    value={form.name}
                />
                <TextField
                    error={fieldErrors.slug}
                    autoCapitalize="none"
                    label="Slug (optional)"
                    onChangeText={(value) => updateField('slug', value)}
                    value={form.slug}
                />
                <TextField
                    error={fieldErrors.sort_order}
                    keyboardType="number-pad"
                    label="Sort order (tier)"
                    onChangeText={(value) => updateField('sort_order', Number(value) || 0)}
                    required
                    value={String(form.sort_order)}
                />
                <FormSwitch
                    hint="Hidden ranks cannot be assigned to new plans"
                    label="Available for new plans"
                    onValueChange={(value) => updateField('is_active', value)}
                    value={form.is_active}
                />
                <Text style={styles.hint}>Feature matrix edits are preserved from the server on update.</Text>
                {formError ? <Text style={styles.error}>{formError}</Text> : null}
                <Button label={isEdit ? 'Update' : 'Create'} loading={saving} onPress={() => void save()} />
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    root: { flex: 1, backgroundColor: colors.background },
    content: { padding: spacing.lg, gap: spacing.md, paddingBottom: spacing.xl },
    hint: { fontSize: 13, color: colors.textMuted, lineHeight: 20 },
    error: { color: colors.error, fontSize: 14 },
});
