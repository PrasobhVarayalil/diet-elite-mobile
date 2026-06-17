import { ConversationAvatar } from '@/components/messages/ConversationAvatar';
import { UnreadBadge } from '@/components/messages/UnreadBadge';
import { colors, spacing } from '@/constants/theme';
import { formatMessengerTime } from '@/src/lib/messenger-time';
import { Pressable, StyleSheet, Text, View } from 'react-native';

export type ThreadListData = {
    id: string;
    counterpart?: { id: string; name: string; title?: string | null };
    last_message_preview?: string | null;
    last_message_at?: string | null;
    last_message_is_mine?: boolean;
    unread_count?: number;
};

type Props = {
    thread: ThreadListData;
    fallbackName?: string;
    onPress: () => void;
};

export function ThreadListItem({ thread, fallbackName = 'Chat', onPress }: Props) {
    const name = thread.counterpart?.name ?? fallbackName;
    const unread = thread.unread_count ?? 0;
    const hasUnread = unread > 0;
    const preview = thread.last_message_preview
        ? thread.last_message_is_mine
            ? `You: ${thread.last_message_preview}`
            : thread.last_message_preview
        : 'No messages yet';

    return (
        <Pressable onPress={onPress} style={({ pressed }) => [styles.row, pressed && styles.pressed]}>
            <ConversationAvatar name={name} size="md" />
            <View style={styles.body}>
                <View style={styles.top}>
                    <Text
                        ellipsizeMode="tail"
                        numberOfLines={1}
                        style={[styles.name, hasUnread && styles.nameUnread]}
                    >
                        {name}
                    </Text>
                    {thread.last_message_at ? (
                        <Text style={[styles.time, hasUnread && styles.timeUnread]}>
                            {formatMessengerTime(thread.last_message_at)}
                        </Text>
                    ) : null}
                </View>
                <View style={styles.bottom}>
                    <Text
                        ellipsizeMode="tail"
                        numberOfLines={1}
                        style={[styles.preview, hasUnread && styles.previewUnread]}
                    >
                        {preview}
                    </Text>
                    <UnreadBadge count={unread} size="sm" />
                </View>
            </View>
        </Pressable>
    );
}

const styles = StyleSheet.create({
    row: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.md,
        paddingVertical: 10,
        paddingHorizontal: spacing.lg,
        backgroundColor: colors.card,
    },
    pressed: { backgroundColor: colors.brandMuted },
    body: { flex: 1, minWidth: 0, gap: 2 },
    top: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
    bottom: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
    name: { flex: 1, fontSize: 16, fontWeight: '600', color: colors.text },
    nameUnread: { fontWeight: '800' },
    time: { fontSize: 12, color: colors.textMuted, flexShrink: 0 },
    timeUnread: { color: colors.brandDark, fontWeight: '700' },
    preview: { flex: 1, fontSize: 14, color: colors.textMuted, lineHeight: 18 },
    previewUnread: { color: colors.text, fontWeight: '600' },
});
