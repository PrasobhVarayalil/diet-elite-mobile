import { BrandLogo } from '@/components/ui/BrandLogo';
import { Button } from '@/components/ui/Button';
import { TextField } from '@/components/ui/TextField';
import { colors, spacing, typography } from '@/constants/theme';
import { useAuth } from '@/src/context/auth-context';
import { mobileEntryHref, appHref } from '@/src/lib/navigation';
import { Redirect, Link, router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { useEffect, useState } from 'react';
import { KeyboardAvoidingView, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { keyboardAvoidingBehavior } from '@/src/lib/layout';

export default function RegisterScreen() {
    const insets = useSafeAreaInsets();
    const { user, signingIn, register, registrationEnabled, configLoaded } = useAuth();
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [username, setUsername] = useState('');
    const [phone, setPhone] = useState('');
    const [password, setPassword] = useState('');
    const [passwordConfirmation, setPasswordConfirmation] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

    useEffect(() => {
        if (configLoaded && !registrationEnabled) {
            router.replace(appHref('/login'));
        }
    }, [configLoaded, registrationEnabled]);

    if (user) {
        return <Redirect href={mobileEntryHref(user)} />;
    }

    if (!configLoaded) {
        return <View style={styles.root} />;
    }

    if (!registrationEnabled) {
        return <Redirect href={appHref('/login')} />;
    }

    async function onSubmit() {
        setError(null);
        setFieldErrors({});

        if (!name.trim() || !email.trim() || !username.trim() || !password) {
            setError('Fill in all required fields.');
            return;
        }

        const result = await register({
            name: name.trim(),
            email: email.trim(),
            username: username.trim().toLowerCase(),
            phone: phone.trim() || undefined,
            password,
            password_confirmation: passwordConfirmation,
        });

        if (result.error) {
            setError(result.error);
            if (result.fieldErrors) {
                setFieldErrors(result.fieldErrors);
            }
            return;
        }

        if (result.user) {
            router.replace(mobileEntryHref(result.user));
        }
    }

    return (
        <View style={styles.root}>
            <LinearGradient
                colors={['#3d9e2a', colors.brandDark, '#1a5c10']}
                end={{ x: 1, y: 1 }}
                start={{ x: 0, y: 0 }}
                style={[styles.hero, { paddingTop: insets.top + spacing.lg }]}
            >
                <BrandLogo bordered size="md" />
                <Text style={styles.brand}>Join Diet Elite</Text>
            </LinearGradient>

            <KeyboardAvoidingView behavior={keyboardAvoidingBehavior()} style={styles.formWrap}>
                <ScrollView
                    contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + spacing.lg }]}
                    keyboardShouldPersistTaps="handled"
                    showsVerticalScrollIndicator={false}
                >
                    <View style={styles.card}>
                        <Text style={styles.cardTitle}>Create account</Text>
                        <TextField
                            label="Full name *"
                            onChangeText={setName}
                            value={name}
                            error={fieldErrors.name}
                        />
                        <TextField
                            autoCapitalize="none"
                            keyboardType="email-address"
                            label="Email *"
                            onChangeText={setEmail}
                            value={email}
                            error={fieldErrors.email}
                        />
                        <TextField
                            autoCapitalize="none"
                            label="Username *"
                            onChangeText={setUsername}
                            placeholder="lowercase letters, numbers, dots"
                            value={username}
                            error={fieldErrors.username}
                        />
                        <TextField
                            keyboardType="phone-pad"
                            label="Phone"
                            onChangeText={setPhone}
                            value={phone}
                            error={fieldErrors.phone}
                        />
                        <TextField
                            label="Password *"
                            onChangeText={setPassword}
                            secureTextEntry
                            value={password}
                            error={fieldErrors.password}
                        />
                        <TextField
                            label="Confirm password *"
                            onChangeText={setPasswordConfirmation}
                            secureTextEntry
                            value={passwordConfirmation}
                        />
                        {error ? <Text style={styles.error}>{error}</Text> : null}
                        <Button label="Create account" loading={signingIn} onPress={onSubmit} />
                        <Text style={styles.switch}>
                            Already have an account?{' '}
                            <Link href={appHref('/login')} style={styles.link}>
                                Sign in
                            </Link>
                        </Text>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
        </View>
    );
}

const styles = StyleSheet.create({
    root: { flex: 1, backgroundColor: colors.background },
    hero: {
        alignItems: 'center',
        paddingHorizontal: spacing.lg,
        paddingBottom: spacing.xl,
        borderBottomLeftRadius: 32,
        borderBottomRightRadius: 32,
        gap: spacing.sm,
    },
    brand: { ...typography.title, color: colors.white, marginTop: spacing.sm },
    formWrap: { flex: 1, marginTop: -20 },
    scroll: { flexGrow: 1, paddingHorizontal: spacing.lg, paddingTop: spacing.md },
    card: {
        backgroundColor: colors.card,
        borderRadius: 24,
        padding: spacing.lg,
        gap: spacing.md,
        borderWidth: 1,
        borderColor: colors.border,
    },
    cardTitle: { fontSize: 22, fontWeight: '800', color: colors.text },
    error: { color: colors.error, fontSize: 14 },
    switch: { textAlign: 'center', color: colors.textMuted, fontSize: 14 },
    link: { color: colors.brandDark, fontWeight: '600' },
});
