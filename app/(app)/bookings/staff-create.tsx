import { StaffBookingCreateScreen } from '@/components/bookings/StaffBookingCreateScreen';
import { DietitianGate } from '@/components/auth/DietitianGate';

export default function DietitianBookingCreateScreen() {
    return (
        <DietitianGate>
            <StaffBookingCreateScreen
                mode="dietitian"
                subtitle="Book for one of your clients"
                title="New appointment"
            />
        </DietitianGate>
    );
}
