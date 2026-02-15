import { LogBox } from 'react-native';
import { configureReanimatedLogger, ReanimatedLogLevel } from 'react-native-reanimated';

// 1. Configure Reanimated logger
configureReanimatedLogger({
    level: ReanimatedLogLevel.warn,
    strict: false,
});

// 2. Ignore specific noisy warnings
LogBox.ignoreLogs([
    // Suppress "Expo AV has been deprecated" warning
    // Note: Using expo-av temporarily until expo-audio API is properly documented
    /Expo AV has been deprecated/,
    'Expo AV has been deprecated',
]);
