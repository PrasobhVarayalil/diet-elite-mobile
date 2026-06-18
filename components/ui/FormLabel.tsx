import { colors } from '@/constants/theme';
import { StyleSheet, Text } from 'react-native';

type Props = {
    children: string;
    required?: boolean;
};

export function FormLabel({ children, required = false }: Props) {
    return (
        <Text style={styles.label}>
            {children}
            {required ? <Text style={styles.required}> *</Text> : null}
        </Text>
    );
}

const styles = StyleSheet.create({
    label: {
        fontSize: 14,
        fontWeight: '600',
        color: colors.text,
    },
    required: {
        color: colors.error,
        fontWeight: '700',
    },
});
