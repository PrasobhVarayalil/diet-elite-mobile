import { Button } from '@/components/ui/Button';
import { Screen } from '@/components/ui/Screen';
import { TextField } from '@/components/ui/TextField';
import { colors, spacing } from '@/constants/theme';
import { useAuth } from '@/src/context/auth-context';
import { apiBaseUrl } from '@/src/lib/config';
import { Redirect, router } from 'expo-router';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, StyleSheet, Text, View } from 'react-native';

export default function LoginScreen() {
    const { user, signingIn, login } = useAuth();
    const [identifier, setIdentifier] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState<string | null>(null);

    if (user) {
        return <Redirect href="/(app)" />;
    }

    async function onSubmit() {
        setError(null);

        if (!identifier.trim() || !password) {
            setError('Enter your email or username and password.');
            return;
        }

        const message = await login(identifier, password);
        if (message) {
            setError(message);
            return;
        }

        router.replace('/(app)');
    }

    return (
        <Screen title="Diet Elite" subtitle="Sign in with your Diet Elite account.">
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                style={styles.form}
            >
                <View style={styles.card}>
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
                </View>

                <Text style={styles.hint}>
                    Demo customer: customer@dietelite.com / password{'\n'}
                    API: {apiBaseUrl()}
                </Text>
            </KeyboardAvoidingView>
        </Screen>
    );
}

const styles = StyleSheet.create({
    form: {
        flex: 1,
        gap: spacing.lg,
    },
    card: {
        backgroundColor: colors.card,
        borderRadius: 16,
        padding: spacing.lg,
        gap: spacing.md,
        borderWidth: 1,
        borderColor: colors.border,
    },
    error: {
        color: colors.error,
        fontSize: 14,
    },
    hint: {
        color: colors.textMuted,
        fontSize: 13,
        lineHeight: 20,
    },
});
