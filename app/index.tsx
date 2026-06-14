import { colors } from '@/constants/theme';
import { useAuth } from '@/src/context/auth-context';
import { Redirect } from 'expo-router';
import { ActivityIndicator, StyleSheet, View } from 'react-native';

export default function Index() {
    const { user, bootstrapping } = useAuth();

    if (bootstrapping) {
        return (
            <View style={styles.center}>
                <ActivityIndicator size="large" color={colors.brandDark} />
            </View>
        );
    }

    if (user) {
        return <Redirect href="/(app)" />;
    }

    return <Redirect href="/login" />;
}

const styles = StyleSheet.create({
    center: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: colors.background,
    },
});
