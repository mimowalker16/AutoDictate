import { Audio } from 'expo-audio';
import type { AudioStatus } from 'expo-audio';


export const createAudioPlayer = () => {
  const sound = new Audio.Sound();
  let currentUri: string | null = null;

  const loadAudio = async (
    uri: string,
    onUpdate?: (status: AudioStatus) => void,
  ) => {
    if (currentUri === uri) return;
    try {
      await sound.unloadAsync();
    } catch {
      /* ignore unload errors */
    }
    await sound.loadAsync({ uri }, {}, true);
    if (onUpdate) {
      sound.setOnPlaybackStatusUpdate((status) => {
        if (status.isLoaded) {
          onUpdate(status);
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

  const getStatus = () => sound.getStatusAsync();

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
