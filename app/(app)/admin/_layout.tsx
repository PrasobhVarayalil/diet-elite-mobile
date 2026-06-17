import { AdminGate } from '@/components/auth/AdminGate';
import { Stack } from 'expo-router';

export default function AdminLayout() {
    return (
        <AdminGate>
            <Stack screenOptions={{ headerShown: false }} />
        </AdminGate>
    );
}
