import React, { useEffect, useRef } from 'react';
import { StyleSheet, ViewStyle } from 'react-native';
import Animated, {
    Easing,
    interpolateColor,
    useAnimatedStyle,
    useSharedValue,
    withRepeat,
    withTiming,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, radius } from '@/styles/theme';

type Props = {
    children: React.ReactNode;
    style?: ViewStyle;
    animated?: boolean;
    intensity?: 'subtle' | 'normal' | 'strong';
};

export const GlowingBorder: React.FC<Props> = ({
    children,
    style,
    animated = true,
    intensity = 'normal',
}) => {
    const rotation = useSharedValue(0);
    const glowOpacity = useSharedValue(0.5);

    const opacityMap = {
        subtle: { min: 0.2, max: 0.4 },
        normal: { min: 0.4, max: 0.7 },
        strong: { min: 0.6, max: 1 },
    };

    useEffect(() => {
        if (animated) {
            rotation.value = withRepeat(
                withTiming(360, { duration: 8000, easing: Easing.linear }),
                -1,
                false,
            );
            glowOpacity.value = withRepeat(
                withTiming(opacityMap[intensity].max, { duration: 1500 }),
                -1,
                true,
            );
        }
    }, [animated, glowOpacity, intensity, opacityMap, rotation]);

    const borderStyle = useAnimatedStyle(() => ({
        opacity: glowOpacity.value,
    }));

    const shadowStyle = useAnimatedStyle(() => ({
        shadowOpacity: glowOpacity.value * 0.6,
    }));

    return (
        <Animated.View
            style={[
                styles.container,
                {
                    shadowColor: colors.gold,
                    shadowOffset: { width: 0, height: 0 },
                    shadowRadius: intensity === 'strong' ? 25 : intensity === 'normal' ? 15 : 8,
                },
                shadowStyle,
                style,
            ]}>
            {/* Animated glow border */}
            <Animated.View style={[styles.glowBorder, borderStyle]}>
                <LinearGradient
                    colors={[colors.gold, colors.goldLight, colors.gold]}
                    style={StyleSheet.absoluteFill}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                />
            </Animated.View>

            {/* Inner content */}
            <Animated.View style={styles.content}>{children}</Animated.View>
        </Animated.View>
    );
};

const styles = StyleSheet.create({
    container: {
        borderRadius: radius.lg,
        overflow: 'hidden',
    },
    glowBorder: {
        ...StyleSheet.absoluteFillObject,
        borderRadius: radius.lg,
    },
    content: {
        margin: 1.5,
        borderRadius: radius.lg - 1,
        backgroundColor: colors.backgroundAlt,
        overflow: 'hidden',
    },
});
