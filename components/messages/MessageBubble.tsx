import { MessageReceiptTicks } from '@/components/messages/MessageReceiptTicks';
import { ConversationAvatar } from '@/components/messages/ConversationAvatar';
import { colors, spacing } from '@/constants/theme';
import { formatBubbleTime } from '@/src/lib/messenger-time';
import { StyleSheet, Text, View } from 'react-native';

type Message = {
    id: string;
    body: string;
    created_at: string;
    is_mine?: boolean;
    status?: 'sent' | 'delivered' | 'read' | null;
    delivered_at?: string | null;
    read_at?: string | null;
};

type Props = {
    message: Message;
    counterpartName: string;
    showAvatar: boolean;
    showTime: boolean;
};

export function MessageBubble({ message, counterpartName, showAvatar, showTime }: Props) {
    const mine = message.is_mine === true;

    return (
        <View style={[styles.row, mine ? styles.rowMine : styles.rowTheirs]}>
            {!mine && showAvatar ? (
                <ConversationAvatar name={counterpartName} size="sm" style={styles.avatar} />
            ) : !mine ? (
                <View style={styles.avatarSpacer} />
            ) : null}
            <View style={[styles.bubble, mine ? styles.bubbleMine : styles.bubbleTheirs]}>
                <Text style={[styles.body, mine && styles.bodyMine]}>{message.body}</Text>
                {showTime || mine ? (
                    <View style={styles.metaRow}>
                        {showTime ? (
                            <Text style={[styles.time, mine && styles.timeMine]}>
                                {formatBubbleTime(message.created_at)}
                            </Text>
                        ) : (
                            <View />
                        )}
                        {mine ? (
                            <MessageReceiptTicks
                                deliveredAt={message.delivered_at}
                                onDark={mine}
                                readAt={message.read_at}
                                status={message.status}
                            />
                        ) : null}
                    </View>
                ) : null}
            </View>
        </View>
    );
}

/** Group consecutive messages from same sender — hide avatar/time on middle bubbles. */
export function shouldShowAvatar(messages: Message[], index: number): boolean {
    const current = messages[index];
    if (current.is_mine) {
        return false;
    }
    const next = messages[index + 1];
    return !next || next.is_mine !== current.is_mine;
}

export function shouldShowTime(messages: Message[], index: number): boolean {
    const current = messages[index];
    if (current.is_mine) {
        return true;
    }
    const next = messages[index + 1];
    if (!next) {
        return true;
    }
    if (next.is_mine !== current.is_mine) {
        return true;
    }
    const gap = new Date(next.created_at).getTime() - new Date(current.created_at).getTime();
    return gap > 5 * 60 * 1000;
}

const styles = StyleSheet.create({
    row: {
        flexDirection: 'row',
        alignItems: 'flex-end',
        marginBottom: 2,
        paddingHorizontal: spacing.sm,
    },
    rowMine: { justifyContent: 'flex-end' },
    rowTheirs: { justifyContent: 'flex-start' },
    avatar: { marginRight: 4, marginBottom: 2 },
    avatarSpacer: { width: 36, marginRight: 4 },
    bubble: {
        maxWidth: '78%',
        paddingHorizontal: 12,
        paddingVertical: 8,
    },
    bubbleMine: {
        backgroundColor: colors.brandDark,
        borderTopLeftRadius: 16,
        borderTopRightRadius: 16,
        borderBottomLeftRadius: 16,
        borderBottomRightRadius: 4,
    },
    bubbleTheirs: {
        backgroundColor: colors.card,
        borderWidth: 1,
        borderColor: colors.border,
        borderTopLeftRadius: 16,
        borderTopRightRadius: 16,
        borderBottomLeftRadius: 4,
        borderBottomRightRadius: 16,
    },
    body: { fontSize: 15, lineHeight: 20, color: colors.text },
    bodyMine: { color: colors.white },
    metaRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'flex-end',
        gap: 4,
        marginTop: 4,
    },
    time: {
        fontSize: 10,
        color: colors.textMuted,
    },
    timeMine: { color: 'rgba(255,255,255,0.72)' },
});
