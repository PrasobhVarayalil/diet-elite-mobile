import { AppHeader } from '@/components/ui/AppHeader';
import { colors, spacing } from '@/constants/theme';
import { keyboardAvoidingBehavior, useScreenInsets } from '@/src/lib/layout';
import type { ReactNode } from 'react';
import {
    ActivityIndicator,
    KeyboardAvoidingView,
    ScrollView,
    StyleSheet,
    View,
    type StyleProp,
    type ViewStyle,
} from 'react-native';

type AppScreenProps = {
    title?: string;
    subtitle?: string;
    headerRight?: ReactNode;
    showLogo?: boolean;
    loading?: boolean;
    /** Wrap body in KeyboardAvoidingView (forms, chat). */
    keyboard?: boolean;
    /** Scroll main content (forms, detail pages). */
    scroll?: boolean;
    /** Sticky footer (chat composer, action bars). */
    footer?: ReactNode;
    children?: ReactNode;
    contentContainerStyle?: StyleProp<ViewStyle>;
    style?: StyleProp<ViewStyle>;
};

export function AppScreen({
    title,
    subtitle,
    headerRight,
    showLogo = true,
    loading = false,
    keyboard = false,
    scroll = false,
    footer,
    children,
    contentContainerStyle,
    style,
}: AppScreenProps) {
    const { footerPadding, keyboardOffset } = useScreenInsets();

    const body = loading ? (
        <View style={styles.loading}>
            <ActivityIndicator color={colors.brandDark} size="large" />
        </View>
    ) : scroll ? (
        <ScrollView
            contentContainerStyle={[styles.scrollContent, contentContainerStyle]}
            keyboardDismissMode="on-drag"
            keyboardShouldPersistTaps="handled"
            nestedScrollEnabled
            showsVerticalScrollIndicator={false}
            style={styles.flex}
        >
            {children}
        </ScrollView>
    ) : (
        <View style={[styles.flex, style]}>{children}</View>
    );

    const wrappedBody = keyboard ? (
        <KeyboardAvoidingView
            behavior={keyboardAvoidingBehavior()}
            keyboardVerticalOffset={keyboardOffset}
            style={styles.flex}
        >
            {body}
            {footer ? (
                <View style={[styles.footer, { paddingBottom: footerPadding }]}>{footer}</View>
            ) : null}
        </KeyboardAvoidingView>
    ) : (
        <>
            {body}
            {footer ? (
                <View style={[styles.footer, { paddingBottom: footerPadding }]}>{footer}</View>
            ) : null}
        </>
    );

    return (
        <View style={styles.root}>
            {title ? (
                <AppHeader right={headerRight} showLogo={showLogo} subtitle={subtitle} title={title} />
            ) : null}
            {wrappedBody}
        </View>
    );
}

const styles = StyleSheet.create({
    root: {
        flex: 1,
        backgroundColor: colors.background,
    },
    flex: {
        flex: 1,
        minHeight: 0,
    },
    scrollContent: {
        flexGrow: 1,
        padding: spacing.lg,
        paddingBottom: spacing.xl,
        gap: spacing.md,
    },
    loading: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    footer: {
        borderTopWidth: 1,
        borderTopColor: colors.border,
        backgroundColor: colors.card,
        paddingHorizontal: spacing.lg,
        paddingTop: spacing.sm,
    },
});
