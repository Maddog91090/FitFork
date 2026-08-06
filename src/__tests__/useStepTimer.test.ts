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

  it('counts down from the given total and calls onComplete at zero', async () => {
    const onComplete = jest.fn();
    const { result } = await renderHook(() => useStepTimer(3, onComplete));

    expect(result.current.remainingSeconds).toBe(3);

    await act(() => {
      jest.advanceTimersByTime(1000);
    });
    expect(result.current.remainingSeconds).toBe(2);

    await act(() => {
      jest.advanceTimersByTime(1000);
    });
    expect(result.current.remainingSeconds).toBe(1);
    expect(onComplete).not.toHaveBeenCalled();

    await act(() => {
      jest.advanceTimersByTime(1000);
    });
    expect(result.current.remainingSeconds).toBe(0);
    expect(onComplete).toHaveBeenCalledTimes(1);
  });

  it('stops counting down while paused, and resumes from the paused value', async () => {
    const onComplete = jest.fn();
    const { result } = await renderHook(() => useStepTimer(5, onComplete));

    await act(() => {
      jest.advanceTimersByTime(2000);
    });
    expect(result.current.remainingSeconds).toBe(3);

    await act(() => {
      result.current.pause();
    });
    expect(result.current.isPaused).toBe(true);

    await act(() => {
      jest.advanceTimersByTime(3000);
    });
    expect(result.current.remainingSeconds).toBe(3);

    await act(() => {
      result.current.resume();
    });
    expect(result.current.isPaused).toBe(false);

    await act(() => {
      jest.advanceTimersByTime(3000);
    });
    expect(result.current.remainingSeconds).toBe(0);
    expect(onComplete).toHaveBeenCalledTimes(1);
  });

  it('resets to the new total when totalSeconds changes', async () => {
    const onComplete = jest.fn();
    const { result, rerender } = await renderHook(({ seconds }) => useStepTimer(seconds, onComplete), {
      initialProps: { seconds: 3 },
    });

    await act(() => {
      jest.advanceTimersByTime(2000);
    });
    expect(result.current.remainingSeconds).toBe(1);

    await rerender({ seconds: 10 });
    expect(result.current.remainingSeconds).toBe(10);
  });
});
