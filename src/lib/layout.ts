import { spacing } from '@/constants/theme';
import { useEffect, useState } from 'react';
import { Keyboard, Platform, type StyleProp, type ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

/** Standard keyboard behavior — iOS uses padding; Android relies on resize + keyboard inset padding. */
export function keyboardAvoidingBehavior(): 'padding' | undefined {
    return Platform.OS === 'ios' ? 'padding' : undefined;
}

/** Offset below branded header when using KeyboardAvoidingView. */
export function headerKeyboardOffset(topInset: number): number {
    return topInset + 88;
}

/** Chat thread header approximate height (below status bar). */
export function chatHeaderKeyboardOffset(topInset: number): number {
    return topInset + 64;
}

/** ScrollView / FlatList content padding with optional bottom safe area. */
export function scrollContentPadding(bottomInset = 0, extraBottom = spacing.lg): StyleProp<ViewStyle> {
    return {
        paddingHorizontal: spacing.lg,
        paddingBottom: extraBottom + bottomInset,
        flexGrow: 1,
    };
}

/** Live keyboard height for composer/footer padding when needed. */
export function useKeyboardInset(): number {
    const [height, setHeight] = useState(0);

    useEffect(() => {
        const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
        const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';

        const showSub = Keyboard.addListener(showEvent, (event) => {
            setHeight(event.endCoordinates.height);
        });
        const hideSub = Keyboard.addListener(hideEvent, () => {
            setHeight(0);
        });

        return () => {
            showSub.remove();
            hideSub.remove();
        };
    }, []);

    return height;
}

export function useScreenInsets() {
    const insets = useSafeAreaInsets();
    const keyboardInset = useKeyboardInset();

    return {
        top: insets.top,
        bottom: insets.bottom,
        keyboardInset,
        /** Footer / composer padding above home indicator. */
        footerPadding: Math.max(insets.bottom, spacing.sm),
        /** Composer padding above home indicator or keyboard. */
        composerPaddingBottom:
            Platform.OS === 'android' && keyboardInset > 0
                ? keyboardInset
                : Math.max(insets.bottom, spacing.sm),
        /** FAB or sticky footer offset from screen bottom. */
        fabBottom: insets.bottom + spacing.lg,
        keyboardOffset: headerKeyboardOffset(insets.top),
        chatKeyboardOffset: chatHeaderKeyboardOffset(insets.top),
    };
}
