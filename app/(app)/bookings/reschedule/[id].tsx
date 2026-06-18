import { RescheduleBookingScreen } from '@/components/bookings/RescheduleBookingScreen';
import { DietitianGate } from '@/components/auth/DietitianGate';

export default function DietitianRescheduleScreen() {
    return (
        <DietitianGate>
            <RescheduleBookingScreen mode="dietitian" />
        </DietitianGate>
    );
}
