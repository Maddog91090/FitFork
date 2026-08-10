import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { router } from 'expo-router';
import WorkoutScreen from '../app/(tabs)/workout';
import { useAuth } from '../lib/auth-context';
import { getTrainingProfile } from '../lib/profile';
import {
  logSessionCompletion,
  undoSessionCompletion,
  fetchCompletionForToday,
} from '../lib/workoutCompletionsData';

jest.mock('../lib/auth-context', () => ({
  useAuth: jest.fn(),
}));

jest.mock('../lib/profile', () => ({
  getTrainingProfile: jest.fn(),
  upsertTrainingProfile: jest.fn(),
}));

jest.mock('../lib/workoutCompletionsData', () => ({
  logSessionCompletion: jest.fn(),
  undoSessionCompletion: jest.fn(),
  fetchCompletionForToday: jest.fn(),
}));

jest.mock('expo-router', () => ({
  router: { replace: jest.fn(), push: jest.fn() },
  useFocusEffect: (effect: () => void) => {
    const { useEffect } = require('react');
    useEffect(effect, []);
  },
}));

describe('WorkoutScreen completion button', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2026-08-05T12:00:00Z'));
    jest.clearAllMocks();
    (useAuth as jest.Mock).mockReturnValue({
      session: { user: { id: 'user-1' } },
      loading: false,
    });
    (getTrainingProfile as jest.Mock).mockResolvedValue({
      daysPerWeek: 3,
      experienceLevel: 'beginner',
      equipment: 'bodyweight',
    });
    (fetchCompletionForToday as jest.Mock).mockResolvedValue(null);
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('shows the button, then the done pill after marking the session complete', async () => {
    (logSessionCompletion as jest.Mock).mockResolvedValue(undefined);
    const { getByText, findByText, queryByText } = await render(<WorkoutScreen />);

    await findByText('Marquer comme terminée');

    (fetchCompletionForToday as jest.Mock).mockResolvedValue({
      id: 'c1',
      sessionIndex: 0,
      completedDate: '2026-08-05',
    });
    await fireEvent.press(getByText('Marquer comme terminée'));

    await waitFor(() => expect(logSessionCompletion).toHaveBeenCalledWith('user-1', 0));
    expect(await findByText("Fait aujourd'hui ✓")).toBeTruthy();
    expect(queryByText('Marquer comme terminée')).toBeNull();
  });

  it('reverts to the button after pressing "Annuler"', async () => {
    (fetchCompletionForToday as jest.Mock).mockResolvedValue({
      id: 'c1',
      sessionIndex: 0,
      completedDate: '2026-08-05',
    });
    (undoSessionCompletion as jest.Mock).mockResolvedValue(undefined);
    const { findByText, getByText, queryByText } = await render(<WorkoutScreen />);

    await findByText("Fait aujourd'hui ✓");

    (fetchCompletionForToday as jest.Mock).mockResolvedValue(null);
    await fireEvent.press(getByText('Annuler'));

    await waitFor(() => expect(undoSessionCompletion).toHaveBeenCalledWith('user-1', 0, '2026-08-05'));
    expect(await findByText('Marquer comme terminée')).toBeTruthy();
    expect(queryByText("Fait aujourd'hui ✓")).toBeNull();
  });

  it('navigates to the guided session player when "Commencer" is pressed', async () => {
    const { findByText, getByText } = await render(<WorkoutScreen />);

    await findByText('Commencer');
    await fireEvent.press(getByText('Commencer'));

    expect(router.push).toHaveBeenCalledWith({
      pathname: '/workout-session',
      params: { level: 'beginner', sessionIndex: '0' },
    });
  });

  it('shows the idle mascot in the header', async () => {
    const { getByTestId } = await render(<WorkoutScreen />);
    await waitFor(() => expect(getByTestId('mascot-image')).toBeTruthy());
  });
});
