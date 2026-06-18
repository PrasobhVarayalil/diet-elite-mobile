import { AppHeader } from '@/components/ui/AppHeader';
import { CustomerProgramGate } from '@/components/auth/CustomerProgramGate';
import { Button } from '@/components/ui/Button';
import { Card, SectionTitle } from '@/components/ui/Card';
import { BrandLoadingScreen } from '@/components/ui/BrandLoadingScreen';
import { colors, spacing } from '@/constants/theme';
import { useAuth } from '@/src/context/auth-context';
import { apiGet, apiPost } from '@/src/lib/api-client';
import { apiRoutes } from '@/src/lib/api-routes';
import { PLANS_LIST_HREF } from '@/src/lib/navigation';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

type CoachIndex = {
    health_summary?: {
        goal?: string | null;
        dietary_preference?: string | null;
        progress_entries?: number;
    };
    disclaimer?: string;
};

export default function AiCoachScreen() {
    const router = useRouter();
    const { user } = useAuth();
    const [loading, setLoading] = useState(true);
    const [index, setIndex] = useState<CoachIndex | null>(null);
    const [tips, setTips] = useState<string[]>([]);
    const [fetching, setFetching] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const load = useCallback(async () => {
        setLoading(true);
        const result = await apiGet<CoachIndex>(apiRoutes.aiCoach.index);
        if (result.ok && result.data) {
            setIndex(result.data);
        }
        setLoading(false);
    }, []);

    useEffect(() => {
        load();
    }, [load]);

    async function getTips() {
        setFetching(true);
        setError(null);
        const result = await apiPost<{ suggestions?: string[] }>(apiRoutes.aiCoach.suggest, {});
        setFetching(false);
        if (result.ok && result.data?.suggestions) {
            setTips(result.data.suggestions);
        } else {
            setError(result.ok ? 'Could not load tips.' : result.message);
        }
    }

    const summary = index?.health_summary;

    return (
        <CustomerProgramGate>
        <View style={styles.root}>
            <AppHeader subtitle="Personalized nutrition tips" title="AI coach" />
            {loading ? (
                <BrandLoadingScreen message="Loading AI coach…" />
            ) : (
                <ScrollView contentContainerStyle={styles.content}>
                    <Card tone="accent">
                        <SectionTitle>Your context</SectionTitle>
                        {summary?.goal ? <Text style={styles.body}>Goal: {summary.goal}</Text> : null}
                        {summary?.dietary_preference ? (
                            <Text style={styles.body}>Preference: {summary.dietary_preference}</Text>
                        ) : null}
                        <Text style={styles.body}>Progress entries: {summary?.progress_entries ?? 0}</Text>
                        {index?.disclaimer ? <Text style={styles.disclaimer}>{index.disclaimer}</Text> : null}
                    </Card>

                    <Button label="Get today's tips" loading={fetching} onPress={getTips} />
                    {error ? <Text style={styles.error}>{error}</Text> : null}

                    {tips.map((tip, i) => (
                        <Card key={i}>
                            <Text style={styles.tip}>{tip}</Text>
                        </Card>
                    ))}
                </ScrollView>
            )}
        </View>
        </CustomerProgramGate>
    );
}

const styles = StyleSheet.create({
    root: { flex: 1, backgroundColor: colors.background },
    content: { padding: spacing.lg, gap: spacing.md, paddingBottom: spacing.xl },
    body: { fontSize: 15, color: colors.textMuted, lineHeight: 22 },
    disclaimer: { fontSize: 12, color: colors.textMuted, marginTop: spacing.sm, fontStyle: 'italic' },
    tip: { fontSize: 15, color: colors.text, lineHeight: 22 },
    error: { color: colors.error },
    blocked: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.lg, gap: spacing.md },
    blockedTitle: { fontSize: 20, fontWeight: '700', color: colors.text },
});
