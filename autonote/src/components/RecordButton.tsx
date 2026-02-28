import React, { useEffect } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { colors, animations } from '@/styles/theme';

type Props = {
  isRecording: boolean;
  onPress: () => void;
  level?: number;
};

// Pulsing ring that expands outward during recording
const PulseRing: React.FC<{ delay: number; isRecording: boolean }> = ({ delay, isRecording }) => {
  const scale = useSharedValue(1);
  const opacity = useSharedValue(0);

  useEffect(() => {
    if (isRecording) {
      const start = () => {
        scale.value = 0.9;
        opacity.value = 0.4;
        scale.value = withRepeat(
          withTiming(2, { duration: 2000, easing: Easing.out(Easing.ease) }),
          -1,
          false,
        );
        opacity.value = withRepeat(
          withTiming(0, { duration: 2000, easing: Easing.out(Easing.ease) }),
          -1,
          false,
        );
      };
      const timer = setTimeout(start, delay);
      return () => clearTimeout(timer);
    } else {
      scale.value = withTiming(1, { duration: 300 });
      opacity.value = withTiming(0, { duration: 300 });
    }
  }, [delay, isRecording, opacity, scale]);

  const style = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  return <Animated.View style={[styles.pulseRing, style]} />;
};

export const RecordButton: React.FC<Props> = ({ isRecording, onPress, level = 0 }) => {
  const orbScale = useSharedValue(1);
  const breathe = useSharedValue(1);

  // Idle breathing
  useEffect(() => {
    if (!isRecording) {
      breathe.value = withRepeat(
        withSequence(
          withTiming(1.04, { duration: 1800, easing: Easing.inOut(Easing.ease) }),
          withTiming(0.96, { duration: 1800, easing: Easing.inOut(Easing.ease) }),
        ),
        -1,
        true,
      );
    } else {
      breathe.value = withTiming(1, { duration: 200 });
    }
  }, [breathe, isRecording]);

  // Audio-reactive scale
  useEffect(() => {
    if (isRecording) {
      const clamped = Math.min(1, Math.max(0, level));
      const target = 0.95 + clamped * 0.2;
      orbScale.value = withTiming(target, { duration: 80 });
    } else {
      orbScale.value = withSpring(1, animations.spring);
    }
  }, [isRecording, level, orbScale]);

  const containerStyle = useAnimatedStyle(() => ({
    transform: [{ scale: isRecording ? orbScale.value : breathe.value }],
  }));

  const handlePress = async () => {
    if (isRecording) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } else {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    }
    onPress();
  };

  return (
    <Pressable
      onPress={handlePress}
      style={styles.pressable}
      accessibilityRole="button"
      accessibilityLabel={isRecording ? 'Stop recording' : 'Start recording'}>
      {/* Pulse rings — only visible when recording */}
      <PulseRing delay={0} isRecording={isRecording} />
      <PulseRing delay={700} isRecording={isRecording} />

      <Animated.View style={[styles.container, containerStyle]}>
        {/* Outer ring */}
        <View style={[styles.outerRing, isRecording && styles.outerRingRecording]}>
          {/* Inner orb */}
          <View style={[styles.innerOrb, isRecording && styles.innerOrbRecording]}>
            <Text style={[styles.label, isRecording && styles.labelRecording]}>
              {isRecording ? '■' : '●'}
            </Text>
            <Text style={[styles.sublabel, isRecording && styles.sublabelRecording]}>
              {isRecording ? 'Stop' : 'Record'}
            </Text>
          </View>
        </View>
      </Animated.View>
    </Pressable>
  );
};

const ORB_SIZE = 140;
const INNER_SIZE = ORB_SIZE - 12;

const styles = StyleSheet.create({
  pressable: {
    alignSelf: 'center',
    alignItems: 'center',
    justifyContent: 'center',
  },
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  outerRing: {
    width: ORB_SIZE,
    height: ORB_SIZE,
    borderRadius: ORB_SIZE / 2,
    backgroundColor: 'rgba(217, 119, 6, 0.08)',
    borderWidth: 2.5,
    borderColor: 'rgba(217, 119, 6, 0.25)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  outerRingRecording: {
    backgroundColor: 'rgba(239, 68, 68, 0.08)',
    borderColor: 'rgba(239, 68, 68, 0.3)',
  },
  innerOrb: {
    width: INNER_SIZE,
    height: INNER_SIZE,
    borderRadius: INNER_SIZE / 2,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  innerOrbRecording: {
    backgroundColor: colors.recording,
  },
  label: {
    color: '#FFFFFF',
    fontSize: 28,
    fontWeight: '300',
  },
  labelRecording: {
    fontSize: 22,
  },
  sublabel: {
    color: 'rgba(255, 255, 255, 0.9)',
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginTop: -2,
  },
  sublabelRecording: {
    color: 'rgba(255, 255, 255, 0.9)',
  },
  pulseRing: {
    position: 'absolute',
    width: ORB_SIZE,
    height: ORB_SIZE,
    borderRadius: ORB_SIZE / 2,
    borderWidth: 2,
    borderColor: 'rgba(239, 68, 68, 0.3)',
  },
});
