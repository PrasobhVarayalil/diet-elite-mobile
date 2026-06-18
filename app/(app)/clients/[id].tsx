import { DietitianGate } from '@/components/auth/DietitianGate';
import { AppHeader } from '@/components/ui/AppHeader';
import { BrandLoadingScreen } from '@/components/ui/BrandLoadingScreen';
import { BookingStatusBadge } from '@/components/bookings/BookingStatusBadge';
import { ChartCard } from '@/components/charts/ChartCard';
import { MiniBarChart } from '@/components/charts/MiniBarChart';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { TextField } from '@/components/ui/TextField';
import { colors, formatDateTime, spacing } from '@/constants/theme';
import { useAuth } from '@/src/context/auth-context';
import { apiGet, apiPost } from '@/src/lib/api-client';
import { apiRoutes } from '@/src/lib/api-routes';
import { messageRoutesFor, startRequestBody } from '@/src/lib/message-routes';
import { APP_ROUTES } from '@/src/lib/navigation';
import type { BookingListItem } from '@/src/types/bookings';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

type ClientContext = {
    user: {
        id: string;
        name: string;
        email?: string;
        member_code?: string;
        phone?: string;
    };
    health_profile?: {
        height_cm?: number | null;
        weight_kg?: number | null;
        goal_weight_kg?: number | null;
        completed_at?: string | null;
    } | null;
};

type ClientDetail = {
    client?: ClientContext;
    weightTrend?: { date: string; weight: number }[];
    messageThreadId?: string | null;
    appointments?: BookingListItem[];
};

export default function ClientShowScreen() {
    return (
        <DietitianGate>
            <ClientShowContent />
        </DietitianGate>
    );
}

function ClientShowContent() {
    const { id } = useLocalSearchParams<{ id: string }>();
    const router = useRouter();
    const { user } = useAuth();
    const messageRoutes = messageRoutesFor(user);
    const [loading, setLoading] = useState(true);
    const [data, setData] = useState<ClientDetail | null>(null);
    const [composing, setComposing] = useState(false);
    const [draft, setDraft] = useState('');
    const [sending, setSending] = useState(false);
    const [composeError, setComposeError] = useState<string | null>(null);

    const load = useCallback(async () => {
        if (!id) {
            return;
        }
        setLoading(true);
        const result = await apiGet<ClientDetail>(apiRoutes.dietitian.clientShow(id));
        if (result.ok && result.data) {
            setData(result.data);
        }
        setLoading(false);
    }, [id]);

    useEffect(() => {
        load();
    }, [load]);

    async function openMessages() {
        if (data?.messageThreadId) {
            router.push(APP_ROUTES.messageThread(data.messageThreadId));
            return;
        }
        setComposing(true);
    }

    async function sendFirstMessage() {
        const body = draft.trim();
        if (!body || !id || !messageRoutes?.startClinical) {
            return;
        }
        setSending(true);
        setComposeError(null);
        const result = await apiPost(
            messageRoutes.startClinical(id),
            startRequestBody('client', id, body),
        );
        setSending(false);
        if (!result.ok) {
            setComposeError(result.message);
            return;
        }
        const threadId = (result.data as { thread_id?: string })?.thread_id;
        setComposing(false);
        setDraft('');
        if (threadId) {
            router.push(APP_ROUTES.messageThread(threadId));
        } else {
            load();
        }
    }

    if (loading) {
        return <BrandLoadingScreen message="Loading client…" />;
    }

    const clientUser = data?.client?.user;
    const health = data?.client?.health_profile;
    const healthComplete = Boolean(health?.completed_at);
    const weightChart = (data?.weightTrend ?? []).map((point) => ({
        label: point.date.slice(5),
        value: point.weight,
    }));

    return (
        <View style={styles.root}>
            <Stack.Screen options={{ headerShown: false }} />
            <AppHeader
                subtitle={
                    clientUser?.member_code
                        ? `${clientUser.member_code} · ${clientUser.email ?? ''}`
                        : (clientUser?.email ?? '')
                }
                title={clientUser?.name ?? 'Client'}
            />
            <ScrollView contentContainerStyle={styles.content}>
                {clientUser ? (
                    <Badge
                        label={healthComplete ? 'Health profile complete' : 'Health profile incomplete'}
                        tone={healthComplete ? 'success' : 'warning'}
                    />
                ) : null}

                {clientUser ? (
                    <View style={styles.actions}>
                        <Button
                            label={data?.messageThreadId ? 'Open messages' : 'Message client'}
                            onPress={() => void openMessages()}
                            variant="secondary"
                        />
                    </View>
                ) : null}

                {composing && !data?.messageThreadId ? (
                    <View style={styles.compose}>
                        <Text style={styles.section}>Start a conversation</Text>
                        <TextField
                            label="Message"
                            multiline
                            numberOfLines={4}
                            onChangeText={setDraft}
                            placeholder="Write your first message…"
                            value={draft}
                        />
                        {composeError ? <Text style={styles.error}>{composeError}</Text> : null}
                        <Button label="Send" loading={sending} onPress={() => void sendFirstMessage()} />
                        <Button label="Cancel" onPress={() => setComposing(false)} variant="secondary" />
                    </View>
                ) : null}

                {health ? (
                    <View style={styles.healthCard}>
                        <Text style={styles.section}>Health snapshot</Text>
                        {health.height_cm != null ? (
                            <Text style={styles.meta}>Height: {health.height_cm} cm</Text>
                        ) : null}
                        {health.weight_kg != null ? (
                            <Text style={styles.meta}>Weight: {health.weight_kg} kg</Text>
                        ) : null}
                        {health.goal_weight_kg != null ? (
                            <Text style={styles.meta}>Goal: {health.goal_weight_kg} kg</Text>
                        ) : null}
                    </View>
                ) : null}

                {weightChart.length > 0 ? (
                    <ChartCard colorIndex={1} subtitle="Recent weigh-ins" title="Weight trend">
                        <MiniBarChart colorIndex={1} data={weightChart} valueSuffix=" kg" />
                    </ChartCard>
                ) : null}

                <Text style={styles.section}>Recent appointments</Text>
                {(data?.appointments ?? []).map((appt) => (
                    <View key={appt.id} style={styles.card}>
                        <Text style={styles.when}>{formatDateTime(appt.scheduled_at)}</Text>
                        <BookingStatusBadge status={appt.status} />
                    </View>
                ))}
                {(data?.appointments?.length ?? 0) === 0 ? (
                    <Text style={styles.meta}>No appointments on record.</Text>
                ) : null}
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    root: { flex: 1, backgroundColor: colors.background },
    content: { padding: spacing.lg, gap: spacing.sm },
    actions: { marginTop: spacing.sm },
    compose: { gap: spacing.sm, marginTop: spacing.sm },
    healthCard: {
        backgroundColor: colors.card,
        borderRadius: 12,
        padding: spacing.md,
        borderWidth: 1,
        borderColor: colors.border,
        gap: 4,
        marginTop: spacing.sm,
    },
    section: { fontSize: 16, fontWeight: '700', color: colors.text, marginTop: spacing.md },
    card: {
        backgroundColor: colors.card,
        borderRadius: 12,
        padding: spacing.md,
        borderWidth: 1,
        borderColor: colors.border,
        gap: 4,
    },
    when: { fontSize: 15, fontWeight: '600', color: colors.text },
    meta: { fontSize: 13, color: colors.textMuted },
    error: { color: colors.error, fontSize: 13 },
});
