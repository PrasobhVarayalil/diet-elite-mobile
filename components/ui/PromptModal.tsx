import { Button } from '@/components/ui/Button';
import { TextField } from '@/components/ui/TextField';
import { colors, spacing } from '@/constants/theme';
import { useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';

type Props = {
    visible: boolean;
    title: string;
    message: string;
    placeholder?: string;
    confirmLabel?: string;
    onCancel: () => void;
    onConfirm: (value: string) => void;
};

export function PromptModal({
    visible,
    title,
    message,
    placeholder = 'Optional reason',
    confirmLabel = 'Confirm',
    onCancel,
    onConfirm,
}: Props) {
    const [value, setValue] = useState('');

    function close() {
        setValue('');
        onCancel();
    }

    return (
        <Modal animationType="fade" onRequestClose={close} transparent visible={visible}>
            <View style={styles.backdrop}>
                <View style={styles.card}>
                    <Text style={styles.title}>{title}</Text>
                    <Text style={styles.message}>{message}</Text>
                    <TextField label="Reason" onChangeText={setValue} placeholder={placeholder} value={value} />
                    <View style={styles.actions}>
                        <Pressable onPress={close} style={styles.secondary}>
                            <Text style={styles.secondaryText}>Cancel</Text>
                        </Pressable>
                        <Button
                            label={confirmLabel}
                            onPress={() => {
                                onConfirm(value.trim());
                                setValue('');
                            }}
                        />
                    </View>
                </View>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    backdrop: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.45)',
        justifyContent: 'center',
        padding: spacing.lg,
    },
    card: {
        backgroundColor: colors.card,
        borderRadius: 16,
        padding: spacing.lg,
        gap: spacing.md,
        borderWidth: 1,
        borderColor: colors.border,
    },
    title: { fontSize: 18, fontWeight: '700', color: colors.text },
    message: { fontSize: 14, color: colors.textMuted, lineHeight: 20 },
    actions: { flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', gap: spacing.sm },
    secondary: { paddingHorizontal: spacing.md, paddingVertical: spacing.sm },
    secondaryText: { fontSize: 15, fontWeight: '600', color: colors.textMuted },
});
