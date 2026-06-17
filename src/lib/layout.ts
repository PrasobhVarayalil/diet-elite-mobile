import { spacing } from '@/constants/theme';
import { Platform, type StyleProp, type ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

/** Standard keyboard behavior for form and chat screens. */
export function keyboardAvoidingBehavior(): 'padding' | 'height' | undefined {
    return Platform.OS === 'ios' ? 'padding' : 'height';
}

/** Offset below branded header when using KeyboardAvoidingView. */
export function headerKeyboardOffset(topInset: number): number {
    return topInset + 88;
}

/** ScrollView / FlatList content padding with optional bottom safe area. */
export function scrollContentPadding(bottomInset = 0, extraBottom = spacing.lg): StyleProp<ViewStyle> {
    return {
        paddingHorizontal: spacing.lg,
        paddingBottom: extraBottom + bottomInset,
        flexGrow: 1,
    };
}

export function useScreenInsets() {
    const insets = useSafeAreaInsets();

    return {
        top: insets.top,
        bottom: insets.bottom,
        /** Footer / composer padding above home indicator. */
        footerPadding: Math.max(insets.bottom, spacing.sm),
        /** FAB or sticky footer offset from screen bottom. */
        fabBottom: insets.bottom + spacing.lg,
        keyboardOffset: headerKeyboardOffset(insets.top),
    };
}
