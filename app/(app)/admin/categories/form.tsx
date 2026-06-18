import { AppHeader } from '@/components/ui/AppHeader';
import { Button } from '@/components/ui/Button';
import { BrandLoadingScreen } from '@/components/ui/BrandLoadingScreen';
import { FormSelect } from '@/components/ui/FormSelect';
import { FormSwitch } from '@/components/ui/FormSwitch';
import { TextField } from '@/components/ui/TextField';
import { colors, spacing } from '@/constants/theme';
import { apiGet, apiPost, apiPut } from '@/src/lib/api-client';
import { apiRoutes } from '@/src/lib/api-routes';
import { applyValidationErrors, firstFieldError } from '@/src/lib/form-errors';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, View } from 'react-native';

type CategoryForm = {
    id?: string;
    name: string;
    slug: string;
    description: string;
    icon: string;
    sort_order: number;
    is_active: boolean;
};

type FieldErrors = Partial<Record<'name' | 'slug' | 'description' | 'icon' | 'sort_order', string>>;

const DEFAULT_ICONS = [
    { value: 'salad', label: 'Salad' },
    { value: 'trending-down', label: 'Trending down' },
    { value: 'trending-up', label: 'Trending up' },
    { value: 'heart-pulse', label: 'Heart pulse' },
    { value: 'flower-2', label: 'Flower' },
    { value: 'flame', label: 'Flame' },
    { value: 'leaf', label: 'Leaf' },
    { value: 'dumbbell', label: 'Dumbbell' },
];

export default function AdminCategoryFormScreen() {
    const router = useRouter();
    const { id } = useLocalSearchParams<{ id?: string }>();
    const isEdit = Boolean(id);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [iconOptions, setIconOptions] = useState(DEFAULT_ICONS);
    const [form, setForm] = useState<CategoryForm>({
        name: '',
        slug: '',
        description: '',
        icon: 'salad',
        sort_order: 0,
        is_active: true,
    });
    const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
    const [formError, setFormError] = useState<string | null>(null);

    const load = useCallback(async () => {
        setLoading(true);
        const path = isEdit ? apiRoutes.admin.categories.edit(id!) : apiRoutes.admin.categories.create;
        const result = await apiGet<{
            category?: CategoryForm;
            iconOptions?: Array<{ value: string; label: string }>;
        }>(path);

        if (result.ok && result.data) {
            if (result.data.iconOptions?.length) {
                setIconOptions(result.data.iconOptions);
            }
            if (result.data.category) {
                setForm({
                    ...result.data.category,
                    sort_order: Number(result.data.category.sort_order ?? 0),
                });
            } else {
                setForm((current) => ({
                    ...current,
                    icon: result.data?.iconOptions?.[0]?.value ?? 'salad',
                }));
            }
        } else {
            setFormError(result.ok ? 'Could not load category.' : result.message);
        }

        setLoading(false);
    }, [id, isEdit]);

    useEffect(() => {
        load();
    }, [load]);

    const iconSelectOptions = useMemo(
        () => iconOptions.map((option) => ({ value: option.value, label: option.label })),
        [iconOptions],
    );

    function updateField<K extends keyof CategoryForm>(key: K, value: CategoryForm[K]) {
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
        if (!form.name.trim()) {
            const errors: FieldErrors = { name: 'Name is required.' };
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
            description: form.description.trim() || null,
            icon: form.icon,
            sort_order: form.sort_order,
            is_active: form.is_active,
        };

        const result = isEdit
            ? await apiPut(apiRoutes.admin.categories.update(id!), payload)
            : await apiPost(apiRoutes.admin.categories.store, payload);

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
            <AppHeader subtitle="Plan category" title={isEdit ? 'Edit category' : 'New category'} />
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
                    error={fieldErrors.description}
                    label="Description"
                    multiline
                    onChangeText={(value) => updateField('description', value)}
                    value={form.description}
                />
                <FormSelect
                    error={fieldErrors.icon}
                    label="Icon"
                    onChange={(value) => updateField('icon', value)}
                    options={iconSelectOptions}
                    value={form.icon}
                />
                <TextField
                    error={fieldErrors.sort_order}
                    keyboardType="number-pad"
                    label="Sort order"
                    onChangeText={(value) => updateField('sort_order', Number(value) || 0)}
                    value={String(form.sort_order)}
                />
                <FormSwitch
                    label="Visible in catalog"
                    onValueChange={(value) => updateField('is_active', value)}
                    value={form.is_active}
                />
                {formError ? <Text style={styles.error}>{formError}</Text> : null}
                <Button label={isEdit ? 'Update' : 'Create'} loading={saving} onPress={() => void save()} />
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    root: { flex: 1, backgroundColor: colors.background },
    content: { padding: spacing.lg, gap: spacing.md, paddingBottom: spacing.xl },
    error: { color: colors.error, fontSize: 14 },
});
