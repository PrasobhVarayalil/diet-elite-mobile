import { resolveMessageReceiptStatus, type MessageReceiptState } from '@/src/lib/message-receipt-status';
import { colors } from '@/constants/theme';
import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, View } from 'react-native';

type Props = {
    status?: MessageReceiptState | null;
    deliveredAt?: string | null;
    readAt?: string | null;
    onDark?: boolean;
};

export function MessageReceiptTicks({ status, deliveredAt, readAt, onDark = false }: Props) {
    const resolved = resolveMessageReceiptStatus({
        status,
        delivered_at: deliveredAt,
        read_at: readAt,
    });

    if (!resolved) {
        return null;
    }

    const isRead = resolved === 'read';
    const isDelivered = resolved === 'delivered' || isRead;
    const iconName = isDelivered ? 'checkmark-done' : 'checkmark';
    const color = isRead ? '#53bdeb' : onDark ? 'rgba(255,255,255,0.72)' : colors.textMuted;

    return (
        <View accessibilityLabel={isRead ? 'Read' : isDelivered ? 'Delivered' : 'Sent'} style={styles.wrap}>
            <Ionicons color={color} name={iconName} size={14} />
        </View>
    );
}

const styles = StyleSheet.create({
    wrap: { marginLeft: 4 },
});
