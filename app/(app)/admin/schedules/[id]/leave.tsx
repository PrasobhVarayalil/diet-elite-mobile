import { AppHeader } from '@/components/ui/AppHeader';
import { BrandLoadingScreen } from '@/components/ui/BrandLoadingScreen';
import { Button } from '@/components/ui/Button';
import { TextField } from '@/components/ui/TextField';
import { colors, formatDateTime, spacing } from '@/constants/theme';
import { apiDelete, apiGet, apiPost } from '@/src/lib/api-client';
import { apiRoutes } from '@/src/lib/api-routes';
import { buildLeaveWindow } from '@/src/lib/leave-window';
import { appHref } from '@/src/lib/navigation';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, View } from 'react-native';

type LeaveRecord = {
    id: string;
    starts_at: string;
    ends_at: string;
    reason?: string | null;
    status: string;
    status_label: string;
};

type PreviewData = {
    range_label: string;
    booking_count: number;
    affected_bookings: Array<{
        id: string;
        scheduled_at: string;
        user?: { name: string } | null;
    }>;
};

export default function AdminMarkLeaveScreen() {
    const router = useRouter();
    const { id } = useLocalSearchParams<{ id: string }>();
    const [loading, setLoading] = useState(true);
    const [name, setName] = useState('');
    const [records, setRecords] = useState<LeaveRecord[]>([]);
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [reason, setReason] = useState('');
    const [preview, setPreview] = useState<PreviewData | null>(null);
    const [acting, setActing] = useState(false);

    const load = useCallback(async () => {
        if (!id) {
            return;
        }
        setLoading(true);
        const result = await apiGet<{ dietitian?: { name?: string }; leaveRecords?: LeaveRecord[] }>(
            apiRoutes.admin.schedules.leave.show(id),
        );
        if (result.ok && result.data) {
            setName(result.data.dietitian?.name ?? '');
            setRecords(result.data.leaveRecords ?? []);
        }
        setLoading(false);
    }, [id]);

    useEffect(() => {
        load();
    }, [load]);

    async function runPreview() {
        if (!id || !startDate || !endDate) {
            Alert.alert('Dates required', 'Select from and to dates.');
            return;
        }
        setActing(true);
        const window = buildLeaveWindow(startDate, endDate);
        const result = await apiPost<PreviewData>(apiRoutes.admin.schedules.leave.preview(id), window);
        setActing(false);
        if (result.ok && result.data) {
            setPreview(result.data);
        } else {
            Alert.alert('Error', result.message);
        }
    }

    async function confirmLeave() {
        if (!id || !startDate || !endDate) {
            return;
        }
        setActing(true);
        const result = await apiPost(apiRoutes.admin.schedules.leave.store(id), {
            ...buildLeaveWindow(startDate, endDate),
            reason: reason.trim() || null,
            action: 'cancel',
        });
        setActing(false);
        if (result.ok) {
            Alert.alert('Done', result.message ?? 'Leave recorded.', [{ text: 'OK', onPress: () => router.back() }]);
        } else {
            Alert.alert('Error', result.message);
        }
    }

    async function approveLeave(leaveId: string) {
        setActing(true);
        const result = await apiPost(apiRoutes.admin.schedules.leave.approve(leaveId), { action: 'cancel' });
        setActing(false);
        if (result.ok) {
            load();
        } else {
            Alert.alert('Error', result.message);
        }
    }

    if (loading) {
        return <BrandLoadingScreen message="Loading leave…" />;
    }

    return (
        <View style={styles.root}>
            <Stack.Screen options={{ headerShown: false }} />
            <AppHeader subtitle="Block dates & handle appointments" title={name ? `Leave — ${name}` : 'Mark leave'} />
            <ScrollView contentContainerStyle={styles.content}>
                <TextField label="From date (YYYY-MM-DD)" onChangeText={setStartDate} placeholder="2026-06-20" value={startDate} />
                <TextField label="To date (YYYY-MM-DD)" onChangeText={setEndDate} placeholder="2026-06-20" value={endDate} />
                <TextField label="Reason (optional)" onChangeText={setReason} value={reason} />
                <Button label="Preview affected appointments" loading={acting} onPress={() => void runPreview()} />

                {preview ? (
                    <View style={styles.card}>
                        <Text style={styles.title}>
                            {preview.booking_count} appointment(s) — {preview.range_label}
                        </Text>
                        {preview.affected_bookings.map((b) => (
                            <Text key={b.id} style={styles.meta}>
                                {b.user?.name ?? 'Customer'} — {formatDateTime(b.scheduled_at)}
                            </Text>
                        ))}
                        <Button label="Confirm leave & cancel bookings" loading={acting} onPress={() => void confirmLeave()} />
                    </View>
                ) : null}

                <Text style={styles.section}>Pending & recent</Text>
                {records.length === 0 ? (
                    <Text style={styles.meta}>No leave blocks yet.</Text>
                ) : (
                    records.map((row) => (
                        <View key={row.id} style={styles.card}>
                            <Text style={styles.title}>{row.status_label}</Text>
                            <Text style={styles.meta}>
                                {formatDateTime(row.starts_at)} – {formatDateTime(row.ends_at)}
                            </Text>
                            {row.status === 'pending_approval' ? (
                                <Button
                                    label="Approve"
                                    loading={acting}
                                    onPress={() => void approveLeave(row.id)}
                                    variant="secondary"
                                />
                            ) : null}
                        </View>
                    ))
                )}
                <Button label="Back to shifts" onPress={() => router.push(appHref(`/(app)/admin/schedules/${id}`))} variant="secondary" />
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
        gap: spacing.xs,
    },
    title: { fontSize: 15, fontWeight: '600', color: colors.text },
    meta: { fontSize: 13, color: colors.textMuted },
});
