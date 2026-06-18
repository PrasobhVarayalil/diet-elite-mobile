import { BrandLogo } from '@/components/ui/BrandLogo';
import { Button } from '@/components/ui/Button';
import { TextField } from '@/components/ui/TextField';
import { colors, spacing, typography } from '@/constants/theme';
import { useAuth } from '@/src/context/auth-context';
import { apiBaseUrl } from '@/src/lib/config';
import { mobileEntryHref, appHref } from '@/src/lib/navigation';
import { Redirect, router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { useState } from 'react';
import { KeyboardAvoidingView, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { keyboardAvoidingBehavior } from '@/src/lib/layout';

export default function LoginScreen() {
    const insets = useSafeAreaInsets();
    const { user, signingIn, login, registrationEnabled, configLoaded } = useAuth();
    const [identifier, setIdentifier] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState<string | null>(null);

    if (user) {
        return <Redirect href={mobileEntryHref(user)} />;
    }

    async function onSubmit() {
        setError(null);

        if (!identifier.trim() || !password) {
            setError('Enter your email or username and password.');
            return;
        }

        const result = await login(identifier, password);
        if (result.error) {
            setError(result.error);
            return;
        }

        router.replace(mobileEntryHref(result.user));
    }

    return (
        <View style={styles.root}>
            <LinearGradient
                colors={['#3d9e2a', colors.brandDark, '#1a5c10']}
                end={{ x: 1, y: 1 }}
                start={{ x: 0, y: 0 }}
                style={[styles.hero, { paddingTop: insets.top + spacing.xl }]}
            >
                <BrandLogo bordered size="hero" />
                <Text style={styles.brand}>Diet Elite</Text>
                <Text style={styles.tagline}>Personalized nutrition. Expert guidance. Real results.</Text>
            </LinearGradient>

            <KeyboardAvoidingView behavior={keyboardAvoidingBehavior()} style={styles.formWrap}>
                <ScrollView
                    contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + spacing.lg }]}
                    keyboardShouldPersistTaps="handled"
                    showsVerticalScrollIndicator={false}
                >
                    <View style={styles.card}>
                    <Text style={styles.cardTitle}>Welcome back</Text>
                    <Text style={styles.cardHint}>Sign in to continue your wellness journey.</Text>
                    <TextField
                        autoCapitalize="none"
                        autoCorrect={false}
                        label="Email or username"
                        onChangeText={setIdentifier}
                        placeholder="customer@dietelite.com"
                        value={identifier}
                    />
                    <TextField
                        label="Password"
                        onChangeText={setPassword}
                        placeholder="••••••••"
                        secureTextEntry
                        value={password}
                    />
                    {error ? <Text style={styles.error}>{error}</Text> : null}
                    <Button label="Sign in" loading={signingIn} onPress={onSubmit} />
                    {configLoaded && registrationEnabled ? (
                        <Text style={styles.switch}>
                            New here?{' '}
                            <Text onPress={() => router.push(appHref('/register'))} style={styles.link}>
                                Create an account
                            </Text>
                        </Text>
                    ) : null}
                    </View>

                    {__DEV__ ? (
                    <Text style={styles.footer}>
                        Demo: customer@dietelite.com / password{'\n'}
                        API: {apiBaseUrl()}
                    </Text>
                    ) : null}
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
        paddingBottom: spacing.xl + 24,
        borderBottomLeftRadius: 32,
        borderBottomRightRadius: 32,
        gap: spacing.sm,
    },
    brand: { ...typography.hero, color: colors.white, marginTop: spacing.sm },
    tagline: { ...typography.subtitle, color: 'rgba(255,255,255,0.9)', textAlign: 'center', maxWidth: 280 },
    formWrap: {
        flex: 1,
        marginTop: -24,
    },
    scroll: {
        flexGrow: 1,
        paddingHorizontal: spacing.lg,
        gap: spacing.lg,
    },
    card: {
        backgroundColor: colors.card,
        borderRadius: 24,
        padding: spacing.lg,
        gap: spacing.md,
        borderWidth: 1,
        borderColor: colors.border,
        shadowColor: '#142610',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.1,
        shadowRadius: 20,
        elevation: 5,
    },
    cardTitle: { fontSize: 22, fontWeight: '800', color: colors.text },
    cardHint: { fontSize: 14, color: colors.textMuted, marginBottom: 4, lineHeight: 20 },
    error: { color: colors.error, fontSize: 14 },
    switch: { textAlign: 'center', color: colors.textMuted, fontSize: 14, marginTop: 4 },
    link: { color: colors.brandDark, fontWeight: '600' },
    footer: { color: colors.textMuted, fontSize: 13, lineHeight: 20, textAlign: 'center' },
});
