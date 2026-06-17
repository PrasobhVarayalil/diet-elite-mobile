import {
    adminListStyles,
    useAdminListContentStyle,
} from '@/components/admin/admin-list-styles';
import { AppHeader } from '@/components/ui/AppHeader';
import { colors } from '@/constants/theme';
import { Stack } from 'expo-router';
import type { ReactElement, ReactNode } from 'react';
import { ActivityIndicator, FlatList, type ListRenderItem, StyleSheet, View } from 'react-native';

function AdminListSeparator() {
    return <View style={adminListStyles.separator} />;
}

type Props<T> = {
    title: string;
    subtitle?: string;
    loading: boolean;
    data: T[];
    keyExtractor: (item: T) => string;
    renderItem: ListRenderItem<T>;
    actions?: ReactNode;
    ListHeaderComponent?: ReactElement | null;
    ListEmptyComponent?: ReactElement | null;
};

export function AdminListScreen<T>({
    title,
    subtitle,
    loading,
    data,
    keyExtractor,
    renderItem,
    actions,
    ListHeaderComponent,
    ListEmptyComponent,
}: Props<T>) {
    const listContentStyle = useAdminListContentStyle();

    return (
        <View style={adminListStyles.root}>
            <Stack.Screen options={{ headerShown: false }} />
            <AppHeader subtitle={subtitle} title={title} />
            {actions ? <View style={adminListStyles.actions}>{actions}</View> : null}
            {loading ? (
                <ActivityIndicator color={colors.brandDark} style={adminListStyles.loading} />
            ) : (
                <FlatList
                    ItemSeparatorComponent={AdminListSeparator}
                    ListEmptyComponent={ListEmptyComponent}
                    ListHeaderComponent={ListHeaderComponent}
                    contentContainerStyle={listContentStyle}
                    data={data}
                    keyExtractor={keyExtractor}
                    renderItem={renderItem}
                    showsVerticalScrollIndicator={false}
                    style={styles.list}
                />
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    list: { flex: 1 },
});
