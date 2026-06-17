import { AdvisorGate } from '@/components/auth/AdvisorGate';
import { Stack } from 'expo-router';

export default function AdvisorLayout() {
    return (
        <AdvisorGate>
            <Stack screenOptions={{ headerShown: false }} />
        </AdvisorGate>
    );
}
