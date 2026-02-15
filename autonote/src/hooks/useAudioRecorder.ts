import { useCallback, useEffect, useRef, useState } from 'react';
import { Audio } from 'expo-audio';
import { RecordingResult, startRecording, stopRecording } from '@/audio/AudioRecorder';

export const useAudioRecorder = () => {
  const recordingRef = useRef<Audio.Recording | null>(null);
  const meterInterval = useRef<ReturnType<typeof setInterval> | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [level, setLevel] = useState(0);

  const stopMeter = useCallback(() => {
    if (meterInterval.current) {
      clearInterval(meterInterval.current);
      meterInterval.current = null;
    }
    setLevel(0);
  }, []);

  const startMeter = useCallback(() => {
    stopMeter();
    meterInterval.current = setInterval(async () => {
      if (!recordingRef.current) return;
      try {
        const status = await recordingRef.current.getStatusAsync();
        const metering = (status as any)?.metering;
        if (typeof metering === 'number') {
          const normalized = Math.min(1, Math.max(0, 1 + metering / 60)); // -60dB -> 0, 0dB -> 1
          setLevel(normalized);
        }
      } catch {
        // ignore meter errors
      }
    }, 120);
  }, [stopMeter]);

  const begin = useCallback(async () => {
    setError(null);
    try {
      recordingRef.current = await startRecording();
      setIsRecording(true);
      startMeter();
    } catch (err) {
      console.warn(err);
      setError((err as Error).message);
      setIsRecording(false);
    }
  }, [startMeter]);

  const stop = useCallback(async (): Promise<RecordingResult | null> => {
    if (!recordingRef.current) return null;
    try {
      const result = await stopRecording(recordingRef.current);
      return result;
    } catch (err) {
      setError((err as Error).message);
      return null;
    } finally {
      setIsRecording(false);
      recordingRef.current = null;
      stopMeter();
    }
  }, [stopMeter]);

  useEffect(
    () => () => {
      stopMeter();
    },
    [stopMeter],
  );

  return {
    isRecording,
    error,
    level,
    start: begin,
    stop,
  };
};
