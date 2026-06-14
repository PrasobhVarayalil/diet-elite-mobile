import { colors, spacing } from '@/constants/theme';
import { StyleSheet, Text, TextInput, View, type TextInputProps } from 'react-native';

type TextFieldProps = TextInputProps & {
    label: string;
    error?: string | null;
};

export function TextField({ label, error, style, ...rest }: TextFieldProps) {
    return (
        <View style={styles.wrap}>
            <Text style={styles.label}>{label}</Text>
            <TextInput
                placeholderTextColor={colors.textMuted}
                style={[styles.input, error ? styles.inputError : null, style]}
                {...rest}
            />
            {error ? <Text style={styles.error}>{error}</Text> : null}
        </View>
    );
}

const styles = StyleSheet.create({
    wrap: {
        gap: spacing.sm,
    },
    label: {
        fontSize: 14,
        fontWeight: '600',
        color: colors.text,
    },
    input: {
        minHeight: 48,
        borderWidth: 1,
        borderColor: colors.border,
        borderRadius: 12,
        paddingHorizontal: spacing.md,
        fontSize: 16,
        color: colors.text,
        backgroundColor: colors.white,
    },
    inputError: {
        borderColor: colors.error,
    },
    error: {
        color: colors.error,
        fontSize: 13,
    },
});
