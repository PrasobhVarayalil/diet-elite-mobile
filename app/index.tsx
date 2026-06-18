import { useAuth } from '@/src/context/auth-context';
import { mobileEntryHref } from '@/src/lib/navigation';
import { Redirect } from 'expo-router';
import { BrandLoadingScreen } from '@/components/ui/BrandLoadingScreen';

export default function Index() {
    const { user, bootstrapping } = useAuth();

    if (bootstrapping) {
        return <BrandLoadingScreen />;
    }

    if (user) {
        return <Redirect href={mobileEntryHref(user)} />;
    }

    return <Redirect href="/login" />;
}
