import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import HomeScreen from '../app/(tabs)/home';
import { useAuth } from '../lib/auth-context';
import { getProfile, getTrainingProfile } from '../lib/profile';
import { getCurrentPlan, fetchRecipes } from '../lib/mealPlanData';
import { fetchMyCompletions } from '../lib/workoutCompletionsData';
import { getNotificationStatus, enableNotifications, disableNotifications } from '../lib/pushNotifications';

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
}));

jest.mock('../lib/pushNotifications', () => ({
  getNotificationStatus: jest.fn(),
  enableNotifications: jest.fn(),
  disableNotifications: jest.fn(),
}));

jest.mock('expo-router', () => ({
  router: { replace: jest.fn(), push: jest.fn() },
  useFocusEffect: (effect: () => void) => {
    const { useEffect } = require('react');
    useEffect(effect, []);
  },
}));

describe('HomeScreen notifications toggle', () => {
  beforeEach(() => {
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
      activityLevel: 'sedentary',
      goal: 'maintain',
    });
    (getTrainingProfile as jest.Mock).mockResolvedValue({ daysPerWeek: 3, experienceLevel: 'beginner', equipment: 'bodyweight' });
    (getCurrentPlan as jest.Mock).mockResolvedValue(null);
    (fetchRecipes as jest.Mock).mockResolvedValue([]);
    (fetchMyCompletions as jest.Mock).mockResolvedValue([]);
  });

  it('shows the toggle off when notifications are disabled', async () => {
    (getNotificationStatus as jest.Mock).mockResolvedValue({ enabled: false, canAskAgain: true });
    const { findByRole } = await render(<HomeScreen />);

    const toggle = await findByRole('switch');
    expect(toggle.props.value).toBe(false);
  });

  it('shows the toggle on when notifications are enabled', async () => {
    (getNotificationStatus as jest.Mock).mockResolvedValue({ enabled: true, canAskAgain: true });
    const { findByRole } = await render(<HomeScreen />);

    const toggle = await findByRole('switch');
    expect(toggle.props.value).toBe(true);
  });

  it('calls enableNotifications when switched on', async () => {
    (getNotificationStatus as jest.Mock).mockResolvedValue({ enabled: false, canAskAgain: true });
    (enableNotifications as jest.Mock).mockResolvedValue(true);
    const { findByRole } = await render(<HomeScreen />);

    const toggle = await findByRole('switch');
    await fireEvent(toggle, 'valueChange', true);

    await waitFor(() => expect(enableNotifications).toHaveBeenCalledWith('user-1'));
  });

  it('calls disableNotifications when switched off', async () => {
    (getNotificationStatus as jest.Mock).mockResolvedValue({ enabled: true, canAskAgain: true });
    (disableNotifications as jest.Mock).mockResolvedValue(undefined);
    const { findByRole } = await render(<HomeScreen />);

    const toggle = await findByRole('switch');
    await fireEvent(toggle, 'valueChange', false);

    await waitFor(() => expect(disableNotifications).toHaveBeenCalledWith('user-1'));
  });
});
