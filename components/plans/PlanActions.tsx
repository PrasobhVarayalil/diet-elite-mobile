import { Button } from '@/components/ui/Button';
import { colors, formatInrFromPaise, spacing } from '@/constants/theme';
import {
    type CurrentEnrollment,
    type PlanActionOptions,
    type PlanCustomerActions,
    planActionState,
    planActionStateFromApi,
} from '@/src/lib/customer-plan-actions';
import type { PlanSummary } from '@/src/types/plans';
import type { CheckoutIntent } from '@/src/types/checkout';
import { StyleSheet, Text, View } from 'react-native';

type PlanActionsProps = {
    plan: PlanSummary;
    currentEnrollment?: CurrentEnrollment | null;
    options?: PlanActionOptions;
    onCheckout: (intent: CheckoutIntent) => void;
    onViewDetails?: () => void;
    compact?: boolean;
};

export function PlanActions({
    plan,
    currentEnrollment,
    options,
    onCheckout,
    onViewDetails,
    compact = false,
}: PlanActionsProps) {
    const actions = plan.actions
        ? planActionStateFromApi(plan.actions)
        : planActionState(plan.id, currentEnrollment, options);
    const quote = plan.upgrade_quote;
    const blockedReason = plan.actions?.blocked_reason ?? null;

    return (
        <View style={styles.wrap}>
            {onViewDetails ? (
                <Button label="View details" onPress={onViewDetails} variant="secondary" />
            ) : null}

            {actions.showBuy ? (
                <Button label="Buy plan" onPress={() => onCheckout('buy')} />
            ) : null}

            {actions.showUpgrade && quote ? (
                <View style={styles.upgradeBlock}>
                    {(quote.carried_over_days ?? 0) > 0 ? (
                        <Text style={styles.carryOver}>
                            +{quote.carried_over_days} unused day
                            {quote.carried_over_days === 1 ? '' : 's'} carry over
                        </Text>
                    ) : null}
                    {quote.discount_percent > 0 ? (
                        <Text style={styles.save}>
                            Save {quote.discount_percent}% ({formatInrFromPaise(quote.you_save_paise)})
                        </Text>
                    ) : null}
                    <Button
                        label={`Upgrade · ${formatInrFromPaise(quote.total_paise)}`}
                        onPress={() => onCheckout('upgrade')}
                    />
                </View>
            ) : null}

            {actions.showUpgrade && !quote ? (
                <Text style={styles.hint}>
                    {blockedReason ?? 'Upgrade not available for this plan tier.'}
                </Text>
            ) : null}

            {actions.showRenew ? (
                <Button label="Renew plan" onPress={() => onCheckout('renew')} />
            ) : null}

            {!actions.showBuy && !actions.showUpgrade && !actions.showRenew && !actions.isCurrent && blockedReason ? (
                <Text style={styles.hint}>{blockedReason}</Text>
            ) : null}

            {actions.isCurrent && !actions.showRenew ? (
                <View style={styles.enrolled}>
                    <Text style={styles.enrolledText}>Your current plan</Text>
                </View>
            ) : null}

            {!compact && actions.isCurrent && actions.showRenew ? (
                <Text style={styles.hint}>Renewal window is open for your plan.</Text>
            ) : null}
        </View>
    );
}

const styles = StyleSheet.create({
    wrap: { gap: spacing.sm, marginTop: spacing.sm },
    upgradeBlock: { gap: 4 },
    carryOver: { fontSize: 12, fontWeight: '600', color: colors.chart5, textAlign: 'center' },
    save: { fontSize: 12, color: colors.textMuted, textAlign: 'center' },
    hint: { fontSize: 13, color: colors.textMuted, textAlign: 'center' },
    enrolled: {
        paddingVertical: spacing.sm,
        paddingHorizontal: spacing.md,
        borderRadius: 12,
        backgroundColor: colors.successBg,
        borderWidth: 1,
        borderColor: colors.chart2,
        alignItems: 'center',
    },
    enrolledText: { fontSize: 14, fontWeight: '700', color: colors.success },
});
