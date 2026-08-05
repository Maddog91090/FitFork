// src/__tests__/home-progression-card.test.tsx
import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import HomeScreen from '../app/(tabs)/home';
import { useAuth } from '../lib/auth-context';
import { getProfile, getTrainingProfile } from '../lib/profile';
import { getCurrentPlan, fetchRecipes } from '../lib/mealPlanData';
import { fetchMyCompletions, fetchTeamWeekProgress } from '../lib/workoutCompletionsData';

jest.mock('../lib/auth-context', () => ({
  useAuth: jest.fn(),
}));

jest.mock('../lib/profile', () => ({
  getProfile: jest.fn(),
  getTrainingProfile: jest.fn(),
}));

jest.mock('../lib/mealPlanData', () => ({
  getCurrentPlan: jest.fn(),
  fetchRecipes: jest.fn(),
}));

jest.mock('../lib/workoutCompletionsData', () => ({
  fetchMyCompletions: jest.fn(),
  fetchTeamWeekProgress: jest.fn(),
}));

const mockPush = jest.fn();
jest.mock('expo-router', () => ({
  router: { replace: jest.fn(), push: (...args: unknown[]) => mockPush(...args) },
}));

describe('HomeScreen Progression card', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2026-08-05T12:00:00Z'));
    jest.clearAllMocks();
    (useAuth as jest.Mock).mockReturnValue({
      session: { user: { id: 'user-1', email: 'test@example.com' } },
      loading: false,
      signOut: jest.fn(),
    });
    (getProfile as jest.Mock).mockResolvedValue({
      sex: 'male',
      age: 30,
      heightCm: 180,
      weightKg: 80,
      activityLevel: 'moderate',
      goal: 'maintain',
    });
    (getTrainingProfile as jest.Mock).mockResolvedValue({
      daysPerWeek: 3,
      experienceLevel: 'beginner',
      equipment: 'bodyweight',
    });
    (getCurrentPlan as jest.Mock).mockResolvedValue(null);
    (fetchRecipes as jest.Mock).mockResolvedValue([]);
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('shows the streak/level/week summary and navigates to /progression on press', async () => {
    (fetchMyCompletions as jest.Mock).mockResolvedValue([
      { id: 'c1', sessionIndex: 0, completedDate: '2026-08-03' },
      { id: 'c2', sessionIndex: 1, completedDate: '2026-08-04' },
    ]);
    (fetchTeamWeekProgress as jest.Mock).mockResolvedValue([]);

    const { findByText, getByText } = await render(<HomeScreen />);

    expect(await findByText('2/3')).toBeTruthy();
    expect(getByText('Niv. 1')).toBeTruthy();

    await fireEvent.press(getByText('Progression'));
    expect(mockPush).toHaveBeenCalledWith('/progression');
  });

  it('still shows personal stats when the team-progress fetch fails', async () => {
    (fetchMyCompletions as jest.Mock).mockResolvedValue([
      { id: 'c1', sessionIndex: 0, completedDate: '2026-08-03' },
    ]);
    (fetchTeamWeekProgress as jest.Mock).mockRejectedValue(new Error('network'));

    const { findByText } = await render(<HomeScreen />);

    expect(await findByText('1/3')).toBeTruthy();
  });
});
