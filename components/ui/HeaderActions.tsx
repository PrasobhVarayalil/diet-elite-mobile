import { NotificationBellButton } from '@/components/notifications/NotificationBellButton';
import { spacing } from '@/constants/theme';
import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';

type Props = {
    extra?: ReactNode;
    showNotificationBell?: boolean;
};

export function HeaderActions({ extra, showNotificationBell = true }: Props) {
    if (!extra && !showNotificationBell) {
        return null;
    }

    return (
        <View style={styles.row}>
            {extra}
            {showNotificationBell ? <NotificationBellButton /> : null}
        </View>
    );
}

const styles = StyleSheet.create({
    row: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.sm,
        flexShrink: 0,
    },
});
