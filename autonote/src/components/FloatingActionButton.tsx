import React, { useEffect } from 'react';
import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, gradients, radius, spacing, animations } from '@/styles/theme';

type Props = {
  label: string;
  onPress: () => void;
};

export const FloatingActionButton: React.FC<Props> = ({ label, onPress }) => {
  const { bottom } = useSafeAreaInsets();
  const offsetBottom = spacing.xl + Math.max(bottom, spacing.md) + 50;

  const float = useSharedValue(0);
  const scale = useSharedValue(0);
  const rotation = useSharedValue(0);
  const glowOpacity = useSharedValue(0.4);
  const pressed = useSharedValue(0);

  useEffect(() => {
    // Entry animation
    scale.value = withSpring(1, animations.springBouncy);

    // Floating animation
    float.value = withRepeat(
      withSequence(
        withTiming(-6, { duration: 1500, easing: Easing.inOut(Easing.ease) }),
        withTiming(6, { duration: 1500, easing: Easing.inOut(Easing.ease) }),
      ),
      -1,
      true,
    );

    // Glow pulse
    glowOpacity.value = withRepeat(
      withSequence(
        withTiming(0.7, { duration: 1200 }),
        withTiming(0.3, { duration: 1200 }),
      ),
      -1,
      true,
    );
  }, [float, glowOpacity, scale]);

  const handlePressIn = () => {
    pressed.value = withTiming(1, { duration: 100 });
    rotation.value = withSpring(-5, animations.springBouncy);
  };

  const handlePressOut = () => {
    pressed.value = withTiming(0, { duration: 150 });
    rotation.value = withSpring(0, animations.springBouncy);
  };

  const containerStyle = useAnimatedStyle(() => ({
    transform: [
      { translateY: float.value },
      { scale: scale.value * (pressed.value ? 0.95 : 1) },
      { rotate: `${rotation.value}deg` },
    ],
  }));

  const glowStyle = useAnimatedStyle(() => ({
    opacity: glowOpacity.value,
  }));

  return (
    <Pressable
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      style={[styles.button, { bottom: offsetBottom }]}>
      <Animated.View style={[styles.wrapper, containerStyle]}>
        {/* Outer glow */}
        <Animated.View style={[styles.glow, glowStyle]} />

        <LinearGradient
          colors={gradients.gold}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.gradient}>
          <View style={styles.content}>
            <View style={styles.iconCircle}>
              <Feather name="mic" size={18} color={colors.backgroundDeep} />
            </View>
            <Text style={styles.label}>{label}</Text>
            <View style={styles.arrowCircle}>
              <Feather name="arrow-up-right" size={16} color={colors.gold} />
            </View>
          </View>
        </LinearGradient>
      </Animated.View>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  button: {
    position: 'absolute',
    alignSelf: 'center',
    right: spacing.lg,
    left: spacing.lg,
  },
  wrapper: {
    borderRadius: radius.xl,
    ...Platform.select({
      web: {
        boxShadow: `0 15px 35px ${colors.accentGlow}`,
      },
      default: {
        shadowColor: colors.gold,
        shadowOffset: { width: 0, height: 15 },
        shadowOpacity: 0.5,
        shadowRadius: 25,
        elevation: 12,
      },
    }),
  },
  glow: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: colors.gold,
    borderRadius: radius.xl,
    transform: [{ scale: 1.1 }],
  },
  gradient: {
    borderRadius: radius.xl,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.md + 2,
    paddingHorizontal: spacing.xl,
  },
  iconCircle: {
    height: 34,
    width: 34,
    borderRadius: 20,
    backgroundColor: 'rgba(5, 8, 16, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  arrowCircle: {
    height: 28,
    width: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(5, 8, 16, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    color: colors.backgroundDeep,
    fontWeight: '800',
    fontSize: 15,
    letterSpacing: 0.5,
  },
});
