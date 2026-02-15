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
    // Updated to use expo-audio package following SDK 54 deprecation
    /Expo AV has been deprecated/,
    'Expo AV has been deprecated',
]);
