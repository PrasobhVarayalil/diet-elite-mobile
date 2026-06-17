import { AppScreen } from '@/components/ui/AppScreen';
import { CustomerProgramGate } from '@/components/auth/CustomerProgramGate';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { TextField } from '@/components/ui/TextField';
import { colors, spacing } from '@/constants/theme';
import { useAuth } from '@/src/context/auth-context';
import { apiGet, apiPut } from '@/src/lib/api-client';
import { apiRoutes } from '@/src/lib/api-routes';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { StyleSheet, Text } from 'react-native';

type ProfileForm = {
    name: string;
    email: string;
    username: string;
    phone: string;
};

export default function ProfileEditScreen() {
    const router = useRouter();
    const { user, refreshUser } = useAuth();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [form, setForm] = useState<ProfileForm>({ name: '', email: '', username: '', phone: '' });
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);

    const load = useCallback(async () => {
        setLoading(true);
        const result = await apiGet<{ user?: ProfileForm }>(apiRoutes.profile.show);
        if (result.ok && result.data?.user) {
            const u = result.data.user;
            setForm({
                name: u.name ?? '',
                email: u.email ?? '',
                username: u.username ?? '',
                phone: u.phone ?? '',
            });
        } else if (user) {
            setForm({
                name: user.name,
                email: user.email,
                username: user.username,
                phone: user.phone ?? '',
            });
        }
        setLoading(false);
    }, [user]);

    useEffect(() => {
        load();
    }, [load]);

    function setField(key: keyof ProfileForm, value: string) {
        setForm((prev) => ({ ...prev, [key]: value }));
    }

    async function save() {
        setSaving(true);
        setError(null);
        setSuccess(null);
        const result = await apiPut(apiRoutes.profile.update, {
            ...form,
            phone: form.phone.trim() || null,
        });
        setSaving(false);
        if (result.ok) {
            setSuccess('Profile updated.');
            await refreshUser();
        } else {
            setError(result.message);
        }
    }

    return (
        <CustomerProgramGate requireActivePlan={false}>
            <AppScreen
                keyboard
                loading={loading}
                scroll
                showLogo={false}
                subtitle="Account details"
                title="Edit profile"
            >
                {error ? <Text style={styles.error}>{error}</Text> : null}
                {success ? <Text style={styles.success}>{success}</Text> : null}
                <Card>
                    <TextField label="Full name" onChangeText={(v) => setField('name', v)} value={form.name} />
                    <TextField
                        autoCapitalize="none"
                        keyboardType="email-address"
                        label="Email"
                        onChangeText={(v) => setField('email', v)}
                        value={form.email}
                    />
                    <TextField
                        autoCapitalize="none"
                        label="Username"
                        onChangeText={(v) => setField('username', v)}
                        value={form.username}
                    />
                    <TextField
                        keyboardType="phone-pad"
                        label="Phone"
                        onChangeText={(v) => setField('phone', v)}
                        value={form.phone}
                    />
                    <Button label="Save changes" loading={saving} onPress={save} />
                    <Button label="Back" onPress={() => router.back()} variant="secondary" />
                </Card>
            </AppScreen>
        </CustomerProgramGate>
    );
}

const styles = StyleSheet.create({
    error: { color: colors.error },
    success: { color: colors.success },
});
