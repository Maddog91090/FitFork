import { useCallback, useEffect, useRef, useState } from 'react';

export type StepTimer = {
  remainingSeconds: number;
  isPaused: boolean;
  pause: () => void;
  resume: () => void;
};

export function useStepTimer(totalSeconds: number, onComplete: () => void): StepTimer {
  const [remainingSeconds, setRemainingSeconds] = useState(totalSeconds);
  const [isPaused, setIsPaused] = useState(false);
  const deadlineRef = useRef(Date.now() + totalSeconds * 1000);
  const pausedRemainingRef = useRef(totalSeconds);
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;

  useEffect(() => {
    deadlineRef.current = Date.now() + totalSeconds * 1000;
    pausedRemainingRef.current = totalSeconds;
    setRemainingSeconds(totalSeconds);
    setIsPaused(false);
  }, [totalSeconds]);

  useEffect(() => {
    if (isPaused) return undefined;

    const interval = setInterval(() => {
      const msLeft = deadlineRef.current - Date.now();
      const secondsLeft = Math.max(0, Math.ceil(msLeft / 1000));
      setRemainingSeconds((prev) => (prev === secondsLeft ? prev : secondsLeft));
      if (msLeft <= 0) {
        clearInterval(interval);
        onCompleteRef.current();
      }
    }, 200);

    return () => clearInterval(interval);
  }, [isPaused]);

  const pause = useCallback(() => {
    pausedRemainingRef.current = Math.max(0, Math.ceil((deadlineRef.current - Date.now()) / 1000));
    setIsPaused(true);
  }, []);

  const resume = useCallback(() => {
    deadlineRef.current = Date.now() + pausedRemainingRef.current * 1000;
    setIsPaused(false);
  }, []);

  return { remainingSeconds, isPaused, pause, resume };
}
