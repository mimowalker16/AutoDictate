import React from 'react';
import { ScrollView, StyleSheet, View, ViewStyle } from 'react-native';
import { AnimatedBackground } from './AnimatedBackground';
import { spacing } from '@/styles/theme';

type Props = {
  children: React.ReactNode;
  scrollable?: boolean;
  style?: ViewStyle;
  showBackground?: boolean;
};

export const GradientScreen: React.FC<Props> = ({
  children,
  scrollable = false,
  style,
  showBackground = true,
}) => {
  const content = (
    <View style={[styles.content, style, { pointerEvents: 'box-none' }]}>
      {children}
    </View>
  );

  const inner = scrollable ? (
    <ScrollView
      contentContainerStyle={styles.scroll}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled">
      {content}
    </ScrollView>
  ) : (
    content
  );

  if (showBackground) {
    return <AnimatedBackground>{inner}</AnimatedBackground>;
  }

  return <View style={styles.fallback}>{inner}</View>;
};

const styles = StyleSheet.create({
  fallback: {
    flex: 1,
    backgroundColor: '#0a0e1f',
  },
  scroll: {
    padding: spacing.lg,
    paddingBottom: spacing.lg + spacing.xl * 3,
  },
  content: {
    flex: 1,
    padding: spacing.lg,
    paddingBottom: spacing.lg + spacing.xl * 3,
  },
});
