import React, { useEffect } from 'react';
import { Dimensions, StyleSheet, View } from 'react-native';
import Animated, {
    Easing,
    useAnimatedStyle,
    useSharedValue,
    withRepeat,
    withSequence,
    withTiming,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, gradients } from '@/styles/theme';

const { width, height } = Dimensions.get('window');

const FloatingOrb: React.FC<{
    size: number;
    startX: number;
    startY: number;
    delay: number;
    duration: number;
    color: string;
}> = ({ size, startX, startY, delay, duration, color }) => {
    const translateY = useSharedValue(0);
    const translateX = useSharedValue(0);
    const opacity = useSharedValue(0.3);
    const scale = useSharedValue(0.8);

    useEffect(() => {
        const startAnim = () => {
            translateY.value = withRepeat(
                withSequence(
                    withTiming(-30, { duration: duration / 2, easing: Easing.inOut(Easing.ease) }),
                    withTiming(30, { duration: duration / 2, easing: Easing.inOut(Easing.ease) }),
                ),
                -1,
                true,
            );
            translateX.value = withRepeat(
                withSequence(
                    withTiming(20, { duration: duration * 0.7, easing: Easing.inOut(Easing.ease) }),
                    withTiming(-20, { duration: duration * 0.7, easing: Easing.inOut(Easing.ease) }),
                ),
                -1,
                true,
            );
            opacity.value = withRepeat(
                withSequence(
                    withTiming(0.6, { duration: duration * 0.4 }),
                    withTiming(0.2, { duration: duration * 0.4 }),
                ),
                -1,
                true,
            );
            scale.value = withRepeat(
                withSequence(
                    withTiming(1.1, { duration: duration * 0.5 }),
                    withTiming(0.9, { duration: duration * 0.5 }),
                ),
                -1,
                true,
            );
        };

        const timer = setTimeout(startAnim, delay);
        return () => clearTimeout(timer);
    }, [delay, duration, opacity, scale, translateX, translateY]);

    const animatedStyle = useAnimatedStyle(() => ({
        transform: [
            { translateX: translateX.value },
            { translateY: translateY.value },
            { scale: scale.value },
        ],
        opacity: opacity.value,
    }));

    return (
        <Animated.View
            style={[
                styles.orb,
                {
                    width: size,
                    height: size,
                    left: startX,
                    top: startY,
                    backgroundColor: color,
                    shadowColor: color,
                },
                animatedStyle,
            ]}
        />
    );
};

export const AnimatedBackground: React.FC<{ children?: React.ReactNode }> = ({ children }) => {
    const gradientOpacity = useSharedValue(0.5);

    useEffect(() => {
        gradientOpacity.value = withRepeat(
            withSequence(
                withTiming(0.8, { duration: 4000, easing: Easing.inOut(Easing.ease) }),
                withTiming(0.4, { duration: 4000, easing: Easing.inOut(Easing.ease) }),
            ),
            -1,
            true,
        );
    }, [gradientOpacity]);

    const overlayStyle = useAnimatedStyle(() => ({
        opacity: gradientOpacity.value,
    }));

    return (
        <View style={styles.container}>
            <LinearGradient
                colors={gradients.screen}
                style={StyleSheet.absoluteFill}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
            />

            {/* Animated navy/gold overlay */}
            <Animated.View style={[StyleSheet.absoluteFill, overlayStyle]}>
                <LinearGradient
                    colors={gradients.auroraGold}
                    style={StyleSheet.absoluteFill}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                />
            </Animated.View>

            {/* Floating gold orbs */}
            <FloatingOrb size={100} startX={-20} startY={height * 0.2} delay={0} duration={6000} color={colors.gold} />
            <FloatingOrb size={60} startX={width * 0.7} startY={height * 0.1} delay={1000} duration={7000} color={colors.goldLight} />
            <FloatingOrb size={80} startX={width * 0.3} startY={height * 0.6} delay={500} duration={5500} color={colors.navy} />
            <FloatingOrb size={45} startX={width * 0.8} startY={height * 0.5} delay={1500} duration={6500} color={colors.gold} />
            <FloatingOrb size={70} startX={width * 0.1} startY={height * 0.8} delay={800} duration={7500} color={colors.navyLight} />

            {children}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.backgroundDeep,
    },
    orb: {
        position: 'absolute',
        borderRadius: 999,
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.6,
        shadowRadius: 30,
    },
});
