import { ChatComposer } from '@/components/messages/ChatComposer';
import { ChatHeader } from '@/components/messages/ChatHeader';
import {
    MessageBubble,
    shouldShowAvatar,
    shouldShowTime,
} from '@/components/messages/MessageBubble';
import { colors, spacing } from '@/constants/theme';
import { useAuth } from '@/src/context/auth-context';
import { useUnreadMessages } from '@/src/context/unread-messages-context';
import { useMessageRoutes } from '@/src/hooks/use-message-routes';
import { apiGet, apiPost } from '@/src/lib/api-client';
import { keyboardAvoidingBehavior, useScreenInsets } from '@/src/lib/layout';
import { Stack, useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useRef, useState } from 'react';
import {
    ActivityIndicator,
    FlatList,
    KeyboardAvoidingView,
    Platform,
    StyleSheet,
    Text,
    View,
} from 'react-native';

type Message = {
    id: string;
    body: string;
    created_at: string;
    is_mine?: boolean;
    status?: 'sent' | 'delivered' | 'read' | null;
    delivered_at?: string | null;
    read_at?: string | null;
};

type ThreadResponse = {
    messages?: Message[];
    thread?: { counterpart?: { name: string; title?: string | null } };
};

export default function MessageThreadScreen() {
    const router = useRouter();
    const { user } = useAuth();
    const messageRoutes = useMessageRoutes(user);
    const { refreshUnread } = useUnreadMessages();
    const { threadId } = useLocalSearchParams<{ threadId: string }>();
    const { composerPaddingBottom, chatKeyboardOffset } = useScreenInsets();
    const [loading, setLoading] = useState(true);
    const [messages, setMessages] = useState<Message[]>([]);
    const [counterpartName, setCounterpartName] = useState('Chat');
    const [counterpartTitle, setCounterpartTitle] = useState<string | null>(null);
    const [draft, setDraft] = useState('');
    const [sending, setSending] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const listRef = useRef<FlatList<Message>>(null);

    const load = useCallback(
        async (silent = false) => {
            if (!threadId || !messageRoutes) {
                if (!silent) {
                    setLoading(false);
                }
                return;
            }

            if (!silent) {
                setLoading(true);
            }
            setError(null);
            const result = await apiGet<ThreadResponse>(messageRoutes.show(threadId));
            if (result.ok && result.data) {
                setMessages(result.data.messages ?? []);
                setCounterpartName(result.data.thread?.counterpart?.name ?? 'Chat');
                setCounterpartTitle(result.data.thread?.counterpart?.title ?? null);
                void refreshUnread();
            } else if (!silent) {
                setError(result.ok ? 'Could not load conversation.' : result.message);
            }
            if (!silent) {
                setLoading(false);
            }
        },
        [threadId, messageRoutes, refreshUnread],
    );

    useFocusEffect(
        useCallback(() => {
            void load(false);
            const interval = setInterval(() => {
                void load(true);
            }, 12000);

            return () => clearInterval(interval);
        }, [load]),
    );

    async function send() {
        if (!threadId || !draft.trim() || !messageRoutes) {
            return;
        }
        setSending(true);
        const result = await apiPost(messageRoutes.store(threadId), { body: draft.trim() });
        setSending(false);
        if (result.ok) {
            setDraft('');
            await load(false);
            listRef.current?.scrollToEnd({ animated: true });
        } else {
            setError(result.message);
        }
    }

    if (!messageRoutes) {
        return (
            <View style={styles.root}>
                <ChatHeader name="Chat" onBack={() => router.back()} />
                <Text style={styles.unavailable}>Messaging is not available for your role.</Text>
            </View>
        );
    }

    return (
        <View style={styles.root}>
            <Stack.Screen options={{ headerShown: false }} />
            <ChatHeader
                name={counterpartName}
                subtitle={counterpartTitle ?? 'End-to-end secure chat'}
                onBack={() => router.back()}
            />
            <KeyboardAvoidingView
                behavior={keyboardAvoidingBehavior()}
                keyboardVerticalOffset={Platform.OS === 'ios' ? chatKeyboardOffset : 0}
                style={styles.flex}
            >
                {loading ? (
                    <View style={styles.center}>
                        <ActivityIndicator color={colors.brandDark} />
                    </View>
                ) : error ? (
                    <Text style={styles.error}>{error}</Text>
                ) : (
                    <FlatList
                        ref={listRef}
                        contentContainerStyle={[styles.list, { paddingBottom: spacing.sm }]}
                        data={messages}
                        keyboardDismissMode="interactive"
                        keyboardShouldPersistTaps="handled"
                        keyExtractor={(item) => item.id}
                        ListEmptyComponent={
                            <Text style={styles.emptyHint}>Send a message to start the conversation.</Text>
                        }
                        onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: false })}
                        renderItem={({ item, index }) => (
                            <MessageBubble
                                counterpartName={counterpartName}
                                message={item}
                                showAvatar={shouldShowAvatar(messages, index)}
                                showTime={shouldShowTime(messages, index)}
                            />
                        )}
                        style={styles.flex}
                    />
                )}
                <View style={[styles.composerWrap, { paddingBottom: composerPaddingBottom }]}>
                    <ChatComposer
                        onChangeText={setDraft}
                        onSend={send}
                        sending={sending}
                        value={draft}
                    />
                </View>
            </KeyboardAvoidingView>
        </View>
    );
}

const styles = StyleSheet.create({
    root: { flex: 1, backgroundColor: '#e8efe4' },
    flex: { flex: 1, minHeight: 0 },
    center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
    list: { paddingVertical: spacing.sm, flexGrow: 1 },
    composerWrap: {
        borderTopWidth: StyleSheet.hairlineWidth,
        borderTopColor: colors.border,
        backgroundColor: colors.card,
        paddingTop: spacing.xs,
    },
    emptyHint: {
        textAlign: 'center',
        color: colors.textMuted,
        fontSize: 13,
        marginTop: spacing.xl,
        paddingHorizontal: spacing.lg,
    },
    unavailable: { textAlign: 'center', marginTop: 40, color: colors.textMuted, padding: spacing.lg },
    error: { color: colors.error, textAlign: 'center', marginTop: 40, paddingHorizontal: spacing.lg },
});
