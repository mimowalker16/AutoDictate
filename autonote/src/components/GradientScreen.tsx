import React from 'react';
import { ScrollView, StyleSheet, View, ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, spacing } from '@/styles/theme';

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
}) => {
  const insets = useSafeAreaInsets();

  const content = (
    <View
      style={[
        styles.content,
        { paddingTop: insets.top + spacing.sm },
        style,
        { pointerEvents: 'box-none' },
      ]}>
      {children}
    </View>
  );

  if (scrollable) {
    return (
      <View style={styles.container}>
        <ScrollView
          contentContainerStyle={styles.scroll}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled">
          {content}
        </ScrollView>
      </View>
    );
  }

  return <View style={styles.container}>{content}</View>;
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
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
