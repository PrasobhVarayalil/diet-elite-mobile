import { colors, radius, shadow, spacing } from '@/constants/theme';
import { StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export function useAdminListContentStyle() {
    const insets = useSafeAreaInsets();

    return {
        paddingHorizontal: spacing.lg,
        paddingTop: spacing.md,
        paddingBottom: spacing.xl + Math.max(insets.bottom, spacing.sm),
        flexGrow: 1,
    } as const;
}

export const adminListStyles = StyleSheet.create({
    root: {
        flex: 1,
        backgroundColor: colors.background,
    },
    actions: {
        paddingHorizontal: spacing.lg,
        paddingTop: spacing.md,
        paddingBottom: spacing.md,
    },
    separator: {
        height: spacing.md,
    },
    card: {
        backgroundColor: colors.card,
        borderRadius: radius.md,
        padding: spacing.lg,
        borderWidth: 1,
        borderColor: colors.border,
        gap: spacing.md,
        ...shadow.card,
    },
    cardBody: {
        gap: spacing.xs,
    },
    title: {
        fontSize: 17,
        fontWeight: '700',
        color: colors.text,
    },
    meta: {
        fontSize: 13,
        color: colors.textMuted,
        lineHeight: 18,
    },
    metaRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: spacing.sm,
        marginTop: spacing.xs,
    },
    row: {
        flexDirection: 'row',
        gap: spacing.sm,
        flexWrap: 'wrap',
    },
    empty: {
        textAlign: 'center',
        color: colors.textMuted,
        paddingVertical: spacing.xl,
        fontSize: 14,
    },
    error: {
        color: colors.error,
        marginBottom: spacing.md,
        fontSize: 14,
    },
    loading: {
        marginTop: spacing.xl,
    },
});
