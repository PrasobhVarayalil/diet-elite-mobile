import { StaffBookingCreateScreen } from '@/components/bookings/StaffBookingCreateScreen';
import { Stack } from 'expo-router';

export default function AdvisorBookingCreateScreen() {
    return (
        <>
            <Stack.Screen options={{ headerShown: false }} />
            <StaffBookingCreateScreen
                mode="advisor"
                submitLabel="Book first consult"
                subtitle="Schedule first consultation"
                summaryTitle="First consult"
                title="Book first consult"
            />
        </>
    );
}
