import React from 'react';
import { render, fireEvent, waitFor, act } from '@testing-library/react-native';
import WorkoutSessionScreen from '../app/workout-session';
import { router, useLocalSearchParams } from 'expo-router';
import { useAuth } from '../lib/auth-context';
import { getLevelProgram } from '../lib/homeWorkoutProgram';
import { logSessionCompletion } from '../lib/workoutCompletionsData';
import { useAudioPlayer } from 'expo-audio';

jest.mock('../lib/auth-context', () => ({
  useAuth: jest.fn(),
}));

jest.mock('../lib/workoutCompletionsData', () => ({
  logSessionCompletion: jest.fn(),
}));

jest.mock('../lib/homeWorkoutProgram', () => {
  const actual = jest.requireActual('../lib/homeWorkoutProgram');
  return { ...actual, getLevelProgram: jest.fn() };
});

// uri sources, not numeric require()-style ids: expo-image's asset pipeline
// resolves numeric mocks to an identical placeholder object, which would
// make the two exercises' images indistinguishable in the assertions below.
jest.mock('../lib/exercises', () => ({
  getExercise: jest.fn((id: string) => {
    if (id === 'a') {
      return {
        id: 'a',
        name: 'Exercice A',
        instructions: [],
        imageStart: { uri: 'https://example.com/a-start.jpg' },
        imageEnd: { uri: 'https://example.com/a-end.jpg' },
      };
    }
    if (id === 'x') {
      return {
        id: 'x',
        name: 'Exercice X',
        instructions: [],
        imageStart: { uri: 'https://example.com/x-start.jpg' },
        imageEnd: { uri: 'https://example.com/x-end.jpg' },
      };
    }
    return undefined;
  }),
}));

jest.mock('expo-router', () => ({
  router: { replace: jest.fn(), push: jest.fn() },
  useLocalSearchParams: jest.fn(),
}));

jest.mock('expo-keep-awake', () => ({
  useKeepAwake: jest.fn(),
}));

const mockBeepPlayer = { play: jest.fn(), pause: jest.fn(), seekTo: jest.fn() };
jest.mock('expo-audio', () => ({
  useAudioPlayer: jest.fn(),
}));

const circuitFixture = {
  type: 'circuit' as const,
  name: 'Test Circuit',
  image: 1,
  workSeconds: 8,
  restSeconds: 2,
  rounds: 1,
  recoverySeconds: 5,
  recoveryLabel: '5 s de récup',
  exercises: [
    { name: 'Exercice A', exerciseId: 'a' },
    { name: 'Exercice B', exerciseId: 'b' },
  ],
};

const seriesFixture = {
  type: 'series' as const,
  name: 'Test Series',
  image: 1,
  restSeconds: 2,
  restLabel: '2 s',
  exercises: [{ name: 'Exercice X', detail: '3 x 12', exerciseId: 'x' }],
};

function mockParams(level: string, sessionIndex: string) {
  (useLocalSearchParams as jest.Mock).mockReturnValue({ level, sessionIndex });
}

describe('WorkoutSessionScreen', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2026-08-05T12:00:00Z'));
    jest.clearAllMocks();
    (useAuth as jest.Mock).mockReturnValue({ session: { user: { id: 'user-1' } }, loading: false });
    (getLevelProgram as jest.Mock).mockReturnValue({
      level: 'beginner',
      label: 'Débutant',
      summary: '',
      sessionDurationLabel: '',
      sessions: [circuitFixture, circuitFixture, seriesFixture],
    });
    (useAudioPlayer as jest.Mock).mockReturnValue(mockBeepPlayer);
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('shows the first work step with its countdown and exercise name', async () => {
    mockParams('beginner', '0');
    const { findByText } = await render(<WorkoutSessionScreen />);

    expect(await findByText('Exercice A')).toBeTruthy();
    expect(await findByText('Tour 1/1')).toBeTruthy();
    expect(await findByText('8')).toBeTruthy();
  });

  it('advances to the rest step when "Passer" is pressed', async () => {
    mockParams('beginner', '0');
    const { findByText, getByText } = await render(<WorkoutSessionScreen />);

    await findByText('Exercice A');
    await fireEvent.press(getByText('Passer'));

    expect(await findByText('Repos')).toBeTruthy();
    expect(await findByText('Ensuite : Exercice B')).toBeTruthy();
  });

  it('shows the manual step detail for a series session and advances on "Terminé"', async () => {
    mockParams('beginner', '2');
    const { findByText, getByText } = await render(<WorkoutSessionScreen />);

    expect(await findByText('Exercice X')).toBeTruthy();
    expect(await findByText('3 x 12')).toBeTruthy();

    await fireEvent.press(getByText('Terminé'));

    expect(await findByText('Séance terminée')).toBeTruthy();
  });

  it('logs completion and returns to the workout tab when finishing', async () => {
    mockParams('beginner', '2');
    (logSessionCompletion as jest.Mock).mockResolvedValue(undefined);
    const { findByText, getByText } = await render(<WorkoutSessionScreen />);

    await findByText('Exercice X');
    await fireEvent.press(getByText('Terminé'));
    await fireEvent.press(await findByText('Marquer la séance comme terminée'));

    await waitFor(() => expect(logSessionCompletion).toHaveBeenCalledWith('user-1', 2));
    expect(router.replace).toHaveBeenCalledWith('/(tabs)/workout');
  });

  it('shows a celebration icon on the finished screen', async () => {
    mockParams('beginner', '2');
    const { findByText, getByTestId } = await render(<WorkoutSessionScreen />);

    await fireEvent.press(await findByText('Terminé'));

    expect(await findByText('Séance terminée')).toBeTruthy();
    expect(getByTestId('celebration-icon').props.name).toBe('celebration');
  });

  it('beeps only once the countdown enters its last 5 seconds, then auto-advances at zero', async () => {
    mockParams('beginner', '0');
    const { findByText } = await render(<WorkoutSessionScreen />);

    await findByText('Exercice A');

    // workSeconds is 8; after 2s, remainingSeconds is 6 — still outside the
    // last-5-seconds beep window.
    await act(async () => {
      jest.advanceTimersByTime(2000);
    });
    expect(mockBeepPlayer.play).not.toHaveBeenCalled();

    // After 4 more seconds (6s elapsed total), remainingSeconds is 2 — inside
    // the beep window.
    await act(async () => {
      jest.advanceTimersByTime(4000);
    });
    expect(mockBeepPlayer.play).toHaveBeenCalled();

    // After the remaining 2s (8s elapsed total), the step completes and
    // auto-advances to the rest step.
    await act(async () => {
      jest.advanceTimersByTime(2000);
    });
    expect(await findByText('Repos')).toBeTruthy();
  });

  it('shows the exercise photos during a work step', async () => {
    mockParams('beginner', '0');
    const { findByText, getByTestId } = await render(<WorkoutSessionScreen />);

    await findByText('Exercice A');

    // expo-image normalizes a single source into a one-element source list.
    expect(getByTestId('exercise-photo-start').props.source).toEqual([{ uri: 'https://example.com/a-start.jpg' }]);
    expect(getByTestId('exercise-photo-end').props.source).toEqual([{ uri: 'https://example.com/a-end.jpg' }]);
  });

  it('shows the exercise photos during a manual step', async () => {
    mockParams('beginner', '2');
    const { findByText, getByTestId } = await render(<WorkoutSessionScreen />);

    await findByText('Exercice X');

    expect(getByTestId('exercise-photo-start').props.source).toEqual([{ uri: 'https://example.com/x-start.jpg' }]);
    expect(getByTestId('exercise-photo-end').props.source).toEqual([{ uri: 'https://example.com/x-end.jpg' }]);
  });

  it('shows no exercise photos during a rest step', async () => {
    mockParams('beginner', '0');
    const { findByText, getByText, queryByTestId } = await render(<WorkoutSessionScreen />);

    await findByText('Exercice A');
    await fireEvent.press(getByText('Passer'));

    await findByText('Repos');
    expect(queryByTestId('exercise-photo-start')).toBeNull();
    expect(queryByTestId('exercise-photo-end')).toBeNull();
  });
});
