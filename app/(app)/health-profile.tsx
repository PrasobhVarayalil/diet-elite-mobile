import { AppScreen } from '@/components/ui/AppScreen';
import { CustomerProgramGate } from '@/components/auth/CustomerProgramGate';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { TextField } from '@/components/ui/TextField';
import { colors, spacing } from '@/constants/theme';
import { useAuth } from '@/src/context/auth-context';
import { apiGet, apiPut } from '@/src/lib/api-client';
import { apiRoutes } from '@/src/lib/api-routes';
import { PLANS_LIST_HREF } from '@/src/lib/navigation';
import { useRouter } from 'expo-router';
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

function splitTags(value: string): string[] {
    return value
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);
}

export default function HealthProfileScreen() {
    const router = useRouter();
    const { user } = useAuth();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [form, setForm] = useState<HealthProfile>({});
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);

    const load = useCallback(async () => {
        setLoading(true);
        const result = await apiGet<{ profile?: HealthProfile | null }>(apiRoutes.healthProfile.show);
        if (result.ok && result.data?.profile) {
            const p = result.data.profile;
            setForm({
                ...p,
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
    }

    async function save() {
        setSaving(true);
        setError(null);
        setSuccess(null);
        const payload = {
            date_of_birth: form.date_of_birth,
            gender: form.gender,
            height_cm: form.height_cm,
            weight_kg: form.weight_kg,
            goal_weight_kg: form.goal_weight_kg || null,
            activity_level: form.activity_level,
            medical_conditions: form.medical_conditions || null,
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
        } else {
            setError(result.message);
        }
    }

    return (
        <CustomerProgramGate>
            <AppScreen
                keyboard
                loading={loading}
                scroll
                showLogo={false}
                subtitle="Helps personalize your plan"
                title="Health profile"
            >
                {error ? <Text style={styles.error}>{error}</Text> : null}
                {success ? <Text style={styles.success}>{success}</Text> : null}
                <Card>
                    <TextField
                        label="Date of birth (YYYY-MM-DD)"
                        onChangeText={(v) => setField('date_of_birth', v)}
                        placeholder="1990-01-15"
                        value={form.date_of_birth ?? ''}
                    />
                    <TextField
                        label="Gender (male, female, other)"
                        onChangeText={(v) => setField('gender', v)}
                        value={form.gender ?? ''}
                    />
                    <TextField
                        keyboardType="numeric"
                        label="Height (cm)"
                        onChangeText={(v) => setField('height_cm', v)}
                        value={String(form.height_cm ?? '')}
                    />
                    <TextField
                        keyboardType="numeric"
                        label="Weight (kg)"
                        onChangeText={(v) => setField('weight_kg', v)}
                        value={String(form.weight_kg ?? '')}
                    />
                    <TextField
                        keyboardType="numeric"
                        label="Goal weight (kg)"
                        onChangeText={(v) => setField('goal_weight_kg', v)}
                        value={String(form.goal_weight_kg ?? '')}
                    />
                    <TextField
                        label="Activity level (sedentary, light, moderate, active, very_active)"
                        onChangeText={(v) => setField('activity_level', v)}
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
