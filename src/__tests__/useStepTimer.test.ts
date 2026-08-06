import { renderHook, act } from '@testing-library/react-native';
import { useStepTimer } from '../lib/useStepTimer';

describe('useStepTimer', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2026-08-05T12:00:00.000Z'));
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('counts down from the given total and calls onComplete at zero', () => {
    const onComplete = jest.fn();
    const { result } = renderHook(() => useStepTimer(3, onComplete));

    expect(result.current.remainingSeconds).toBe(3);

    act(() => {
      jest.advanceTimersByTime(1000);
    });
    expect(result.current.remainingSeconds).toBe(2);

    act(() => {
      jest.advanceTimersByTime(1000);
    });
    expect(result.current.remainingSeconds).toBe(1);
    expect(onComplete).not.toHaveBeenCalled();

    act(() => {
      jest.advanceTimersByTime(1000);
    });
    expect(result.current.remainingSeconds).toBe(0);
    expect(onComplete).toHaveBeenCalledTimes(1);
  });

  it('stops counting down while paused, and resumes from the paused value', () => {
    const onComplete = jest.fn();
    const { result } = renderHook(() => useStepTimer(5, onComplete));

    act(() => {
      jest.advanceTimersByTime(2000);
    });
    expect(result.current.remainingSeconds).toBe(3);

    act(() => {
      result.current.pause();
    });
    expect(result.current.isPaused).toBe(true);

    act(() => {
      jest.advanceTimersByTime(3000);
    });
    expect(result.current.remainingSeconds).toBe(3);

    act(() => {
      result.current.resume();
    });
    expect(result.current.isPaused).toBe(false);

    act(() => {
      jest.advanceTimersByTime(3000);
    });
    expect(result.current.remainingSeconds).toBe(0);
    expect(onComplete).toHaveBeenCalledTimes(1);
  });

  it('resets to the new total when totalSeconds changes', () => {
    const onComplete = jest.fn();
    const { result, rerender } = renderHook(({ seconds }) => useStepTimer(seconds, onComplete), {
      initialProps: { seconds: 3 },
    });

    act(() => {
      jest.advanceTimersByTime(2000);
    });
    expect(result.current.remainingSeconds).toBe(1);

    rerender({ seconds: 10 });
    expect(result.current.remainingSeconds).toBe(10);
  });
});
