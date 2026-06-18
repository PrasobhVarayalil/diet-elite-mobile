import { StaffBookingCreateScreen } from '@/components/bookings/StaffBookingCreateScreen';

export default function AdminBookingCreateScreen() {
    return (
        <StaffBookingCreateScreen
            mode="admin"
            subtitle="Book on behalf of a customer"
            title="Create booking"
        />
    );
}
