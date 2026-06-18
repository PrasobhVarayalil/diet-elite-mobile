import { FormLabel } from '@/components/ui/FormLabel';
import { colors, radius, spacing } from '@/constants/theme';
import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';

export type SelectOption = {
    value: string;
    label: string;
    meta?: string | null;
};

type Props = {
    label: string;
    required?: boolean;
    error?: string | null;
    hint?: string | null;
    options: SelectOption[];
    value: string;
    onChange: (value: string) => void;
    emptyLabel?: string;
};

export function FormSelect({
    label,
    required = false,
    error,
    hint,
    options,
    value,
    onChange,
    emptyLabel = 'No options available.',
}: Props) {
    return (
        <View style={styles.wrap}>
            <FormLabel required={required}>{label}</FormLabel>
            {options.length === 0 ? (
                <Text style={styles.empty}>{emptyLabel}</Text>
            ) : (
                <View style={[styles.list, error ? styles.listError : null]}>
                    {options.map((option) => {
                        const active = option.value === value;
                        return (
                            <Pressable
                                key={option.value}
                                onPress={() => onChange(option.value)}
                                style={[styles.option, active && styles.optionActive]}
                            >
                                <View style={styles.optionCopy}>
                                    <Text style={[styles.optionLabel, active && styles.optionLabelActive]}>
                                        {option.label}
                                    </Text>
                                    {option.meta ? <Text style={styles.optionMeta}>{option.meta}</Text> : null}
                                </View>
                                {active ? (
                                    <Ionicons color={colors.brandDark} name="checkmark-circle" size={20} />
                                ) : null}
                            </Pressable>
                        );
                    })}
                </View>
            )}
            {hint ? <Text style={styles.hint}>{hint}</Text> : null}
            {error ? <Text style={styles.error}>{error}</Text> : null}
        </View>
    );
}

const styles = StyleSheet.create({
    wrap: { gap: spacing.sm },
    list: {
        borderWidth: 1,
        borderColor: colors.border,
        borderRadius: radius.md,
        overflow: 'hidden',
        backgroundColor: colors.white,
    },
    listError: { borderColor: colors.error },
    option: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.sm,
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.sm,
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderBottomColor: colors.border,
    },
    optionActive: { backgroundColor: colors.brandMuted },
    optionCopy: { flex: 1, minWidth: 0 },
    optionLabel: { fontSize: 15, fontWeight: '600', color: colors.text },
    optionLabelActive: { color: colors.brandDark },
    optionMeta: { fontSize: 12, color: colors.textMuted, marginTop: 2 },
    empty: { fontSize: 13, color: colors.textMuted, fontStyle: 'italic' },
    hint: { fontSize: 12, color: colors.textMuted, lineHeight: 18 },
    error: { fontSize: 13, color: colors.error },
});
