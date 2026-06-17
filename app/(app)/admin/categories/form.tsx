import { AppHeader } from '@/components/ui/AppHeader';
import { Button } from '@/components/ui/Button';
import { TextField } from '@/components/ui/TextField';
import { colors, spacing } from '@/constants/theme';
import { apiGet, apiPost, apiPut } from '@/src/lib/api-client';
import { apiRoutes } from '@/src/lib/api-routes';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, StyleSheet, Text, View } from 'react-native';

type CategoryForm = {
    id?: string;
    name: string;
    slug: string;
    description: string;
    icon: string;
    sort_order: number;
    is_active: boolean;
};

export default function AdminCategoryFormScreen() {
    const router = useRouter();
    const { id } = useLocalSearchParams<{ id?: string }>();
    const isEdit = Boolean(id);
    const [loading, setLoading] = useState(isEdit);
    const [saving, setSaving] = useState(false);
    const [form, setForm] = useState<CategoryForm>({
        name: '',
        slug: '',
        description: '',
        icon: 'salad',
        sort_order: 0,
        is_active: true,
    });
    const [error, setError] = useState<string | null>(null);

    const load = useCallback(async () => {
        if (!id) {
            return;
        }
        setLoading(true);
        const result = await apiGet<{ category?: CategoryForm }>(apiRoutes.admin.categories.edit(id));
        if (result.ok && result.data?.category) {
            setForm({ ...result.data.category, sort_order: Number(result.data.category.sort_order ?? 0) });
        } else {
            setError(result.ok ? 'Could not load category.' : result.message);
        }
        setLoading(false);
    }, [id]);

    useEffect(() => {
        load();
    }, [load]);

    async function save() {
        setSaving(true);
        setError(null);
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
            <AppHeader subtitle="Plan category" title={isEdit ? 'Edit category' : 'New category'} />
            <ScrollView contentContainerStyle={styles.content}>
                <TextField label="Name" onChangeText={(v) => setForm((f) => ({ ...f, name: v }))} value={form.name} />
                <TextField label="Slug (optional)" onChangeText={(v) => setForm((f) => ({ ...f, slug: v }))} value={form.slug} />
                <TextField label="Description" multiline onChangeText={(v) => setForm((f) => ({ ...f, description: v }))} value={form.description} />
                <TextField label="Icon key" onChangeText={(v) => setForm((f) => ({ ...f, icon: v }))} value={form.icon} />
                <TextField
                    keyboardType="number-pad"
                    label="Sort order"
                    onChangeText={(v) => setForm((f) => ({ ...f, sort_order: Number(v) || 0 }))}
                    value={String(form.sort_order)}
                />
                {error ? <Text style={styles.error}>{error}</Text> : null}
                <Button label={isEdit ? 'Update' : 'Create'} loading={saving} onPress={save} />
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    root: { flex: 1, backgroundColor: colors.background },
    content: { padding: spacing.lg, gap: spacing.md },
    error: { color: colors.error },
});
