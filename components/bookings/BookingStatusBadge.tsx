import { bookingStatusLabel, bookingStatusStyle } from '@/src/lib/booking-status';
import { radius } from '@/constants/theme';
import { StyleSheet, Text, View } from 'react-native';

type Props = {
    status: string;
    customerView?: boolean;
    isExpiredRequest?: boolean;
};

export function BookingStatusBadge({ status, customerView = false, isExpiredRequest = false }: Props) {
    const palette = bookingStatusStyle(status, isExpiredRequest);
    const label = bookingStatusLabel(status, customerView, isExpiredRequest);

    return (
        <View style={[styles.base, { backgroundColor: palette.bg }]}>
            <Text style={[styles.text, { color: palette.text }]}>{label}</Text>
        </View>
    );
}

const styles = StyleSheet.create({
    base: {
        alignSelf: 'flex-start',
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: radius.sm,
    },
    text: {
        fontSize: 10,
        fontWeight: '700',
        letterSpacing: 0.4,
        textTransform: 'uppercase',
    },
});
