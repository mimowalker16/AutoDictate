import React, { useEffect } from 'react';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { Feather } from '@expo/vector-icons';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, radius, spacing, animations, shadows } from '@/styles/theme';

type IconName = keyof typeof Feather.glyphMap;

const TabButton: React.FC<{
  label: string;
  icon: IconName;
  focused: boolean;
  onPress: () => void;
}> = ({ label, icon, focused, onPress }) => {
  const scale = useSharedValue(1);

  const handlePress = () => {
    scale.value = withSpring(0.92, { damping: 15, stiffness: 200 });
    setTimeout(() => {
      scale.value = withSpring(1, animations.springBouncy);
    }, 80);
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
          color={focused ? colors.accent : colors.muted}
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
  const paddingBottom = Math.max(bottom, 8) + 4;

  const barOpacity = useSharedValue(0);
  const barTranslateY = useSharedValue(20);

  useEffect(() => {
    barOpacity.value = withTiming(1, { duration: 400 });
    barTranslateY.value = withSpring(0, animations.spring);
  }, [barOpacity, barTranslateY]);

  const barAnimStyle = useAnimatedStyle(() => ({
    opacity: barOpacity.value,
    transform: [{ translateY: barTranslateY.value }],
  }));

  return (
    <View style={[styles.wrapper, { paddingBottom }]}>
      <Animated.View style={[styles.bar, barAnimStyle]}>
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
    backgroundColor: 'transparent',
  },
  bar: {
    flexDirection: 'row',
    marginHorizontal: 20,
    paddingHorizontal: 8,
    paddingVertical: 6,
    backgroundColor: colors.backgroundAlt,
    borderRadius: 28,
    borderWidth: 1,
    borderColor: colors.border,
    minWidth: 220,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 12,
      },
      android: { elevation: 8 },
      default: {},
    }),
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
    backgroundColor: 'rgba(217, 119, 6, 0.1)',
  },
  label: {
    color: colors.muted,
    fontWeight: '600',
    fontSize: 13,
  },
  labelActive: {
    color: colors.accent,
    fontWeight: '700',
  },
});
