import { ConversationAvatar } from '@/components/messages/ConversationAvatar';
import { colors, radius, spacing } from '@/constants/theme';
import { Ionicons } from '@expo/vector-icons';
import { useEffect, useMemo, useState } from 'react';
import {
    ActivityIndicator,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    View,
} from 'react-native';

export type SearchSelectItem = {
    id: string;
    label: string;
    meta?: string | null;
    /** Extra strings included when filtering (e.g. email, role). */
    keywords?: string[];
};

type Props = {
    items: SearchSelectItem[];
    selectedId: string | null;
    onSelect: (id: string) => void;
    onClear?: () => void;
    placeholder?: string;
    label?: string;
    emptyHint?: string;
    loading?: boolean;
    maxListHeight?: number;
};

function matchesQuery(item: SearchSelectItem, query: string): boolean {
    const haystack = [item.label, item.meta ?? '', ...(item.keywords ?? [])]
        .join(' ')
        .toLowerCase();
    return haystack.includes(query);
}

export function SearchSelect({
    items,
    selectedId,
    onSelect,
    onClear,
    placeholder = 'Search by name…',
    label = 'Select',
    emptyHint = 'No matches. Try another name.',
    loading = false,
    maxListHeight = 220,
}: Props) {
    const [query, setQuery] = useState('');
    const [expanded, setExpanded] = useState(() => items.length > 1 && !selectedId);

    useEffect(() => {
        if (selectedId) {
            setExpanded(false);
        }
    }, [selectedId]);

    const selected = items.find((item) => item.id === selectedId) ?? null;
    const normalized = query.trim().toLowerCase();
    const filtered = useMemo(() => {
        if (!normalized) {
            return items;
        }
        return items.filter((item) => matchesQuery(item, normalized));
    }, [items, normalized]);

    const showList = expanded && (!selected || normalized.length > 0);

    function pick(id: string) {
        onSelect(id);
        setQuery('');
        setExpanded(false);
    }

    function clearSelection() {
        onClear?.();
        setQuery('');
        setExpanded(true);
    }

    return (
        <View style={styles.wrap}>
            <Text style={styles.label}>{label}</Text>

            {selected && !showList ? (
                <View style={styles.selected}>
                    <ConversationAvatar name={selected.label} size="sm" />
                    <View style={styles.selectedText}>
                        <Text ellipsizeMode="tail" numberOfLines={1} style={styles.selectedName}>
                            {selected.label}
                        </Text>
                        {selected.meta ? (
                            <Text ellipsizeMode="tail" numberOfLines={1} style={styles.selectedMeta}>
                                {selected.meta}
                            </Text>
                        ) : null}
                    </View>
                    <Pressable hitSlop={8} onPress={clearSelection} style={styles.changeBtn}>
                        <Text style={styles.changeText}>Change</Text>
                    </Pressable>
                </View>
            ) : (
                <View style={styles.searchRow}>
                    <Ionicons color={colors.textMuted} name="search-outline" size={18} />
                    <TextInput
                        autoCapitalize="none"
                        autoCorrect={false}
                        onChangeText={setQuery}
                        placeholder={placeholder}
                        placeholderTextColor={colors.textMuted}
                        style={styles.input}
                        value={query}
                    />
                    {loading ? <ActivityIndicator color={colors.brandDark} size="small" /> : null}
                    {query.length > 0 ? (
                        <Pressable hitSlop={8} onPress={() => setQuery('')}>
                            <Ionicons color={colors.textMuted} name="close-circle" size={18} />
                        </Pressable>
                    ) : null}
                </View>
            )}

            {showList ? (
                <ScrollView
                    keyboardShouldPersistTaps="handled"
                    nestedScrollEnabled
                    style={[styles.list, { maxHeight: maxListHeight }]}
                >
                    {filtered.length === 0 ? (
                        <Text style={styles.empty}>{emptyHint}</Text>
                    ) : (
                        filtered.map((item) => {
                            const active = item.id === selectedId;
                            return (
                                <Pressable
                                    key={item.id}
                                    onPress={() => pick(item.id)}
                                    style={[styles.row, active && styles.rowActive]}
                                >
                                    <ConversationAvatar name={item.label} size="sm" />
                                    <View style={styles.rowText}>
                                        <Text ellipsizeMode="tail" numberOfLines={1} style={styles.rowName}>
                                            {item.label}
                                        </Text>
                                        {item.meta ? (
                                            <Text ellipsizeMode="tail" numberOfLines={1} style={styles.rowMeta}>
                                                {item.meta}
                                            </Text>
                                        ) : null}
                                    </View>
                                    {active ? (
                                        <Ionicons color={colors.brandDark} name="checkmark-circle" size={20} />
                                    ) : null}
                                </Pressable>
                            );
                        })
                    )}
                </ScrollView>
            ) : null}

            {items.length > 1 && !showList && selected ? (
                <Text style={styles.countHint}>{items.length} contacts available</Text>
            ) : null}
        </View>
    );
}

const styles = StyleSheet.create({
    wrap: { gap: spacing.sm },
    label: { fontSize: 13, fontWeight: '700', color: colors.textMuted },
    searchRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.sm,
        minHeight: 48,
        borderWidth: 1,
        borderColor: colors.border,
        borderRadius: radius.md,
        paddingHorizontal: spacing.md,
        backgroundColor: colors.background,
    },
    input: { flex: 1, fontSize: 15, color: colors.text, paddingVertical: spacing.sm },
    list: {
        borderWidth: 1,
        borderColor: colors.border,
        borderRadius: radius.md,
        backgroundColor: colors.background,
    },
    row: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.sm,
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.sm,
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderBottomColor: colors.border,
    },
    rowActive: { backgroundColor: colors.brandMuted },
    rowText: { flex: 1, minWidth: 0 },
    rowName: { fontSize: 15, fontWeight: '600', color: colors.text },
    rowMeta: { fontSize: 12, color: colors.textMuted, marginTop: 1 },
    empty: {
        padding: spacing.md,
        fontSize: 13,
        color: colors.textMuted,
        textAlign: 'center',
        fontStyle: 'italic',
    },
    selected: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.sm,
        padding: spacing.sm,
        borderRadius: radius.md,
        borderWidth: 1,
        borderColor: colors.border,
        backgroundColor: colors.background,
    },
    selectedText: { flex: 1, minWidth: 0 },
    selectedName: { fontSize: 15, fontWeight: '700', color: colors.text },
    selectedMeta: { fontSize: 12, color: colors.textMuted, marginTop: 2 },
    changeBtn: { paddingHorizontal: spacing.sm, paddingVertical: 4 },
    changeText: { fontSize: 13, fontWeight: '700', color: colors.brandDark },
    countHint: { fontSize: 11, color: colors.textMuted },
});
