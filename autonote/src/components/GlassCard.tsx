import React from 'react';
import { Platform, Pressable, StyleSheet, ViewStyle } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { colors, radius, spacing, animations, shadows } from '@/styles/theme';

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
  const scale = useSharedValue(animated ? 0.97 : 1);
  const opacity = useSharedValue(animated ? 0 : 1);
  const translateY = useSharedValue(animated ? 12 : 0);
  const pressed = useSharedValue(0);

  React.useEffect(() => {
    const timer = setTimeout(() => {
      if (animated) {
        scale.value = withSpring(1, animations.spring);
        opacity.value = withTiming(1, { duration: animations.enter });
        translateY.value = withSpring(0, animations.spring);
      }
    }, delay);
    return () => clearTimeout(timer);
  }, [animated, delay, opacity, scale, translateY]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: onPress ? scale.value * (1 - pressed.value * 0.02) : scale.value },
      { translateY: translateY.value },
    ],
    opacity: opacity.value,
  }));

  const handlePressIn = () => {
    if (onPress) pressed.value = withTiming(1, { duration: 80 });
  };
  const handlePressOut = () => {
    if (onPress) pressed.value = withTiming(0, { duration: 120 });
  };

  const card = (
    <Animated.View
      style={[
        styles.card,
        glowing && styles.cardGlow,
        animatedStyle,
        style,
      ]}>
      {children}
    </Animated.View>
  );

  if (onPress) {
    return (
      <Pressable onPress={onPress} onPressIn={handlePressIn} onPressOut={handlePressOut}>
        {card}
      </Pressable>
    );
  }

  return card;
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    ...Platform.select({
      ios: shadows.md,
      android: { elevation: 2 },
      default: {},
    }),
  },
  cardGlow: {
    borderColor: 'rgba(217, 119, 6, 0.15)',
    ...Platform.select({
      ios: shadows.glow,
      android: { elevation: 4 },
      default: {},
    }),
  },
});
