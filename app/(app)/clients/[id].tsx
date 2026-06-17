import { AppHeader } from '@/components/ui/AppHeader';
import { BookingStatusBadge } from '@/components/bookings/BookingStatusBadge';
import { Badge } from '@/components/ui/Badge';
import { colors, formatDateTime, spacing } from '@/constants/theme';
import { apiGet } from '@/src/lib/api-client';
import { apiRoutes } from '@/src/lib/api-routes';
import type { BookingListItem } from '@/src/types/bookings';
import { Stack, useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native';

type ClientDetail = {
    client?: {
        id: string;
        name: string;
        email?: string;
        member_code?: string;
        health_complete?: boolean;
    };
    appointments?: BookingListItem[];
};

export default function ClientShowScreen() {
    const { id } = useLocalSearchParams<{ id: string }>();
    const [loading, setLoading] = useState(true);
    const [data, setData] = useState<ClientDetail | null>(null);

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

    if (loading) {
        return <ActivityIndicator color={colors.brandDark} style={{ marginTop: 40 }} />;
    }

    const client = data?.client;

    return (
        <View style={styles.root}>
            <Stack.Screen options={{ headerShown: false }} />
            <AppHeader subtitle={client?.email ?? client?.member_code ?? ''} title={client?.name ?? 'Client'} />
            <ScrollView contentContainerStyle={styles.content}>
                {client ? (
                    <Badge
                        label={client.health_complete ? 'Health profile complete' : 'Health profile incomplete'}
                        tone={client.health_complete ? 'success' : 'warning'}
                    />
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
    section: { fontSize: 16, fontWeight: '700', color: colors.text, marginTop: spacing.md },
    card: {
        backgroundColor: colors.card,
        borderRadius: 12,
        padding: spacing.md,
        borderWidth: 1,
        borderColor: colors.border,
    },
    when: { fontSize: 15, fontWeight: '600', color: colors.text },
    meta: { fontSize: 13, color: colors.textMuted },
});
