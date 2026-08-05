// src/__tests__/progression-screen.test.tsx
import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import ProgressionScreen from '../app/progression';
import { useAuth } from '../lib/auth-context';
import { loadGamificationStats } from '../lib/loadGamificationStats';

jest.mock('../lib/auth-context', () => ({
  useAuth: jest.fn(),
}));

jest.mock('../lib/loadGamificationStats', () => ({
  loadGamificationStats: jest.fn(),
}));

const mockPush = jest.fn();

jest.mock('expo-router', () => ({
  router: { push: (...args: unknown[]) => mockPush(...args) },
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

  it('shows streak, level, points, this-week progress, per-friend bonuses and all seven badge labels', async () => {
    (loadGamificationStats as jest.Mock).mockResolvedValue({
      stats: {
        totalCompletions: 3,
        streak: 1,
        thisWeekDays: 3,
        totalPoints: 50,
        level: 1,
        teamBonusCount: 0,
        teamBonusStreak: 0,
      },
      friendBonuses: [
        { friendUserId: 'friend-a', bonusWeekStarts: [], bonusStreak: 0, thisWeekCombinedDays: 5 },
      ],
      friends: [{ friendUserId: 'friend-a', friendEmail: 'a@example.com', friendedAt: '2026-07-01T00:00:00Z' }],
      friendsError: null,
    });

    const { findByText, getByText } = await render(<ProgressionScreen />);

    expect(await findByText('3/3 séances cette semaine')).toBeTruthy();
    expect(getByText('Niv. 1')).toBeTruthy();
    expect(getByText('🔥 1')).toBeTruthy();
    expect(getByText('50')).toBeTruthy();

    expect(getByText("Bonus d'équipe")).toBeTruthy();
    expect(getByText('Avec a@example.com : 5/6 cette semaine — bonus à 6/6')).toBeTruthy();

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

  it('navigates to /friends when the bonus d’équipe section is pressed', async () => {
    (loadGamificationStats as jest.Mock).mockResolvedValue({
      stats: {
        totalCompletions: 0,
        streak: 0,
        thisWeekDays: 0,
        totalPoints: 0,
        level: 1,
        teamBonusCount: 0,
        teamBonusStreak: 0,
      },
      friendBonuses: [],
      friends: [],
      friendsError: null,
    });

    const { findByText, getByText } = await render(<ProgressionScreen />);
    await findByText('Gérer mes amis');

    await fireEvent.press(getByText('Gérer mes amis'));
    expect(mockPush).toHaveBeenCalledWith('/friends');
  });

  it('renders an empty-but-valid state when there are no completions yet', async () => {
    (loadGamificationStats as jest.Mock).mockResolvedValue({
      stats: {
        totalCompletions: 0,
        streak: 0,
        thisWeekDays: 0,
        totalPoints: 0,
        level: 1,
        teamBonusCount: 0,
        teamBonusStreak: 0,
      },
      friendBonuses: [],
      friends: [],
      friendsError: null,
    });

    const { findByText, getByText } = await render(<ProgressionScreen />);

    expect(await findByText('0/3 séances cette semaine')).toBeTruthy();
    expect(getByText('🔥 0')).toBeTruthy();
    expect(getByText('Niv. 1')).toBeTruthy();
    // Les 7 badges restent affichés (verrouillés) même sans aucune séance.
    expect(getByText('Première séance')).toBeTruthy();
    expect(getByText("Esprit d'équipe")).toBeTruthy();
  });

  it('surfaces an error when the completions fetch fails', async () => {
    (loadGamificationStats as jest.Mock).mockRejectedValue(new Error('network'));

    const { findByText } = await render(<ProgressionScreen />);

    expect(await findByText('network')).toBeTruthy();
  });
});
