import { AppHeader } from '@/components/ui/AppHeader';
import { BrandLoadingScreen } from '@/components/ui/BrandLoadingScreen';
import { Button } from '@/components/ui/Button';
import { DietitianGate } from '@/components/auth/DietitianGate';
import { TextField } from '@/components/ui/TextField';
import { colors, formatDateTime, spacing } from '@/constants/theme';
import { apiDelete, apiGet, apiPost } from '@/src/lib/api-client';
import { apiRoutes } from '@/src/lib/api-routes';
import { buildLeaveWindow } from '@/src/lib/leave-window';
import { useCallback, useEffect, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, View } from 'react-native';

type LeaveRecord = {
    id: string;
    starts_at: string;
    ends_at: string;
    status: string;
    status_label: string;
    reason?: string | null;
};

type PreviewData = {
    booking_count: number;
    range_label: string;
    affected_bookings: Array<{ id: string; scheduled_at: string; user?: { name: string } | null }>;
};

export default function DietitianLeaveScreen() {
    const [loading, setLoading] = useState(true);
    const [records, setRecords] = useState<LeaveRecord[]>([]);
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [reason, setReason] = useState('');
    const [preview, setPreview] = useState<PreviewData | null>(null);
    const [acting, setActing] = useState(false);

    const load = useCallback(async () => {
        setLoading(true);
        const result = await apiGet<{ leaveRecords?: LeaveRecord[] }>(apiRoutes.dietitian.leave.index);
        if (result.ok && result.data) {
            setRecords(result.data.leaveRecords ?? []);
        }
        setLoading(false);
    }, []);

    useEffect(() => {
        load();
    }, [load]);

    async function runPreview() {
        if (!startDate || !endDate) {
            Alert.alert('Dates required', 'Select from and to dates.');
            return;
        }
        setActing(true);
        const result = await apiPost<PreviewData>(
            apiRoutes.dietitian.leave.preview,
            buildLeaveWindow(startDate, endDate),
        );
        setActing(false);
        if (result.ok && result.data) {
            setPreview(result.data);
        } else {
            Alert.alert('Error', result.message);
        }
    }

    async function submit() {
        if (!startDate || !endDate) {
            return;
        }
        setActing(true);
        const result = await apiPost(apiRoutes.dietitian.leave.store, {
            ...buildLeaveWindow(startDate, endDate),
            reason: reason.trim() || null,
            action: 'cancel',
        });
        setActing(false);
        if (result.ok) {
            Alert.alert('Submitted', result.message ?? 'Leave request sent for approval.');
            setPreview(null);
            setStartDate('');
            setEndDate('');
            load();
        } else {
            Alert.alert('Error', result.message);
        }
    }

    async function withdraw(id: string) {
        setActing(true);
        const result = await apiDelete(apiRoutes.dietitian.leave.destroy(id));
        setActing(false);
        if (result.ok) {
            load();
        } else {
            Alert.alert('Error', result.message);
        }
    }

    return (
        <DietitianGate>
            {loading ? (
                <BrandLoadingScreen message="Loading leave…" />
            ) : (
                <View style={styles.root}>
                    <AppHeader
                        subtitle="Admin approval required before slots are blocked"
                        title="Request leave"
                    />
                    <ScrollView contentContainerStyle={styles.content}>
                        <TextField label="From date" onChangeText={setStartDate} placeholder="YYYY-MM-DD" value={startDate} />
                        <TextField label="To date" onChangeText={setEndDate} placeholder="YYYY-MM-DD" value={endDate} />
                        <TextField label="Reason" onChangeText={setReason} value={reason} />
                        <Button label="Preview appointments" loading={acting} onPress={() => void runPreview()} />

                        {preview ? (
                            <View style={styles.card}>
                                <Text style={styles.title}>
                                    {preview.booking_count} affected — {preview.range_label}
                                </Text>
                                {preview.affected_bookings.map((b) => (
                                    <Text key={b.id} style={styles.meta}>
                                        {b.user?.name ?? 'Client'} — {formatDateTime(b.scheduled_at)}
                                    </Text>
                                ))}
                                <Button label="Submit for approval" loading={acting} onPress={() => void submit()} />
                            </View>
                        ) : null}

                        <Text style={styles.section}>Your requests</Text>
                        {records.map((row) => (
                            <View key={row.id} style={styles.card}>
                                <Text style={styles.title}>{row.status_label}</Text>
                                <Text style={styles.meta}>
                                    {formatDateTime(row.starts_at)} – {formatDateTime(row.ends_at)}
                                </Text>
                                {row.status === 'pending_approval' ? (
                                    <Button
                                        label="Withdraw"
                                        loading={acting}
                                        onPress={() => void withdraw(row.id)}
                                        variant="secondary"
                                    />
                                ) : null}
                            </View>
                        ))}
                    </ScrollView>
                </View>
            )}
        </DietitianGate>
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
