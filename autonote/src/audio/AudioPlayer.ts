import { Audio } from 'expo-av';
import type { AVPlaybackStatusSuccess } from 'expo-av';

export const createAudioPlayer = () => {
  const sound = new Audio.Sound();
  let currentUri: string | null = null;

  const loadAudio = async (
    uri: string,
    onUpdate?: (status: AVPlaybackStatusSuccess) => void,
  ) => {
    if (currentUri === uri) return;
    try {
      await sound.unloadAsync();
    } catch {
      /* ignore unload errors */
    }
    await sound.loadAsync({ uri });
    if (onUpdate) {
      sound.setOnPlaybackStatusUpdate((status) => {
        if (status.isLoaded) {
          onUpdate(status as AVPlaybackStatusSuccess);
        }
      });
    }
    currentUri = uri;
  };

  const play = async () => {
    await sound.playAsync();
  };

  const pause = async () => {
    await sound.pauseAsync();
  };

  const seekTo = async (ms: number) => {
    await sound.setPositionAsync(ms);
  };

  const unload = async () => {
    await sound.unloadAsync();
    currentUri = null;
  };

  const getStatus = async () => {
    return await sound.getStatusAsync();
  };

  return {
    loadAudio,
    play,
    pause,
    seekTo,
    unload,
    getStatus,
    sound,
  };
};
