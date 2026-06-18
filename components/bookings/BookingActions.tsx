import { Button } from '@/components/ui/Button';
import { spacing } from '@/constants/theme';
import type { BookingListItem } from '@/src/types/bookings';
import { Alert, StyleSheet, View } from 'react-native';

type Props = {
    booking: BookingListItem;
    onApprove?: () => void | Promise<void>;
    onReject?: () => void | Promise<void>;
    onDismiss?: () => void | Promise<void>;
    onComplete?: () => void | Promise<void>;
    onCancel?: () => void | Promise<void>;
    onReschedule?: () => void | Promise<void>;
    loading?: boolean;
};

export function BookingActions({
    booking,
    onApprove,
    onReject,
    onDismiss,
    onComplete,
    onCancel,
    onReschedule,
    loading,
}: Props) {
    const actions: { label: string; onPress: () => void; variant?: 'primary' | 'secondary' }[] = [];

    if (booking.can_approve && onApprove) {
        actions.push({ label: 'Approve', onPress: () => void onApprove() });
    }
    if (booking.can_reject && onReject) {
        actions.push({
            label: 'Reject',
            variant: 'secondary',
            onPress: () =>
                Alert.alert('Decline request', 'Decline this booking request?', [
                    { text: 'Cancel', style: 'cancel' },
                    { text: 'Decline', style: 'destructive', onPress: () => void onReject() },
                ]),
        });
    }
    if (booking.can_dismiss && onDismiss) {
        actions.push({
            label: 'Dismiss',
            variant: 'secondary',
            onPress: () =>
                Alert.alert('Dismiss expired request', 'Remove this stale request from your list?', [
                    { text: 'Keep', style: 'cancel' },
                    { text: 'Dismiss', style: 'destructive', onPress: () => void onDismiss() },
                ]),
        });
    }
    if (booking.can_complete && onComplete) {
        actions.push({ label: 'Complete', onPress: () => void onComplete() });
    }
    if (booking.can_reschedule && onReschedule) {
        actions.push({
            label: 'Reschedule',
            variant: 'secondary',
            onPress: () => void onReschedule(),
        });
    }
    if (booking.can_cancel && onCancel) {
        actions.push({
            label: 'Cancel',
            variant: 'secondary',
            onPress: () =>
                Alert.alert('Cancel appointment', 'Cancel this appointment?', [
                    { text: 'Keep', style: 'cancel' },
                    { text: 'Cancel', style: 'destructive', onPress: () => void onCancel() },
                ]),
        });
    }

    if (actions.length === 0) {
        return null;
    }

    return (
        <View style={styles.row}>
            {actions.map((action) => (
                <View key={action.label} style={styles.btn}>
                    <Button
                        label={action.label}
                        loading={loading}
                        onPress={action.onPress}
                        variant={action.variant ?? 'primary'}
                    />
                </View>
            ))}
        </View>
    );
}

const styles = StyleSheet.create({
    row: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginTop: spacing.sm },
    btn: { flexGrow: 1, flexBasis: '47%', minWidth: 0 },
});
