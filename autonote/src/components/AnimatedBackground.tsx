import React from 'react';
import { StyleSheet, View } from 'react-native';
import { colors } from '@/styles/theme';

type Props = {
    children: React.ReactNode;
};

export const AnimatedBackground: React.FC<Props> = ({ children }) => {
    return <View style={styles.container}>{children}</View>;
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.background,
    },
});
