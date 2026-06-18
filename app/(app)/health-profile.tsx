import { AppScreen } from '@/components/ui/AppScreen';
import { CustomerProgramGate } from '@/components/auth/CustomerProgramGate';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { FormSelect } from '@/components/ui/FormSelect';
import { TextField } from '@/components/ui/TextField';
import { colors } from '@/constants/theme';
import { apiGet, apiPut } from '@/src/lib/api-client';
import { apiRoutes } from '@/src/lib/api-routes';
import { useCallback, useEffect, useState } from 'react';
import { StyleSheet, Text } from 'react-native';

type HealthProfile = {
    date_of_birth?: string | null;
    gender?: string | null;
    height_cm?: string | number | null;
    weight_kg?: string | number | null;
    goal_weight_kg?: string | number | null;
    activity_level?: string | null;
    dietary_preferences?: string | string[] | null;
    allergies?: string | string[] | null;
    medical_conditions?: string | null;
};

const GENDER_OPTIONS = [
    { value: 'male', label: 'Male' },
    { value: 'female', label: 'Female' },
    { value: 'other', label: 'Other' },
    { value: 'prefer_not_to_say', label: 'Prefer not to say' },
];

const ACTIVITY_OPTIONS = [
    { value: 'sedentary', label: 'Sedentary' },
    { value: 'light', label: 'Lightly active' },
    { value: 'moderate', label: 'Moderately active' },
    { value: 'active', label: 'Active' },
    { value: 'very_active', label: 'Very active' },
];

function splitTags(value: string): string[] {
    return value
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);
}

function parseNumber(value: string | number | null | undefined): number | null {
    if (value === null || value === undefined || value === '') {
        return null;
    }

    const parsed = typeof value === 'number' ? value : Number(String(value).trim());
    return Number.isFinite(parsed) ? parsed : null;
}

function normalizeGender(value: string | null | undefined): string {
    const raw = (value ?? '').trim().toLowerCase().replace(/\s+/g, '_');
    if (raw === 'prefer_not_to_say' || raw === 'prefer-not-to-say') {
        return 'prefer_not_to_say';
    }
    return raw;
}

function normalizeActivity(value: string | null | undefined): string {
    return (value ?? '').trim().toLowerCase().replace(/\s+/g, '_');
}

function firstFieldError(errors?: Record<string, string[]> | null): string | null {
    if (!errors) {
        return null;
    }

    const first = Object.values(errors).find((messages) => messages?.length);
    return first?.[0] ?? null;
}

export default function HealthProfileScreen() {
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [form, setForm] = useState<HealthProfile>({});
    const [error, setError] = useState<string | null>(null);
    const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
    const [success, setSuccess] = useState<string | null>(null);

    const load = useCallback(async () => {
        setLoading(true);
        const result = await apiGet<{ profile?: HealthProfile | null }>(apiRoutes.healthProfile.show);
        if (result.ok && result.data?.profile) {
            const p = result.data.profile;
            setForm({
                ...p,
                gender: normalizeGender(p.gender),
                activity_level: normalizeActivity(p.activity_level),
                allergies: Array.isArray(p.allergies) ? p.allergies.join(', ') : (p.allergies as string | undefined),
                dietary_preferences: Array.isArray(p.dietary_preferences)
                    ? p.dietary_preferences.join(', ')
                    : (p.dietary_preferences as string | undefined),
            });
        }
        setLoading(false);
    }, []);

    useEffect(() => {
        load();
    }, [load]);

    function setField(key: keyof HealthProfile, value: string) {
        setForm((prev) => ({ ...prev, [key]: value }));
        setFieldErrors((prev) => {
            const next = { ...prev };
            delete next[key];
            return next;
        });
    }

    async function save() {
        setSaving(true);
        setError(null);
        setFieldErrors({});
        setSuccess(null);

        const height = parseNumber(form.height_cm);
        const weight = parseNumber(form.weight_kg);
        const goalWeight = parseNumber(form.goal_weight_kg);
        const gender = normalizeGender(form.gender);
        const activity = normalizeActivity(form.activity_level);
        const dob = form.date_of_birth?.trim() ?? '';

        const nextErrors: Record<string, string> = {};
        if (!dob) {
            nextErrors.date_of_birth = 'Date of birth is required (YYYY-MM-DD).';
        }
        if (!gender) {
            nextErrors.gender = 'Please select a gender.';
        }
        if (height === null) {
            nextErrors.height_cm = 'Enter height in cm (50–300).';
        }
        if (weight === null) {
            nextErrors.weight_kg = 'Enter weight in kg (20–500).';
        }
        if (!activity) {
            nextErrors.activity_level = 'Please select an activity level.';
        }

        if (Object.keys(nextErrors).length > 0) {
            setFieldErrors(nextErrors);
            setError('Please fix the highlighted fields.');
            setSaving(false);
            return;
        }

        const payload = {
            date_of_birth: dob,
            gender,
            height_cm: height,
            weight_kg: weight,
            goal_weight_kg: goalWeight,
            activity_level: activity,
            medical_conditions: form.medical_conditions?.trim() || null,
            allergies: typeof form.allergies === 'string' ? splitTags(form.allergies) : (form.allergies ?? []),
            dietary_preferences:
                typeof form.dietary_preferences === 'string'
                    ? splitTags(form.dietary_preferences)
                    : (form.dietary_preferences ?? []),
        };

        const result = await apiPut(apiRoutes.healthProfile.update, payload);
        setSaving(false);

        if (result.ok) {
            setSuccess('Health profile saved.');
            return;
        }

        if (result.errors) {
            const mapped = Object.fromEntries(
                Object.entries(result.errors).map(([key, messages]) => [key, messages[0] ?? 'Invalid value.']),
            );
            setFieldErrors(mapped);
        }

        setError(firstFieldError(result.errors) ?? result.message);
    }

    return (
        <CustomerProgramGate>
            <AppScreen
                keyboard
                loading={loading}
                loadingMessage="Loading health profile…"
                scroll
                showLogo={false}
                subtitle="Helps personalize your plan"
                title="Health profile"
            >
                {error ? <Text style={styles.error}>{error}</Text> : null}
                {success ? <Text style={styles.success}>{success}</Text> : null}
                <Card>
                    <TextField
                        error={fieldErrors.date_of_birth}
                        label="Date of birth"
                        onChangeText={(v) => setField('date_of_birth', v)}
                        placeholder="1990-01-15"
                        value={form.date_of_birth ?? ''}
                    />
                    <FormSelect
                        error={fieldErrors.gender}
                        label="Gender"
                        onChange={(v) => setField('gender', v)}
                        options={GENDER_OPTIONS}
                        required
                        value={form.gender ?? ''}
                    />
                    <TextField
                        error={fieldErrors.height_cm}
                        keyboardType="decimal-pad"
                        label="Height (cm)"
                        onChangeText={(v) => setField('height_cm', v)}
                        value={String(form.height_cm ?? '')}
                    />
                    <TextField
                        error={fieldErrors.weight_kg}
                        keyboardType="decimal-pad"
                        label="Weight (kg)"
                        onChangeText={(v) => setField('weight_kg', v)}
                        value={String(form.weight_kg ?? '')}
                    />
                    <TextField
                        error={fieldErrors.goal_weight_kg}
                        keyboardType="decimal-pad"
                        label="Goal weight (kg)"
                        onChangeText={(v) => setField('goal_weight_kg', v)}
                        value={String(form.goal_weight_kg ?? '')}
                    />
                    <FormSelect
                        error={fieldErrors.activity_level}
                        label="Activity level"
                        onChange={(v) => setField('activity_level', v)}
                        options={ACTIVITY_OPTIONS}
                        required
                        value={form.activity_level ?? ''}
                    />
                    <TextField
                        label="Dietary preferences (comma-separated)"
                        multiline
                        onChangeText={(v) => setField('dietary_preferences', v)}
                        value={String(form.dietary_preferences ?? '')}
                    />
                    <TextField
                        label="Allergies (comma-separated)"
                        multiline
                        onChangeText={(v) => setField('allergies', v)}
                        value={String(form.allergies ?? '')}
                    />
                    <TextField
                        label="Medical conditions"
                        multiline
                        onChangeText={(v) => setField('medical_conditions', v)}
                        value={form.medical_conditions ?? ''}
                    />
                    <Button label="Save profile" loading={saving} onPress={save} />
                </Card>
            </AppScreen>
        </CustomerProgramGate>
    );
}

const styles = StyleSheet.create({
    error: { color: colors.error },
    success: { color: colors.success },
});
