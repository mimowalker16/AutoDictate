import React, { useEffect } from 'react';
import { Feather } from '@expo/vector-icons';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, radius, spacing, animations } from '@/styles/theme';

type Props = {
  label: string;
  onPress: () => void;
};

export const FloatingActionButton: React.FC<Props> = ({ label, onPress }) => {
  const { bottom } = useSafeAreaInsets();
  const offsetBottom = spacing.xl + Math.max(bottom, spacing.md) + 50;

  const scale = useSharedValue(0);
  const pressed = useSharedValue(0);

  useEffect(() => {
    scale.value = withSpring(1, animations.springBouncy);
  }, [scale]);

  const handlePressIn = () => {
    pressed.value = withTiming(1, { duration: 80 });
  };

  const handlePressOut = () => {
    pressed.value = withTiming(0, { duration: 120 });
  };

  const containerStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value * (1 - pressed.value * 0.04) }],
  }));

  return (
    <Pressable
      onPress={() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        onPress();
      }}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      style={[styles.button, { bottom: offsetBottom }]}>
      <Animated.View style={[styles.wrapper, containerStyle]}>
        <Feather name="mic" size={18} color="#FFFFFF" />
        <Text style={styles.label}>{label}</Text>
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    backgroundColor: colors.accent,
    borderRadius: radius.xl,
    paddingVertical: spacing.md + 2,
    paddingHorizontal: spacing.xl,
    ...Platform.select({
      ios: {
        shadowColor: colors.accent,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 12,
      },
      android: { elevation: 8 },
      default: {},
    }),
  },
  label: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 15,
    letterSpacing: 0.3,
  },
});
