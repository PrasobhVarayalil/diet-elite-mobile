import { FormLabel } from '@/components/ui/FormLabel';
import { colors, spacing } from '@/constants/theme';
import { StyleSheet, Text, TextInput, View, type TextInputProps } from 'react-native';

type TextFieldProps = TextInputProps & {
    label: string;
    required?: boolean;
    error?: string | null;
};

export function TextField({ label, required, error, style, multiline, ...rest }: TextFieldProps) {
    return (
        <View style={styles.wrap}>
            <FormLabel required={required}>{label}</FormLabel>
            <TextInput
                placeholderTextColor={colors.textMuted}
                style={[
                    styles.input,
                    multiline && styles.inputMultiline,
                    error ? styles.inputError : null,
                    style,
                ]}
                multiline={multiline}
                textAlignVertical={multiline ? 'top' : 'center'}
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
    input: {
        minHeight: 48,
        borderWidth: 1,
        borderColor: colors.border,
        borderRadius: 12,
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.sm,
        fontSize: 16,
        color: colors.text,
        backgroundColor: colors.white,
    },
    inputMultiline: {
        minHeight: 72,
        maxHeight: 140,
        paddingTop: spacing.sm,
    },
    inputError: {
        borderColor: colors.error,
    },
    error: {
        color: colors.error,
        fontSize: 13,
    },
});
