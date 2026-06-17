import { colors, spacing } from '@/constants/theme';
import { Ionicons } from '@expo/vector-icons';
import { ActivityIndicator, Pressable, StyleSheet, TextInput, View } from 'react-native';

type Props = {
    value: string;
    onChangeText: (text: string) => void;
    onSend: () => void;
    sending?: boolean;
    placeholder?: string;
};

export function ChatComposer({
    value,
    onChangeText,
    onSend,
    sending = false,
    placeholder = 'Message',
}: Props) {
    const canSend = value.trim().length > 0 && !sending;

    return (
        <View style={styles.row}>
            <TextInput
                multiline
                onChangeText={onChangeText}
                placeholder={placeholder}
                placeholderTextColor={colors.textMuted}
                style={styles.input}
                textAlignVertical="center"
                value={value}
            />
            <Pressable
                disabled={!canSend}
                onPress={onSend}
                style={[styles.send, !canSend && styles.sendDisabled]}
            >
                {sending ? (
                    <ActivityIndicator color={colors.white} size="small" />
                ) : (
                    <Ionicons color={colors.white} name="send" size={18} />
                )}
            </Pressable>
        </View>
    );
}

const styles = StyleSheet.create({
    row: {
        flexDirection: 'row',
        alignItems: 'flex-end',
        gap: spacing.sm,
        paddingHorizontal: spacing.md,
        paddingTop: spacing.sm,
    },
    input: {
        flex: 1,
        minHeight: 40,
        maxHeight: 100,
        borderRadius: 20,
        paddingHorizontal: spacing.md,
        paddingVertical: 8,
        fontSize: 15,
        lineHeight: 20,
        color: colors.text,
        backgroundColor: colors.background,
        borderWidth: 1,
        borderColor: colors.border,
    },
    send: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: colors.brandDark,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 1,
    },
    sendDisabled: { opacity: 0.45 },
});
