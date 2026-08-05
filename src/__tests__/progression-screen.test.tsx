// src/__tests__/progression-screen.test.tsx
import React from 'react';
import { render } from '@testing-library/react-native';
import ProgressionScreen from '../app/progression';
import { useAuth } from '../lib/auth-context';
import { fetchMyCompletions, fetchTeamWeekProgress } from '../lib/workoutCompletionsData';

jest.mock('../lib/auth-context', () => ({
  useAuth: jest.fn(),
}));

jest.mock('../lib/workoutCompletionsData', () => ({
  fetchMyCompletions: jest.fn(),
  fetchTeamWeekProgress: jest.fn(),
}));

jest.mock('expo-router', () => ({
  useFocusEffect: (effect: () => void) => {
    const { useEffect } = require('react');
    useEffect(effect, []);
  },
}));

describe('ProgressionScreen', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2026-08-05T12:00:00Z'));
    jest.clearAllMocks();
    (useAuth as jest.Mock).mockReturnValue({
      session: { user: { id: 'user-1' } },
      loading: false,
    });
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('shows streak, level, points, this-week progress, team bonus and all seven badge labels', async () => {
    (fetchMyCompletions as jest.Mock).mockResolvedValue([
      { id: 'c1', sessionIndex: 0, completedDate: '2026-08-03' },
      { id: 'c2', sessionIndex: 1, completedDate: '2026-08-04' },
      { id: 'c3', sessionIndex: 2, completedDate: '2026-08-05' },
    ]);
    (fetchTeamWeekProgress as jest.Mock).mockResolvedValue([
      { userId: 'partner-1', weekStart: '2026-08-03', days: 2 },
    ]);

    const { findByText, getByText } = await render(<ProgressionScreen />);

    expect(await findByText('3/3 séances cette semaine')).toBeTruthy();
    expect(getByText('Niv. 1')).toBeTruthy();
    expect(getByText('Vous deux : 5/6 séances cette semaine — bonus à 6/6')).toBeTruthy();

    for (const label of [
      'Première séance',
      'Habitué',
      'Vétéran',
      'Un mois sans faute',
      'Sur la durée',
      "Esprit d'équipe",
      'Duo en or',
    ]) {
      expect(getByText(label)).toBeTruthy();
    }
  });

  it('shows a localized error and still renders personal stats when the team fetch fails', async () => {
    (fetchMyCompletions as jest.Mock).mockResolvedValue([]);
    (fetchTeamWeekProgress as jest.Mock).mockRejectedValue(new Error('network'));

    const { findByText } = await render(<ProgressionScreen />);

    expect(await findByText('Impossible de charger la progression du binôme.')).toBeTruthy();
    expect(await findByText('0/3 séances cette semaine')).toBeTruthy();
  });
});
