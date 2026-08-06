// src/__tests__/progression-screen.test.tsx
import React from 'react';
import { render } from '@testing-library/react-native';
import ProgressionScreen from '../app/progression';
import { useAuth } from '../lib/auth-context';
import { fetchMyCompletions } from '../lib/workoutCompletionsData';

jest.mock('../lib/auth-context', () => ({
  useAuth: jest.fn(),
}));

jest.mock('../lib/workoutCompletionsData', () => ({
  fetchMyCompletions: jest.fn(),
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

  it('shows streak, level, points, this-week progress and all seven badge labels', async () => {
    (fetchMyCompletions as jest.Mock).mockResolvedValue([
      { id: 'c1', sessionIndex: 0, completedDate: '2026-08-03' },
      { id: 'c2', sessionIndex: 1, completedDate: '2026-08-04' },
      { id: 'c3', sessionIndex: 2, completedDate: '2026-08-05' },
    ]);

    const { findByText, getByText, queryByText } = await render(<ProgressionScreen />);

    expect(await findByText('3/3 séances cette semaine')).toBeTruthy();
    expect(getByText('Niv. 1')).toBeTruthy();
    expect(getByText('🔥 1')).toBeTruthy();
    // 3 séances x 10 pts + 20 pts d'objectif hebdo atteint, sans bonus d'équipe.
    expect(getByText('50')).toBeTruthy();

    // Le bonus d'équipe est désactivé tant qu'il n'y a pas de vrai système de
    // binôme : la section ne doit plus être rendue du tout.
    expect(queryByText("Bonus d'équipe")).toBeNull();

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

  it('renders an empty-but-valid state when there are no completions yet', async () => {
    (fetchMyCompletions as jest.Mock).mockResolvedValue([]);

    const { findByText, getByText } = await render(<ProgressionScreen />);

    expect(await findByText('0/3 séances cette semaine')).toBeTruthy();
    expect(getByText('🔥 0')).toBeTruthy();
    expect(getByText('Niv. 1')).toBeTruthy();
    // Les 7 badges restent affichés (verrouillés) même sans aucune séance.
    expect(getByText('Première séance')).toBeTruthy();
    expect(getByText("Esprit d'équipe")).toBeTruthy();
  });

  it('surfaces an error when the completions fetch fails', async () => {
    (fetchMyCompletions as jest.Mock).mockRejectedValue(new Error('network'));

    const { findByText } = await render(<ProgressionScreen />);

    expect(await findByText('network')).toBeTruthy();
  });
});
