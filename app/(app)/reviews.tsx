import { AppHeader } from '@/components/ui/AppHeader';
import { CustomerProgramGate } from '@/components/auth/CustomerProgramGate';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { TextField } from '@/components/ui/TextField';
import { colors, spacing } from '@/constants/theme';
import { useAuth } from '@/src/context/auth-context';
import { apiGet, apiPost } from '@/src/lib/api-client';
import { apiRoutes } from '@/src/lib/api-routes';
import { APP_ROUTES } from '@/src/lib/navigation';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

type ReviewItem = {
    dietitian: {
        id: string;
        name: string;
        title?: string | null;
        completed_sessions?: number;
    };
    review?: { rating?: number; review?: string | null } | null;
    can_review?: boolean;
};

export default function ReviewsScreen() {
    const router = useRouter();
    const { user } = useAuth();
    const [loading, setLoading] = useState(true);
    const [items, setItems] = useState<ReviewItem[]>([]);
    const [error, setError] = useState<string | null>(null);
    const [activeId, setActiveId] = useState<string | null>(null);
    const [rating, setRating] = useState('5');
    const [text, setText] = useState('');
    const [saving, setSaving] = useState(false);

    const load = useCallback(async () => {
        setLoading(true);
        const result = await apiGet<{ items?: ReviewItem[] }>(apiRoutes.reviews.index);
        if (result.ok && result.data) {
            setItems(result.data.items ?? []);
            setError(null);
        } else {
            setError(result.ok ? 'No dietitians to review yet.' : result.message);
        }
        setLoading(false);
    }, []);

    useEffect(() => {
        load();
    }, [load]);

    async function submit(dietitianId: string) {
        setSaving(true);
        const result = await apiPost(apiRoutes.reviews.store, {
            dietitian_id: dietitianId,
            rating: Number(rating),
            review: text.trim() || null,
        });
        setSaving(false);
        if (result.ok) {
            setActiveId(null);
            setText('');
            load();
        } else {
            setError(result.message);
        }
    }

    return (
        <CustomerProgramGate>
        <View style={styles.root}>
            <AppHeader subtitle="Rate your dietitians" title="Reviews" />
            {loading ? (
                <ActivityIndicator color={colors.brandDark} style={{ marginTop: 40 }} />
            ) : (
                <ScrollView contentContainerStyle={styles.content}>
                    {error ? <Text style={styles.error}>{error}</Text> : null}
                    {items.length === 0 ? (
                        <Text style={styles.empty}>Complete a consultation to leave a review.</Text>
                    ) : null}
                    {items.map((item) => (
                        <Card key={item.dietitian.id}>
                            <Text style={styles.name}>{item.dietitian.name}</Text>
                            {item.dietitian.title ? <Text style={styles.meta}>{item.dietitian.title}</Text> : null}
                            <Text style={styles.meta}>
                                {item.dietitian.completed_sessions ?? 0} completed sessions
                            </Text>
                            {item.review?.rating ? (
                                <Text style={styles.rating}>Your rating: {item.review.rating}/5</Text>
                            ) : null}
                            {item.review?.review ? <Text style={styles.body}>{item.review.review}</Text> : null}
                            {activeId === item.dietitian.id ? (
                                <View style={styles.form}>
                                    <TextField
                                        keyboardType="numeric"
                                        label="Rating (1-5)"
                                        onChangeText={setRating}
                                        value={rating}
                                    />
                                    <TextField label="Review (optional)" multiline onChangeText={setText} value={text} />
                                    <Button label="Submit review" loading={saving} onPress={() => submit(item.dietitian.id)} />
                                    <Button label="Cancel" onPress={() => setActiveId(null)} variant="secondary" />
                                </View>
                            ) : (
                                <Pressable onPress={() => setActiveId(item.dietitian.id)} style={styles.link}>
                                    <Text style={styles.linkText}>
                                        {item.review ? 'Update review' : 'Write a review'}
                                    </Text>
                                </Pressable>
                            )}
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
    name: { fontSize: 18, fontWeight: '700', color: colors.text },
    meta: { fontSize: 13, color: colors.textMuted },
    rating: { fontSize: 15, fontWeight: '600', color: colors.chart1, marginTop: spacing.sm },
    body: { fontSize: 14, color: colors.textMuted, marginTop: 4 },
    form: { marginTop: spacing.md, gap: spacing.sm },
    link: { marginTop: spacing.sm },
    linkText: { color: colors.brandDark, fontWeight: '600', fontSize: 15 },
    empty: { color: colors.textMuted, textAlign: 'center' },
    error: { color: colors.error },
    blocked: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.lg, gap: spacing.md },
    blockedTitle: { fontSize: 20, fontWeight: '700', color: colors.text },
});
