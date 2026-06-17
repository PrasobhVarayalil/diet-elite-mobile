import { ChatsListHeader } from '@/components/messages/ChatsListHeader';
import { ComposeMessagePanel } from '@/components/messages/ComposeMessagePanel';
import type { MessageContact } from '@/components/messages/ContactPicker';
import { InboxSummaryStrip } from '@/components/messages/InboxSummaryStrip';
import { ThreadListItem, type ThreadListData } from '@/components/messages/ThreadListItem';
import { Button } from '@/components/ui/Button';
import { colors, spacing } from '@/constants/theme';
import { useAuth } from '@/src/context/auth-context';
import { useUnreadMessages } from '@/src/context/unread-messages-context';
import { useMessageRoutes } from '@/src/hooks/use-message-routes';
import { apiGet, apiPost } from '@/src/lib/api-client';
import { customerStartPath, resolveStartPath, startRequestBody } from '@/src/lib/message-routes';
import { APP_ROUTES, PLANS_LIST_HREF } from '@/src/lib/navigation';
import { customerNeedsActivePlan, isAdmin, isAdvisor, isCustomer, isDietitian } from '@/src/lib/user-access';
import { Ionicons } from '@expo/vector-icons';
import { Stack, useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import {
    ActivityIndicator,
    FlatList,
    Pressable,
    StyleSheet,
    Text,
    View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type Contact = MessageContact;

type InboxResponse = {
    threads?: ThreadListData[];
    new_contacts?: Contact[];
    unread_total?: number;
};

function ListDivider() {
    return <View style={styles.divider} />;
}

export default function MessagesScreen() {
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const { user } = useAuth();
    const { unreadTotal, setUnreadTotal, refreshUnread } = useUnreadMessages();
    const messageRoutes = useMessageRoutes(user);
    const indexPath = messageRoutes?.index ?? null;
    const dietitianView = isDietitian(user);
    const staffView = isAdmin(user) || isAdvisor(user);
    const customerView = isCustomer(user);
    const needsPlan = customerNeedsActivePlan(user);
    const [loading, setLoading] = useState(true);
    const [threads, setThreads] = useState<ThreadListData[]>([]);
    const [contacts, setContacts] = useState<Contact[]>([]);
    const [composeOpen, setComposeOpen] = useState(false);
    const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
    const [draft, setDraft] = useState('');
    const [sending, setSending] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const load = useCallback(async () => {
        if (needsPlan || !indexPath) {
            setLoading(false);
            return;
        }

        setLoading(true);
        const result = await apiGet<InboxResponse>(indexPath);
        if (result.ok && result.data) {
            setThreads(result.data.threads ?? []);
            const available = result.data.new_contacts ?? [];
            setContacts(available);
            setSelectedContact((current) => current ?? available[0] ?? null);
            const total = result.data.unread_total ?? 0;
            setUnreadTotal(total);
            setError(null);
        } else {
            setError(result.ok ? 'Could not load messages.' : result.message);
        }
        setLoading(false);
    }, [indexPath, needsPlan, setUnreadTotal]);

    useFocusEffect(
        useCallback(() => {
            void load();
            void refreshUnread();
        }, [load, refreshUnread]),
    );

    async function startChat() {
        if (!messageRoutes || !selectedContact?.id || !draft.trim()) {
            return;
        }

        const contactType = selectedContact.contact_type;
        const startPath =
            customerView && contactType === 'dietitian'
                ? customerStartPath()
                : resolveStartPath(messageRoutes, contactType, selectedContact.id);

        if (!startPath) {
            setError('Could not start this conversation.');
            return;
        }

        setSending(true);
        const result = await apiPost(
            startPath,
            startRequestBody(contactType, selectedContact.id, draft.trim()),
        );
        setSending(false);
        if (result.ok) {
            const threadId = (result.data as { thread_id?: string })?.thread_id;
            setDraft('');
            setComposeOpen(false);
            if (threadId) {
                router.push(APP_ROUTES.messageThread(threadId));
            } else {
                load();
            }
        } else {
            setError(result.message);
        }
    }

    if (!messageRoutes) {
        return (
            <View style={[styles.blocked, { paddingTop: insets.top }]}>
                <Text style={styles.blockedTitle}>Not available</Text>
                <Text style={styles.blockedHint}>Messaging is not available for your role on mobile.</Text>
            </View>
        );
    }

    if (needsPlan) {
        return (
            <View style={[styles.blocked, { paddingTop: insets.top }]}>
                <Text style={styles.blockedTitle}>Active plan required</Text>
                <Text style={styles.blockedHint}>Choose a diet plan to message your dietitian.</Text>
                <Button label="Browse plans" onPress={() => router.push(PLANS_LIST_HREF)} />
            </View>
        );
    }

    const showComposeFab = contacts.length > 0;
    const canStartChat = showComposeFab && !composeOpen;
    const headerTitle = dietitianView
        ? 'Client chats'
        : staffView
          ? 'Team messages'
          : 'Chats';

    return (
        <View style={styles.root}>
            <Stack.Screen options={{ headerShown: false }} />
            <ChatsListHeader
                onCompose={canStartChat ? () => setComposeOpen(true) : undefined}
                title={headerTitle}
                unreadTotal={unreadTotal}
            />

            {!loading && !error ? (
                <InboxSummaryStrip
                    contactCount={contacts.length}
                    threadCount={threads.length}
                    unreadTotal={unreadTotal}
                />
            ) : null}

            {loading ? (
                <View style={styles.center}>
                    <ActivityIndicator color={colors.brandDark} size="large" />
                </View>
            ) : error && threads.length === 0 && contacts.length === 0 ? (
                <View style={styles.errorOnly}>
                    <Text style={styles.error}>{error}</Text>
                    <Button label="Try again" onPress={() => load()} />
                </View>
            ) : (
                <FlatList
                    ItemSeparatorComponent={ListDivider}
                    contentContainerStyle={threads.length === 0 ? styles.emptyList : undefined}
                    data={threads}
                    keyboardShouldPersistTaps="handled"
                    keyExtractor={(item) => item.id}
                    ListEmptyComponent={
                        <View style={styles.empty}>
                            <Ionicons color={colors.textMuted} name="chatbubbles-outline" size={40} />
                            <Text style={styles.emptyTitle}>
                                {dietitianView ? 'No conversations yet' : 'Start chatting'}
                            </Text>
                            <Text style={styles.emptyHint}>
                                {dietitianView
                                    ? 'Use the compose button above or the + button to message a client or admin.'
                                    : staffView
                                      ? 'Use the compose button above to start a team conversation.'
                                      : contacts.length > 0
                                        ? 'Tap compose in the header or the + button to message your dietitian.'
                                        : 'Message your dietitian after you have an active plan and a booking or consultation.'}
                            </Text>
                            {canStartChat ? (
                                <View style={styles.emptyCta}>
                                    <Button label="New message" onPress={() => setComposeOpen(true)} />
                                </View>
                            ) : null}
                            {error ? <Button label="Try again" onPress={() => load()} variant="secondary" /> : null}
                        </View>
                    }
                    ListHeaderComponent={
                        error && threads.length > 0 ? (
                            <View style={styles.errorBanner}>
                                <Text style={styles.error}>{error}</Text>
                                <Button label="Retry" onPress={() => load()} variant="secondary" />
                            </View>
                        ) : null
                    }
                    renderItem={({ item }) => (
                        <ThreadListItem
                            fallbackName={dietitianView ? 'Client' : 'Dietitian'}
                            onPress={() => router.push(APP_ROUTES.messageThread(item.id))}
                            thread={item}
                        />
                    )}
                    style={styles.flex}
                />
            )}

            {composeOpen ? (
                <Pressable
                    accessibilityLabel="Close compose"
                    onPress={() => setComposeOpen(false)}
                    style={styles.backdrop}
                />
            ) : null}

            {composeOpen ? (
                <ComposeMessagePanel
                    contacts={contacts}
                    draft={draft}
                    onChangeDraft={setDraft}
                    onClose={() => setComposeOpen(false)}
                    onSelectContact={setSelectedContact}
                    onSend={startChat}
                    recipientLabel={dietitianView ? 'Client' : staffView ? 'Team member' : 'Dietitian'}
                    selectedContact={selectedContact}
                    sending={sending}
                />
            ) : null}

            {showComposeFab && !composeOpen ? (
                <Pressable
                    onPress={() => setComposeOpen(true)}
                    style={[styles.fab, { bottom: insets.bottom + spacing.lg }]}
                >
                    <Ionicons color={colors.white} name="create-outline" size={24} />
                </Pressable>
            ) : null}
        </View>
    );
}

const styles = StyleSheet.create({
    root: { flex: 1, backgroundColor: colors.background },
    flex: { flex: 1, minHeight: 0, backgroundColor: colors.card },
    center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
    divider: { height: StyleSheet.hairlineWidth, backgroundColor: colors.border, marginLeft: 76 },
    emptyList: { flexGrow: 1 },
    empty: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        padding: spacing.xl,
        gap: spacing.sm,
    },
    emptyTitle: { fontSize: 18, fontWeight: '700', color: colors.text, marginTop: spacing.sm },
    emptyHint: { fontSize: 14, color: colors.textMuted, textAlign: 'center', lineHeight: 20 },
    emptyCta: { marginTop: spacing.sm, width: '100%', maxWidth: 220 },
    error: { color: colors.error, padding: spacing.md, textAlign: 'center' },
    errorOnly: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        padding: spacing.lg,
        gap: spacing.md,
    },
    errorBanner: {
        padding: spacing.md,
        gap: spacing.sm,
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderBottomColor: colors.border,
        backgroundColor: '#fff5f5',
    },
    blocked: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        padding: spacing.lg,
        gap: spacing.md,
        backgroundColor: colors.background,
    },
    blockedTitle: { fontSize: 20, fontWeight: '700', color: colors.text },
    blockedHint: { fontSize: 14, color: colors.textMuted, textAlign: 'center' },
    backdrop: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(20, 38, 16, 0.45)',
        zIndex: 1,
    },
    fab: {
        position: 'absolute',
        right: spacing.lg,
        width: 52,
        height: 52,
        borderRadius: 26,
        backgroundColor: colors.brandDark,
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#142610',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 6,
        zIndex: 2,
    },
});
