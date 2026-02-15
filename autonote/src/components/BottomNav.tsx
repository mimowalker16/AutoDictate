import React, { useEffect } from 'react';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, gradients, radius, spacing, animations } from '@/styles/theme';

type IconName = keyof typeof Feather.glyphMap;

const TabButton: React.FC<{
  label: string;
  icon: IconName;
  focused: boolean;
  onPress: () => void;
}> = ({ label, icon, focused, onPress }) => {
  const scale = useSharedValue(1);

  const handlePress = () => {
    scale.value = withSpring(0.9, { damping: 15, stiffness: 200 });
    setTimeout(() => {
      scale.value = withSpring(1, animations.springBouncy);
    }, 100);
    onPress();
  };

  const containerStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <Pressable onPress={handlePress} style={styles.tabPressable}>
      <Animated.View style={[styles.tab, focused && styles.tabActive, containerStyle]}>
        <Feather
          name={icon}
          size={20}
          color={focused ? colors.gold : colors.muted}
        />
        <Text style={[styles.label, focused && styles.labelActive]} numberOfLines={1}>
          {label}
        </Text>
      </Animated.View>
    </Pressable>
  );
};

export const BottomNav: React.FC<BottomTabBarProps> = ({ state, descriptors, navigation }) => {
  const { bottom } = useSafeAreaInsets();
  const paddingBottom = Math.max(bottom, 8) + 6;

  const barOpacity = useSharedValue(0);
  const barTranslateY = useSharedValue(30);

  useEffect(() => {
    barOpacity.value = withTiming(1, { duration: 500 });
    barTranslateY.value = withSpring(0, animations.spring);
  }, [barOpacity, barTranslateY]);

  const barAnimStyle = useAnimatedStyle(() => ({
    opacity: barOpacity.value,
    transform: [{ translateY: barTranslateY.value }],
  }));

  return (
    <View style={[styles.wrapper, { paddingBottom }]}>
      {/* Bottom gradient fade */}
      <LinearGradient
        colors={['transparent', 'rgba(5, 8, 16, 0.95)', colors.backgroundDeep]}
        style={styles.fade}
        locations={[0, 0.4, 1]}
      />

      <Animated.View style={[styles.barOuter, barAnimStyle]}>
        {/* Gold border */}
        <LinearGradient
          colors={[colors.goldDark, colors.gold, colors.goldLight, colors.gold, colors.goldDark]}
          style={styles.borderGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        />

        {/* Inner bar content */}
        <View style={styles.bar}>
          {state.routes.map((route, index) => {
            const focused = state.index === index;
            const options = descriptors[route.key].options;
            const label = options.tabBarLabel ?? options.title ?? route.name;
            const icon = (route.name === 'record' ? 'mic' : 'book-open') as IconName;

            const onPress = () => {
              const event = navigation.emit({
                type: 'tabPress',
                target: route.key,
                canPreventDefault: true,
              });
              if (!focused && !event.defaultPrevented) {
                navigation.navigate(route.name as never);
              }
            };

            return (
              <TabButton
                key={route.key}
                label={String(label)}
                icon={icon}
                focused={focused}
                onPress={onPress}
              />
            );
          })}
        </View>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  fade: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 130,
  },
  barOuter: {
    marginHorizontal: 16,
    borderRadius: 28,
    padding: 2,
    ...Platform.select({
      ios: {
        shadowColor: colors.gold,
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.4,
        shadowRadius: 16,
      },
      android: {
        elevation: 16,
      },
      default: {},
    }),
  },
  borderGradient: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 28,
  },
  bar: {
    flexDirection: 'row',
    paddingHorizontal: 8,
    paddingVertical: 8,
    backgroundColor: colors.backgroundAlt,
    borderRadius: 26,
    minWidth: 220,
  },
  tabPressable: {
    flex: 1,
    minWidth: 80,
  },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 20,
  },
  tabActive: {
    backgroundColor: 'rgba(212, 175, 55, 0.15)',
  },
  label: {
    color: colors.muted,
    fontWeight: '700',
    fontSize: 12,
  },
  labelActive: {
    color: colors.gold,
  },
});
