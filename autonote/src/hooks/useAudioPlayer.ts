import { useCallback, useEffect, useRef, useState } from 'react';
import type { AudioStatus } from 'expo-audio';
import { Platform } from 'react-native';
import { createAudioPlayer } from '@/audio/AudioPlayer';

export const useAudioPlayer = (uri?: string) => {
  const playerRef = useRef(createAudioPlayer());
  const [ready, setReady] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [position, setPosition] = useState(0);
  const [duration, setDuration] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const onUpdate = useCallback((status: AudioStatus) => {
    setReady(status.isLoaded);
    setIsPlaying(status.isPlaying);
    setPosition(status.positionMillis ?? 0);
    setDuration(status.durationMillis ?? 0);
  }, []);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      setError(null);
      setReady(false);
      if (!uri) return;
      // On web, local file paths from devices are not playable
      if (Platform.OS === 'web' && uri.startsWith('file://')) {
        setError('Audio file not available on web. Play it on the recording device.');
        return;
      }

      try {
        await playerRef.current.loadAudio(uri, (status) => {
          if (mounted) onUpdate(status);
        });
        const status = await playerRef.current.getStatus();
        if (status && 'isLoaded' in status && status.isLoaded) {
          onUpdate(status);
        }
      } catch (err) {
        if (mounted) {
          setError((err as Error).message || 'Unable to load audio');
          setReady(false);
        }
      }
    };
    load();
    return () => {
      mounted = false;
      playerRef.current.unload();
    };
  }, [uri, onUpdate]);

  const play = useCallback(async () => {
    if (!ready || error) return;
    await playerRef.current.play();
  }, [ready, error]);

  const pause = useCallback(async () => {
    if (!ready || error) return;
    await playerRef.current.pause();
  }, [ready, error]);

  const toggle = useCallback(async () => {
    if (error) return;
    if (isPlaying) {
      await pause();
    } else {
      await play();
    }
  }, [isPlaying, play, pause, error]);

  const seekTo = useCallback(
    async (ms: number) => {
      if (!ready || error) return;
      await playerRef.current.seekTo(ms);
    },
    [ready, error],
  );

  return {
    ready,
    isPlaying,
    position,
    duration,
    play,
    pause,
    toggle,
    seekTo,
    error,
  };
};
