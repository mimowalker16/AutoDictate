import { useCallback, useEffect, useRef, useState } from 'react';
import { Audio } from 'expo-av';
import { RecordingResult, startRecording, stopRecording, pauseRecording, resumeRecording } from '@/audio/AudioRecorder';

export const useAudioRecorder = () => {
  const recordingRef = useRef<Audio.Recording | null>(null);
  const meterInterval = useRef<ReturnType<typeof setInterval> | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
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
        // Fallback to simple visual feedback
        setLevel(Math.random() * 0.3 + 0.4);
      }
    }, 120);
  }, [stopMeter]);

  const begin = useCallback(async () => {
    setError(null);
    try {
      recordingRef.current = await startRecording();
      setIsRecording(true);
      setIsPaused(false);
      startMeter();
    } catch (err) {
      console.warn(err);
      setError((err as Error).message);
      setIsRecording(false);
    }
  }, [startMeter]);

  const pause = useCallback(async () => {
    if (!recordingRef.current || isPaused) return;
    try {
      await pauseRecording(recordingRef.current);
      setIsPaused(true);
      stopMeter();
    } catch (err) {
      console.warn('Pause failed', err);
    }
  }, [isPaused, stopMeter]);

  const resume = useCallback(async () => {
    if (!recordingRef.current || !isPaused) return;
    try {
      await resumeRecording(recordingRef.current);
      setIsPaused(false);
      startMeter();
    } catch (err) {
      console.warn('Resume failed', err);
    }
  }, [isPaused, startMeter]);

  const togglePause = useCallback(async () => {
    if (isPaused) {
      await resume();
    } else {
      await pause();
    }
  }, [isPaused, pause, resume]);

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
      setIsPaused(false);
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
    isPaused,
    error,
    level,
    start: begin,
    stop,
    togglePause,
  };
};
