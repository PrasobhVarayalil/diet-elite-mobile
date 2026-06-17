import { ContactPicker, type MessageContact } from '@/components/messages/ContactPicker';
import { Button } from '@/components/ui/Button';
import { colors, radius, spacing } from '@/constants/theme';
import { Ionicons } from '@expo/vector-icons';
import { KeyboardAvoidingView, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { keyboardAvoidingBehavior } from '@/src/lib/layout';

type Props = {
    contacts: MessageContact[];
    selectedContact: MessageContact | null;
    onSelectContact: (contact: MessageContact | null) => void;
    draft: string;
    onChangeDraft: (text: string) => void;
    onClose: () => void;
    onSend: () => void;
    sending: boolean;
    recipientLabel?: string;
};

export function ComposeMessagePanel({
    contacts,
    selectedContact,
    onSelectContact,
    draft,
    onChangeDraft,
    onClose,
    onSend,
    sending,
    recipientLabel = 'Recipient',
}: Props) {
    const insets = useSafeAreaInsets();
    const canSend = Boolean(selectedContact?.id && draft.trim());

    return (
        <KeyboardAvoidingView behavior={keyboardAvoidingBehavior()} keyboardVerticalOffset={0}>
            <View style={[styles.panel, { paddingBottom: insets.bottom + spacing.sm }]}>
                <View style={styles.head}>
                    <View>
                        <Text style={styles.title}>New message</Text>
                        <Text style={styles.sub}>Choose who to message, then write your note.</Text>
                    </View>
                    <Pressable accessibilityLabel="Close compose" hitSlop={8} onPress={onClose}>
                        <Ionicons color={colors.textMuted} name="close" size={24} />
                    </Pressable>
                </View>

                <ContactPicker
                    contacts={contacts}
                    label={recipientLabel}
                    onSelect={onSelectContact}
                    selected={selectedContact}
                />

                <Text style={styles.messageLabel}>Message</Text>
                <TextInput
                    multiline
                    onChangeText={onChangeDraft}
                    placeholder="Write your first message…"
                    placeholderTextColor={colors.textMuted}
                    style={styles.input}
                    textAlignVertical="top"
                    value={draft}
                />

                <Button
                    disabled={!canSend}
                    label="Start conversation"
                    loading={sending}
                    onPress={onSend}
                />
            </View>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    panel: {
        position: 'relative',
        zIndex: 3,
        borderTopWidth: 1,
        borderTopColor: colors.border,
        backgroundColor: colors.card,
        padding: spacing.md,
        gap: spacing.md,
        borderTopLeftRadius: radius.xl,
        borderTopRightRadius: radius.xl,
        shadowColor: '#142610',
        shadowOffset: { width: 0, height: -4 },
        shadowOpacity: 0.08,
        shadowRadius: 12,
        elevation: 8,
    },
    head: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        justifyContent: 'space-between',
        gap: spacing.md,
    },
    title: { fontSize: 18, fontWeight: '800', color: colors.text },
    sub: { fontSize: 13, color: colors.textMuted, marginTop: 2, lineHeight: 18 },
    messageLabel: { fontSize: 13, fontWeight: '700', color: colors.textMuted },
    input: {
        minHeight: 96,
        maxHeight: 140,
        borderRadius: radius.md,
        borderWidth: 1,
        borderColor: colors.border,
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.sm,
        fontSize: 15,
        color: colors.text,
        backgroundColor: colors.background,
    },
});
