import '@/utils/warnings';
import 'react-native-gesture-handler';
import 'react-native-reanimated';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NotesProvider } from '@/context/NotesContext';
import { colors } from '@/styles/theme';

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <GestureHandlerRootView style={{ flex: 1, backgroundColor: colors.background }}>
        <NotesProvider>
          <StatusBar style="light" />
          <Stack
            screenOptions={{
              headerShown: false,
              contentStyle: { backgroundColor: colors.background },
            }}>
            <Stack.Screen name="(tabs)" />
            <Stack.Screen name="processing" options={{ presentation: 'modal' }} />
            <Stack.Screen name="note/[id]" />
          </Stack>
        </NotesProvider>
      </GestureHandlerRootView>
    </SafeAreaProvider>
  );
}
