import React from 'react';
import { StyleSheet, View, ViewStyle } from 'react-native';
import { colors, radius } from '@/styles/theme';

type Props = {
    children: React.ReactNode;
    style?: ViewStyle;
    animated?: boolean;
    intensity?: 'subtle' | 'normal' | 'strong';
};

export const GlowingBorder: React.FC<Props> = ({
    children,
    style,
}) => {
    return (
        <View style={[styles.container, style]}>
            <View style={styles.content}>{children}</View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        borderRadius: radius.lg,
        borderWidth: 1,
        borderColor: colors.border,
        overflow: 'hidden',
    },
    content: {
        borderRadius: radius.lg - 1,
        backgroundColor: colors.card,
        overflow: 'hidden',
    },
});
