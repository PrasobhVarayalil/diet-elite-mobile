import { colors, radius, spacing } from '@/constants/theme';
import { StyleSheet, Switch, Text, View } from 'react-native';

type Props = {
    label: string;
    value: boolean;
    onValueChange: (value: boolean) => void;
    hint?: string;
    disabled?: boolean;
};

export function FormSwitch({ label, value, onValueChange, hint, disabled = false }: Props) {
    return (
        <View style={styles.row}>
            <View style={styles.copy}>
                <Text style={styles.label}>{label}</Text>
                {hint ? <Text style={styles.hint}>{hint}</Text> : null}
            </View>
            <Switch
                disabled={disabled}
                onValueChange={onValueChange}
                thumbColor={value ? colors.brandLight : '#f4f4f5'}
                trackColor={{ false: colors.border, true: colors.brandDark }}
                value={value}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    row: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: spacing.md,
        paddingVertical: spacing.sm,
        paddingHorizontal: spacing.md,
        backgroundColor: colors.card,
        borderRadius: radius.md,
        borderWidth: 1,
        borderColor: colors.border,
    },
    copy: { flex: 1, gap: 2 },
    label: { fontSize: 15, fontWeight: '600', color: colors.text },
    hint: { fontSize: 12, color: colors.textMuted },
});
