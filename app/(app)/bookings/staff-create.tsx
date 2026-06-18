import { StaffBookingCreateScreen } from '@/components/bookings/StaffBookingCreateScreen';

export default function DietitianBookingCreateScreen() {
    return (
        <StaffBookingCreateScreen
            mode="dietitian"
            subtitle="Book for one of your clients"
            title="New appointment"
        />
    );
}
