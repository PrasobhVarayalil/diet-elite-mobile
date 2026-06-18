import { AppHeader } from '@/components/ui/AppHeader';
import { Button } from '@/components/ui/Button';
import { FormSelect } from '@/components/ui/FormSelect';
import { FormSwitch } from '@/components/ui/FormSwitch';
import { TextField } from '@/components/ui/TextField';
import { colors, spacing } from '@/constants/theme';
import { apiGet, apiPost, apiPut } from '@/src/lib/api-client';
import { apiRoutes } from '@/src/lib/api-routes';
import { applyValidationErrors, firstFieldError } from '@/src/lib/form-errors';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, StyleSheet, Text, View } from 'react-native';

type CategoryOption = { id: string; name: string };
type RankOption = { id: string; name: string; sort_order?: number; is_active?: boolean };

type FieldErrors = Partial<
    Record<
        | 'name'
        | 'description'
        | 'plan_category_id'
        | 'plan_rank_id'
        | 'duration_weeks'
        | 'price_inr'
        | 'offer_price_inr',
        string
    >
>;

function validatePlanForm(input: {
    name: string;
    description: string;
    categoryId: string;
    rankId: string;
    durationWeeks: string;
    priceInr: string;
    offerPriceInr: string;
}): FieldErrors {
    const errors: FieldErrors = {};

    if (!input.name.trim()) {
        errors.name = 'Plan name is required.';
    }
    if (!input.description.trim()) {
        errors.description = 'Description is required.';
    }
    if (!input.categoryId) {
        errors.plan_category_id = 'Category is required.';
    }
    if (!input.rankId) {
        errors.plan_rank_id = 'Plan rank is required.';
    }
    const weeks = Number(input.durationWeeks);
    if (!input.durationWeeks.trim() || Number.isNaN(weeks) || weeks < 1) {
        errors.duration_weeks = 'Duration must be at least 1 week.';
    }
    if (input.priceInr.trim() === '' || Number.isNaN(Number(input.priceInr)) || Number(input.priceInr) < 0) {
        errors.price_inr = 'Price is required.';
    }
    if (input.offerPriceInr.trim() !== '') {
        const offer = Number(input.offerPriceInr);
        if (Number.isNaN(offer) || offer < 0) {
            errors.offer_price_inr = 'Offer price must be zero or greater.';
        }
    }

    return errors;
}

export default function AdminPlanFormScreen() {
    const router = useRouter();
    const { id } = useLocalSearchParams<{ id?: string }>();
    const isEdit = Boolean(id);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [categories, setCategories] = useState<CategoryOption[]>([]);
    const [ranks, setRanks] = useState<RankOption[]>([]);
    const [name, setName] = useState('');
    const [tagline, setTagline] = useState('');
    const [description, setDescription] = useState('');
    const [categoryId, setCategoryId] = useState('');
    const [rankId, setRankId] = useState('');
    const [durationWeeks, setDurationWeeks] = useState('12');
    const [priceInr, setPriceInr] = useState('');
    const [offerPriceInr, setOfferPriceInr] = useState('');
    const [isActive, setIsActive] = useState(true);
    const [isFeatured, setIsFeatured] = useState(false);
    const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
    const [formError, setFormError] = useState<string | null>(null);

    const categoryOptions = useMemo(
        () => categories.map((category) => ({ value: category.id, label: category.name })),
        [categories],
    );

    const rankOptions = useMemo(
        () =>
            ranks.map((rank) => ({
                value: rank.id,
                label: rank.name,
                meta: `Tier ${rank.sort_order ?? '—'}${rank.is_active === false ? ' · hidden' : ''}`,
            })),
        [ranks],
    );

    const load = useCallback(async () => {
        setLoading(true);
        const path = isEdit ? apiRoutes.admin.plans.edit(id!) : apiRoutes.admin.plans.create;
        const result = await apiGet<{
            plan?: Record<string, unknown>;
            categories?: CategoryOption[];
            planRanks?: RankOption[];
        }>(path);

        if (result.ok && result.data) {
            const loadedCategories = result.data.categories ?? [];
            const loadedRanks = result.data.planRanks ?? [];
            setCategories(loadedCategories);
            setRanks(loadedRanks);

            const plan = result.data.plan;
            if (plan) {
                setName(String(plan.name ?? ''));
                setTagline(String(plan.tagline ?? ''));
                setDescription(String(plan.description ?? ''));
                setCategoryId(String(plan.plan_category_id ?? ''));
                setRankId(String(plan.plan_rank_id ?? ''));
                setDurationWeeks(String(plan.duration_weeks ?? 12));
                setPriceInr(String(plan.price_inr ?? (Number(plan.price_paise ?? 0) / 100)));
                setOfferPriceInr(
                    plan.offer_price_inr != null && plan.offer_price_inr !== ''
                        ? String(plan.offer_price_inr)
                        : '',
                );
                setIsActive(plan.is_active !== false);
                setIsFeatured(plan.is_featured === true);
            } else {
                setCategoryId(loadedCategories[0]?.id ?? '');
                setRankId(loadedRanks[0]?.id ?? '');
            }
        } else {
            setFormError(result.ok ? 'Could not load plan form.' : result.message);
        }

        setLoading(false);
    }, [id, isEdit]);

    useEffect(() => {
        load();
    }, [load]);

    function clearFieldError(field: keyof FieldErrors) {
        setFieldErrors((current) => {
            if (!current[field]) {
                return current;
            }
            const next = { ...current };
            delete next[field];
            return next;
        });
    }

    async function save() {
        const clientErrors = validatePlanForm({
            name,
            description,
            categoryId,
            rankId,
            durationWeeks,
            priceInr,
            offerPriceInr,
        });

        if (Object.keys(clientErrors).length > 0) {
            setFieldErrors(clientErrors);
            setFormError(firstFieldError(clientErrors));
            return;
        }

        setSaving(true);
        setFormError(null);
        setFieldErrors({});

        const payload: Record<string, unknown> = {
            name: name.trim(),
            tagline: tagline.trim() || null,
            description: description.trim(),
            plan_category_id: categoryId,
            plan_rank_id: rankId,
            duration_weeks: Number(durationWeeks),
            price_inr: Number(priceInr),
            offer_price_inr: offerPriceInr.trim() === '' ? null : Number(offerPriceInr),
            is_active: isActive,
            is_featured: isFeatured,
            sort_order: 0,
        };

        const result = isEdit
            ? await apiPut(apiRoutes.admin.plans.update(id!), payload)
            : await apiPost(apiRoutes.admin.plans.store, payload);

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
        return <ActivityIndicator color={colors.brandDark} style={{ marginTop: 40 }} />;
    }

    return (
        <View style={styles.root}>
            <Stack.Screen options={{ headerShown: false }} />
            <AppHeader subtitle="Diet program" title={isEdit ? 'Edit plan' : 'New plan'} />
            <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
                <TextField
                    error={fieldErrors.name}
                    label="Plan name"
                    onChangeText={(value) => {
                        setName(value);
                        clearFieldError('name');
                    }}
                    required
                    value={name}
                />
                <FormSelect
                    error={fieldErrors.plan_category_id}
                    label="Category"
                    onChange={(value) => {
                        setCategoryId(value);
                        clearFieldError('plan_category_id');
                    }}
                    options={categoryOptions}
                    required
                    value={categoryId}
                />
                <TextField
                    label="Tagline"
                    onChangeText={setTagline}
                    value={tagline}
                />
                <TextField
                    error={fieldErrors.description}
                    label="Description"
                    multiline
                    numberOfLines={4}
                    onChangeText={(value) => {
                        setDescription(value);
                        clearFieldError('description');
                    }}
                    required
                    value={description}
                />
                <FormSelect
                    error={fieldErrors.plan_rank_id}
                    hint="Controls upgrade tier and customer entitlements."
                    label="Plan rank"
                    onChange={(value) => {
                        setRankId(value);
                        clearFieldError('plan_rank_id');
                    }}
                    options={rankOptions}
                    required
                    value={rankId}
                />
                <TextField
                    error={fieldErrors.duration_weeks}
                    keyboardType="number-pad"
                    label="Duration (weeks)"
                    onChangeText={(value) => {
                        setDurationWeeks(value);
                        clearFieldError('duration_weeks');
                    }}
                    required
                    value={durationWeeks}
                />
                <TextField
                    error={fieldErrors.price_inr}
                    keyboardType="decimal-pad"
                    label="Price (INR)"
                    onChangeText={(value) => {
                        setPriceInr(value);
                        clearFieldError('price_inr');
                    }}
                    required
                    value={priceInr}
                />
                <TextField
                    error={fieldErrors.offer_price_inr}
                    keyboardType="decimal-pad"
                    label="Offer price (INR)"
                    onChangeText={(value) => {
                        setOfferPriceInr(value);
                        clearFieldError('offer_price_inr');
                    }}
                    placeholder="Optional — charged when set"
                    value={offerPriceInr}
                />
                <FormSwitch
                    hint="Inactive plans are hidden from customers"
                    label="Active (visible to customers)"
                    onValueChange={setIsActive}
                    value={isActive}
                />
                <FormSwitch
                    label="Featured on plans page"
                    onValueChange={setIsFeatured}
                    value={isFeatured}
                />
                {formError ? <Text style={styles.error}>{formError}</Text> : null}
                <Button label={isEdit ? 'Update plan' : 'Create plan'} loading={saving} onPress={() => void save()} />
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    root: { flex: 1, backgroundColor: colors.background },
    content: { padding: spacing.lg, gap: spacing.md, paddingBottom: spacing.xl },
    error: { color: colors.error, fontSize: 14 },
});
