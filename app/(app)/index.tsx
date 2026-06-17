import { AppHeader } from '@/components/ui/AppHeader';
import { HeaderIconButton } from '@/components/ui/HeaderIconButton';
import { AdminHomeScreen } from '@/components/home/AdminHomeScreen';
import { AdvisorHomeScreen } from '@/components/home/AdvisorHomeScreen';
import CustomerHomeScreen from '@/components/home/CustomerHomeScreen';
import { DietitianHomeScreen } from '@/components/home/DietitianHomeScreen';
import { StaffHomeScreen } from '@/components/home/StaffHomeScreen';
import { colors } from '@/constants/theme';
import { useAuth } from '@/src/context/auth-context';
import { appHref } from '@/src/lib/navigation';
import { isAdmin, isAdvisor, isCustomer, isDietitian, isStaff } from '@/src/lib/user-access';
import { useRouter } from 'expo-router';
import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';

function StaffDashboard({
    subtitle,
    title,
    headerRight,
    children,
}: {
    subtitle: string;
    title: string;
    headerRight?: ReactNode;
    children: ReactNode;
}) {
    return (
        <View style={styles.root}>
            <AppHeader right={headerRight} subtitle={subtitle} title={title} />
            <View style={styles.body}>{children}</View>
        </View>
    );
}

export default function HomeScreen() {
    const router = useRouter();
    const { user } = useAuth();

    if (isAdmin(user)) {
        return (
            <StaffDashboard
                headerRight={
                    <HeaderIconButton
                        accessibilityLabel="Open admin portal"
                        icon="grid-outline"
                        label="Portal"
                        onPress={() => router.push(appHref('/(app)/admin'))}
                    />
                }
                subtitle="Today's operations"
                title="Admin home"
            >
                <AdminHomeScreen />
            </StaffDashboard>
        );
    }

    if (isDietitian(user)) {
        return (
            <StaffDashboard subtitle="Your practice at a glance" title="Dashboard">
                <DietitianHomeScreen />
            </StaffDashboard>
        );
    }

    if (isAdvisor(user)) {
        return (
            <StaffDashboard
                headerRight={
                    <HeaderIconButton
                        accessibilityLabel="Open advisor tools"
                        icon="briefcase-outline"
                        label="Tools"
                        onPress={() => router.push(appHref('/(app)/advisor'))}
                    />
                }
                subtitle="Enrollments & first consults"
                title="Advisor dashboard"
            >
                <AdvisorHomeScreen />
            </StaffDashboard>
        );
    }

    if (isStaff(user) && !isDietitian(user)) {
        return (
            <StaffDashboard subtitle={user?.role_label ?? 'Staff'} title="Diet Elite">
                <StaffHomeScreen />
            </StaffDashboard>
        );
    }

    if (isCustomer(user)) {
        return <CustomerHomeScreen />;
    }

    return (
        <StaffDashboard subtitle="Diet Elite" title="Home">
            <StaffHomeScreen />
        </StaffDashboard>
    );
}

const styles = StyleSheet.create({
    root: { flex: 1, backgroundColor: colors.background },
    body: { flex: 1, minHeight: 0 },
});
