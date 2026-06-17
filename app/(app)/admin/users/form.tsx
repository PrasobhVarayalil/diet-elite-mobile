import { AppHeader } from '@/components/ui/AppHeader';
import { Button } from '@/components/ui/Button';
import { TextField } from '@/components/ui/TextField';
import { colors, spacing } from '@/constants/theme';
import { apiGet, apiPost, apiPut } from '@/src/lib/api-client';
import { apiRoutes } from '@/src/lib/api-routes';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, StyleSheet, Text, View } from 'react-native';

type RoleOption = { value: string; label: string };

export default function AdminUserFormScreen() {
    const router = useRouter();
    const { id } = useLocalSearchParams<{ id?: string }>();
    const isEdit = Boolean(id);
    const [loading, setLoading] = useState(isEdit);
    const [saving, setSaving] = useState(false);
    const [roles, setRoles] = useState<RoleOption[]>([]);
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [username, setUsername] = useState('');
    const [phone, setPhone] = useState('');
    const [role, setRole] = useState('customer');
    const [password, setPassword] = useState('');
    const [passwordConfirmation, setPasswordConfirmation] = useState('');
    const [isActive, setIsActive] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const load = useCallback(async () => {
        const path = isEdit ? apiRoutes.admin.users.edit(id!) : apiRoutes.admin.users.create;
        setLoading(true);
        const result = await apiGet<{ user?: Record<string, unknown>; roleOptions?: RoleOption[] }>(path);
        if (result.ok && result.data) {
            setRoles(result.data.roleOptions ?? []);
            const u = result.data.user;
            if (u) {
                setName(String(u.name ?? ''));
                setEmail(String(u.email ?? ''));
                setUsername(String(u.username ?? ''));
                setPhone(String(u.phone ?? ''));
                setRole(String(u.role ?? 'customer'));
                setIsActive(u.is_active !== false);
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
        const payload: Record<string, unknown> = {
            name: name.trim(),
            email: email.trim(),
            phone: phone.trim() || null,
            role,
            is_active: isActive,
        };
        if (role === 'customer') {
            payload.username = username.trim();
        }
        if (!isEdit || password) {
            payload.password = password;
            payload.password_confirmation = passwordConfirmation;
        }
        const result = isEdit
            ? await apiPut(apiRoutes.admin.users.update(id!), payload)
            : await apiPost(apiRoutes.admin.users.store, payload);
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
            <AppHeader subtitle="Account" title={isEdit ? 'Edit user' : 'New user'} />
            <ScrollView contentContainerStyle={styles.content}>
                <TextField label="Full name" onChangeText={setName} value={name} />
                <TextField autoCapitalize="none" label="Email" onChangeText={setEmail} value={email} />
                {role === 'customer' ? (
                    <TextField autoCapitalize="none" label="Username" onChangeText={setUsername} value={username} />
                ) : null}
                <TextField label="Phone" onChangeText={setPhone} value={phone} />
                <TextField label="Role (customer|admin|dietitian|enrollment_advisor)" onChangeText={setRole} value={role} />
                {roles.length > 0 ? (
                    <Text style={styles.hint}>Roles: {roles.map((r) => r.value).join(', ')}</Text>
                ) : null}
                <TextField label={isEdit ? 'New password (optional)' : 'Password'} onChangeText={setPassword} secureTextEntry value={password} />
                <TextField label="Confirm password" onChangeText={setPasswordConfirmation} secureTextEntry value={passwordConfirmation} />
                {error ? <Text style={styles.error}>{error}</Text> : null}
                <Button label={isEdit ? 'Update user' : 'Create user'} loading={saving} onPress={save} />
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
