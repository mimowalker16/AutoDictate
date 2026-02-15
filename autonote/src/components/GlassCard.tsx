import React, { useEffect } from 'react';
import { Platform, Pressable, StyleSheet, ViewStyle } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withSpring,
  withTiming,
  interpolate,
  Extrapolation,
} from 'react-native-reanimated';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, glass, radius, spacing, animations } from '@/styles/theme';

type Props = {
  children: React.ReactNode;
  style?: ViewStyle;
  onPress?: () => void;
  animated?: boolean;
  glowing?: boolean;
  delay?: number;
};

export const GlassCard: React.FC<Props> = ({
  children,
  style,
  onPress,
  animated = true,
  glowing = false,
  delay = 0,
}) => {
  const scale = useSharedValue(0.95);
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(20);
  const glowOpacity = useSharedValue(0.3);
  const pressed = useSharedValue(0);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (animated) {
        scale.value = withSpring(1, animations.spring);
        opacity.value = withTiming(1, { duration: animations.enter });
        translateY.value = withSpring(0, animations.spring);
      } else {
        scale.value = 1;
        opacity.value = 1;
        translateY.value = 0;
      }

      if (glowing) {
        glowOpacity.value = withRepeat(
          withSequence(
            withTiming(0.6, { duration: 1500 }),
            withTiming(0.3, { duration: 1500 }),
          ),
          -1,
          true,
        );
      }
    }, delay);

    return () => clearTimeout(timer);
  }, [animated, delay, glowing, glowOpacity, opacity, scale, translateY]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: interpolate(pressed.value, [0, 1], [scale.value, 0.98]) },
      { translateY: translateY.value },
    ],
    opacity: opacity.value,
  }));

  const glowStyle = useAnimatedStyle(() => ({
    opacity: glowOpacity.value,
  }));

  const handlePressIn = () => {
    if (onPress) {
      pressed.value = withTiming(1, { duration: 100 });
    }
  };

  const handlePressOut = () => {
    if (onPress) {
      pressed.value = withTiming(0, { duration: 150 });
    }
  };

  const content = (
    <>
      {/* Gold glow border */}
      {glowing && (
        <Animated.View style={[styles.glowBorder, glowStyle]}>
          <LinearGradient
            colors={[colors.gold, colors.goldLight, colors.gold]}
            style={StyleSheet.absoluteFill}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          />
        </Animated.View>
      )}

      <BlurView intensity={glass.blurIntensity} tint="dark" style={[styles.card, style]}>
        {children}
      </BlurView>
    </>
  );

  if (onPress) {
    return (
      <Pressable onPress={onPress} onPressIn={handlePressIn} onPressOut={handlePressOut}>
        <Animated.View style={[styles.wrapper, glowing && styles.glowShadow, animatedStyle]}>
          {content}
        </Animated.View>
      </Pressable>
    );
  }

  return (
    <Animated.View style={[styles.wrapper, glowing && styles.glowShadow, animatedStyle]}>
      {content}
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    borderRadius: radius.lg,
    overflow: 'hidden',
  },
  glowShadow: Platform.select({
    web: {
      boxShadow: `0 0 30px ${colors.accentGlow}`,
    },
    default: {
      shadowColor: colors.gold,
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0.4,
      shadowRadius: 20,
      elevation: 8,
    },
  }),
  glowBorder: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: radius.lg,
  },
  card: {
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: glass.borderColor,
    padding: spacing.lg,
    backgroundColor: glass.backgroundColor,
    overflow: 'hidden',
  },
});
