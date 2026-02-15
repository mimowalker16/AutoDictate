import { Audio } from 'expo-av';
// Use legacy API to avoid deprecation warnings in SDK 54
import * as FileSystem from 'expo-file-system/legacy';
import { Platform } from 'react-native';

export type RecordingResult = {
  uri: string;
  duration: number;
  fileName: string;
};

const prepareAudioMode = async () => {
  const permission = await Audio.requestPermissionsAsync();
  if (!permission.granted) {
    throw new Error('Microphone permission is required to record audio.');
  }
  
  await Audio.setAudioModeAsync({
    allowsRecordingIOS: true,
    playsInSilentModeIOS: true,
    staysActiveInBackground: false,
    shouldDuckAndroid: true,
  });
};

export const startRecording = async () => {
  await prepareAudioMode();
  const recording = new Audio.Recording();
  const options = Audio.RecordingOptionsPresets.HIGH_QUALITY;
  await recording.prepareToRecordAsync(options);
  await recording.startAsync();
  return recording;
};

export const stopRecording = async (recording: Audio.Recording): Promise<RecordingResult> => {
  await recording.stopAndUnloadAsync();
  const uri = recording.getURI();
  const status = await recording.getStatusAsync();
  const duration = status.durationMillis ?? 0;
  const fileName = uri?.split('/').pop() ?? `autodictate-${Date.now()}.m4a`;

  if (!uri) {
    throw new Error('Recording URI missing');
  }

  // On web we cannot move the file; just return the temp uri
  if (Platform.OS === 'web') {
    return { uri, duration, fileName };
  }

  // Persist to a stable location to avoid cache cleanup removing the file
  const recordingsDir = `${FileSystem.documentDirectory}recordings/`;
  await FileSystem.makeDirectoryAsync(recordingsDir, { intermediates: true }).catch(() => {});
  const target = `${recordingsDir}${Date.now()}-${fileName}`;
  try {
    await FileSystem.moveAsync({ from: uri, to: target });
  } catch (error) {
    // If move fails (e.g., cross-volume), fall back to original uri
    console.warn('Could not persist recording, using temp URI', error);
    return { uri, duration, fileName };
  }

  return { uri: target, duration, fileName };
};
