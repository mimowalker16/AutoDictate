import React, { useEffect } from 'react';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withSpring,
  withTiming,
  interpolate,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, gradients, radius, animations } from '@/styles/theme';

type Props = {
  isRecording: boolean;
  onPress: () => void;
  level?: number;
};

// Particle component for burst effect
const Particle: React.FC<{ delay: number; angle: number; isActive: boolean }> = ({
  delay,
  angle,
  isActive,
}) => {
  const progress = useSharedValue(0);
  const opacity = useSharedValue(0);

  useEffect(() => {
    if (isActive) {
      setTimeout(() => {
        progress.value = withTiming(1, { duration: 600, easing: Easing.out(Easing.cubic) });
        opacity.value = withSequence(
          withTiming(1, { duration: 100 }),
          withTiming(0, { duration: 500 }),
        );
      }, delay);
    } else {
      progress.value = 0;
      opacity.value = 0;
    }
  }, [delay, isActive, opacity, progress]);

  const style = useAnimatedStyle(() => {
    const distance = interpolate(progress.value, [0, 1], [0, 80]);
    const x = Math.cos(angle) * distance;
    const y = Math.sin(angle) * distance;
    const scale = interpolate(progress.value, [0, 0.5, 1], [0.5, 1.2, 0.3]);

    return {
      transform: [{ translateX: x }, { translateY: y }, { scale }],
      opacity: opacity.value,
    };
  });

  return <Animated.View style={[styles.particle, style]} />;
};

// Sound wave ring
const WaveRing: React.FC<{ delay: number; isRecording: boolean }> = ({ delay, isRecording }) => {
  const scale = useSharedValue(1);
  const opacity = useSharedValue(0);

  useEffect(() => {
    if (isRecording) {
      const start = () => {
        scale.value = 1;
        opacity.value = 0.6;
        scale.value = withRepeat(
          withTiming(2.5, { duration: 1500, easing: Easing.out(Easing.ease) }),
          -1,
          false,
        );
        opacity.value = withRepeat(
          withTiming(0, { duration: 1500, easing: Easing.out(Easing.ease) }),
          -1,
          false,
        );
      };
      const timer = setTimeout(start, delay);
      return () => clearTimeout(timer);
    } else {
      scale.value = 1;
      opacity.value = 0;
    }
  }, [delay, isRecording, opacity, scale]);

  const style = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  return <Animated.View style={[styles.waveRing, style]} />;
};

export const RecordButton: React.FC<Props> = ({ isRecording, onPress, level = 0 }) => {
  const pulse = useSharedValue(1);
  const reactive = useSharedValue(1);
  const morphX = useSharedValue(1);
  const morphY = useSharedValue(1);
  const rotation = useSharedValue(0);
  const innerGlow = useSharedValue(0.3);
  const showParticles = useSharedValue(false);

  // Idle breathing animation
  useEffect(() => {
    if (!isRecording) {
      pulse.value = withRepeat(
        withSequence(
          withTiming(1.03, { duration: 1200, easing: Easing.inOut(Easing.ease) }),
          withTiming(0.97, { duration: 1200, easing: Easing.inOut(Easing.ease) }),
        ),
        -1,
        true,
      );
      rotation.value = withRepeat(
        withTiming(360, { duration: 20000, easing: Easing.linear }),
        -1,
        false,
      );
      innerGlow.value = withRepeat(
        withSequence(
          withTiming(0.6, { duration: 1500 }),
          withTiming(0.3, { duration: 1500 }),
        ),
        -1,
        true,
      );
    }
  }, [innerGlow, isRecording, pulse, rotation]);

  // Recording reactive animation
  useEffect(() => {
    if (!isRecording) {
      reactive.value = withSpring(1, animations.spring);
      morphX.value = withSpring(1, animations.spring);
      morphY.value = withSpring(1, animations.spring);
      return;
    }

    const clamped = Math.min(1, Math.max(0, level));
    const targetScale = 0.95 + clamped * 0.25;
    const targetX = 1 + clamped * 0.15;
    const targetY = 1 - clamped * 0.1;

    reactive.value = withTiming(targetScale, { duration: 80 });
    morphX.value = withTiming(targetX, { duration: 80 });
    morphY.value = withTiming(Math.max(0.85, targetY), { duration: 80 });
  }, [isRecording, level, morphX, morphY, reactive]);

  const containerStyle = useAnimatedStyle(() => ({
    transform: [{ scale: isRecording ? reactive.value : pulse.value }],
  }));

  const ringStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotation.value}deg` }],
  }));

  const blobStyle = useAnimatedStyle(() => ({
    transform: [{ scaleX: morphX.value }, { scaleY: morphY.value }],
  }));

  const glowStyle = useAnimatedStyle(() => ({
    opacity: innerGlow.value,
  }));

  const handlePress = () => {
    showParticles.value = true;
    setTimeout(() => {
      showParticles.value = false;
    }, 700);
    onPress();
  };

  const particles = Array.from({ length: 12 }, (_, i) => ({
    angle: (i * Math.PI * 2) / 12,
    delay: i * 30,
  }));

  return (
    <Pressable onPress={handlePress} style={styles.pressable}>
      {/* Wave rings when recording */}
      <WaveRing delay={0} isRecording={isRecording} />
      <WaveRing delay={500} isRecording={isRecording} />
      <WaveRing delay={1000} isRecording={isRecording} />

      <Animated.View style={[styles.container, containerStyle]}>
        {/* Outer rotating gradient ring */}
        <Animated.View style={[styles.outerRingWrapper, ringStyle]}>
          <LinearGradient
            colors={isRecording ? [colors.recording, colors.gold] : gradients.gold}
            style={styles.outerRing}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          />
        </Animated.View>

        {/* Inner morphing blob */}
        <Animated.View
          style={[
            styles.inner,
            isRecording && styles.innerRecording,
            blobStyle,
          ]}>
          {/* Inner glow */}
          <Animated.View style={[styles.innerGlow, glowStyle]} />
          <Text style={styles.label}>{isRecording ? '■ Stop' : '● Record'}</Text>
        </Animated.View>

        {/* Particles burst */}
        {particles.map((p, i) => (
          <Particle
            key={i}
            angle={p.angle}
            delay={p.delay}
            isActive={showParticles.value}
          />
        ))}
      </Animated.View>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  pressable: {
    alignSelf: 'center',
    alignItems: 'center',
    justifyContent: 'center',
  },
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    ...Platform.select({
      web: {
        boxShadow: `0 15px 40px ${colors.accentGlow}`,
      },
      default: {
        shadowColor: colors.gold,
        shadowOffset: { width: 0, height: 15 },
        shadowOpacity: 0.5,
        shadowRadius: 30,
      },
    }),
  },
  outerRingWrapper: {
    padding: 6,
    borderRadius: 999,
  },
  outerRing: {
    width: 180,
    height: 180,
    borderRadius: 999,
    padding: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  inner: {
    position: 'absolute',
    height: 160,
    width: 160,
    borderRadius: 999,
    backgroundColor: colors.backgroundAlt,
    borderWidth: 2,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  innerRecording: {
    backgroundColor: 'rgba(220, 38, 38, 0.15)',
    borderColor: colors.recording,
  },
  innerGlow: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: colors.gold,
    borderRadius: 999,
  },
  label: {
    color: colors.text,
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  waveRing: {
    position: 'absolute',
    width: 180,
    height: 180,
    borderRadius: 999,
    borderWidth: 2,
    borderColor: colors.recording,
  },
  particle: {
    position: 'absolute',
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.gold,
  },
});
