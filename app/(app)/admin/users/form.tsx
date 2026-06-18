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

type RoleOption = { value: string; label: string };

type FieldErrors = Partial<
    Record<'name' | 'email' | 'username' | 'role' | 'password' | 'password_confirmation', string>
>;

export default function AdminUserFormScreen() {
    const router = useRouter();
    const { id } = useLocalSearchParams<{ id?: string }>();
    const isEdit = Boolean(id);
    const [loading, setLoading] = useState(true);
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
    const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
    const [formError, setFormError] = useState<string | null>(null);

    const roleOptions = useMemo(
        () =>
            roles.map((option) => ({
                value: option.value,
                label: option.label,
            })),
        [roles],
    );

    const load = useCallback(async () => {
        const path = isEdit ? apiRoutes.admin.users.edit(id!) : apiRoutes.admin.users.create;
        setLoading(true);
        const result = await apiGet<{ user?: Record<string, unknown>; roleOptions?: RoleOption[] }>(path);
        if (result.ok && result.data) {
            setRoles(result.data.roleOptions ?? []);
            const user = result.data.user;
            if (user) {
                setName(String(user.name ?? ''));
                setEmail(String(user.email ?? ''));
                setUsername(String(user.username ?? ''));
                setPhone(String(user.phone ?? ''));
                setRole(String(user.role ?? 'customer'));
                setIsActive(user.is_active !== false);
            } else if (result.data.roleOptions?.[0]) {
                setRole(result.data.roleOptions[0].value);
            }
        } else {
            setFormError(result.ok ? 'Could not load user form.' : result.message);
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

    function validateClient(): FieldErrors {
        const errors: FieldErrors = {};
        if (!name.trim()) {
            errors.name = 'Full name is required.';
        }
        if (!email.trim()) {
            errors.email = 'Email is required.';
        }
        if (!role) {
            errors.role = 'Role is required.';
        }
        if (role === 'customer' && !username.trim()) {
            errors.username = 'Username is required for customers.';
        }
        if (!isEdit || password) {
            if (!password) {
                errors.password = 'Password is required.';
            }
            if (!passwordConfirmation) {
                errors.password_confirmation = 'Please confirm the password.';
            } else if (password !== passwordConfirmation) {
                errors.password_confirmation = 'Passwords do not match.';
            }
        }
        return errors;
    }

    async function save() {
        const clientErrors = validateClient();
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
            email: email.trim(),
            phone: phone.trim() || null,
            role,
            is_active: isActive,
        };
        if (role === 'customer') {
            payload.username = username.trim().toLowerCase();
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
            <AppHeader subtitle="Account" title={isEdit ? 'Edit user' : 'New user'} />
            <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
                <TextField
                    error={fieldErrors.name}
                    label="Full name"
                    onChangeText={(value) => {
                        setName(value);
                        clearFieldError('name');
                    }}
                    required
                    value={name}
                />
                <TextField
                    autoCapitalize="none"
                    error={fieldErrors.email}
                    keyboardType="email-address"
                    label="Email"
                    onChangeText={(value) => {
                        setEmail(value);
                        clearFieldError('email');
                    }}
                    required
                    value={email}
                />
                {role === 'customer' ? (
                    <TextField
                        autoCapitalize="none"
                        error={fieldErrors.username}
                        label="Username"
                        onChangeText={(value) => {
                            setUsername(value);
                            clearFieldError('username');
                        }}
                        required
                        value={username}
                    />
                ) : null}
                <TextField label="Phone" onChangeText={setPhone} value={phone} />
                <FormSelect
                    error={fieldErrors.role}
                    label="Role"
                    onChange={(value) => {
                        setRole(value);
                        clearFieldError('role');
                    }}
                    options={roleOptions}
                    required
                    value={role}
                />
                <FormSwitch
                    hint="Inactive users cannot sign in"
                    label="Account active"
                    onValueChange={setIsActive}
                    value={isActive}
                />
                <TextField
                    error={fieldErrors.password}
                    label={isEdit ? 'New password (optional)' : 'Password'}
                    onChangeText={(value) => {
                        setPassword(value);
                        clearFieldError('password');
                    }}
                    required={!isEdit}
                    secureTextEntry
                    value={password}
                />
                <TextField
                    error={fieldErrors.password_confirmation}
                    label="Confirm password"
                    onChangeText={(value) => {
                        setPasswordConfirmation(value);
                        clearFieldError('password_confirmation');
                    }}
                    required={!isEdit || password.length > 0}
                    secureTextEntry
                    value={passwordConfirmation}
                />
                {formError ? <Text style={styles.error}>{formError}</Text> : null}
                <Button label={isEdit ? 'Update user' : 'Create user'} loading={saving} onPress={() => void save()} />
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    root: { flex: 1, backgroundColor: colors.background },
    content: { padding: spacing.lg, gap: spacing.md, paddingBottom: spacing.xl },
    error: { color: colors.error, fontSize: 14 },
});
