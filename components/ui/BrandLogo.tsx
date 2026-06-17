import { colors, radius, shadow, spacing } from '@/constants/theme';
import { Image, StyleSheet, View, type ImageStyle, type StyleProp } from 'react-native';

const logoSource = require('@/assets/images/diet-elite-logo.png');

type BrandLogoProps = {
    size?: 'sm' | 'md' | 'lg' | 'hero';
    bordered?: boolean;
    style?: StyleProp<ImageStyle>;
};

const sizes = {
    sm: { box: 36, image: 28 },
    md: { box: 48, image: 38 },
    lg: { box: 64, image: 52 },
    hero: { box: 88, image: 72 },
} as const;

export function BrandLogo({ size = 'md', bordered = true, style }: BrandLogoProps) {
    const dim = sizes[size];

    const image = (
        <Image
            accessibilityLabel="Diet Elite"
            resizeMode="contain"
            source={logoSource}
            style={[{ width: dim.image, height: dim.image }, style]}
        />
    );

    if (!bordered) {
        return image;
    }

    return (
        <View style={[styles.frame, { width: dim.box, height: dim.box, borderRadius: size === 'hero' ? 20 : 14 }]}>
            {image}
        </View>
    );
}

const styles = StyleSheet.create({
    frame: {
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: colors.white,
        borderWidth: 2,
        borderColor: 'rgba(255,255,255,0.95)',
        ...shadow.card,
    },
});
