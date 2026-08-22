import React from 'react';
import { Alert } from 'react-native';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import HomeScreen from '../app/(tabs)/home';
import { useAuth } from '../lib/auth-context';
import { getProfile, getTrainingProfile } from '../lib/profile';
import { getCurrentPlan, fetchRecipes } from '../lib/mealPlanData';
import { fetchMyCompletions } from '../lib/workoutCompletionsData';
import { computeStats } from '../lib/workoutGamification';
import { getNotificationStatus, enableNotifications, disableNotifications } from '../lib/pushNotifications';
import { router } from 'expo-router';

jest.mock('../lib/auth-context', () => ({
  useAuth: jest.fn(),
}));

jest.mock('../lib/workoutGamification', () => ({
  computeStats: jest.fn(),
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
    (computeStats as jest.Mock).mockReturnValue({
      totalCompletions: 0,
      streak: 0,
      thisWeekDays: 0,
      totalPoints: 0,
      level: 1,
      teamBonusCount: 0,
      teamBonusStreak: 0,
    });
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

  it("renders Dualo and a state-aware line instead of the raw email", async () => {
    (getNotificationStatus as jest.Mock).mockResolvedValue({ enabled: false, canAskAgain: true });
    const { getByTestId, queryByText } = await render(<HomeScreen />);

    await waitFor(() => expect(getByTestId('mascot-image')).toBeTruthy());
    expect(queryByText('test@example.com')).toBeNull();
  });

  it('leads with a plan-ready line when today has meals', async () => {
    (getNotificationStatus as jest.Mock).mockResolvedValue({ enabled: false, canAskAgain: true });
    (getCurrentPlan as jest.Mock).mockResolvedValue({
      id: 'plan-1',
      targetCalories: 2000,
      entries: [
        {
          id: 'entry-1',
          dayIndex: (new Date().getDay() + 6) % 7, // app's Monday=0 convention, see lib/mealPlan.ts todayDayIndex()
          mealType: 'lunch',
          recipeId: 'r1',
          portionMultiplier: 1,
        },
      ],
    });
    (fetchRecipes as jest.Mock).mockResolvedValue([{ id: 'r1', name: 'Poulet' } as any]);

    const { findByText, findByLabelText } = await render(<HomeScreen />);

    expect(await findByText('Ton programme du jour est prêt.')).toBeTruthy();
    expect(await findByLabelText('Déjeuner : Poulet')).toBeTruthy();
  });

  it('leads with a streak line when the user has an active streak', async () => {
    (getNotificationStatus as jest.Mock).mockResolvedValue({ enabled: false, canAskAgain: true });
    (computeStats as jest.Mock).mockReturnValue({
      totalCompletions: 5,
      streak: 3,
      thisWeekDays: 2,
      totalPoints: 50,
      level: 2,
      teamBonusCount: 0,
      teamBonusStreak: 0,
    });

    const { findByText, findByLabelText } = await render(<HomeScreen />);

    expect(await findByText('Série de 3 semaines — continue comme ça.')).toBeTruthy();
    expect(await findByLabelText('Progression : série de 3, niveau 2, 2 sur 3 jours cette semaine')).toBeTruthy();
  });

  it('offers a sport entry point that navigates to the workout tab', async () => {
    (getNotificationStatus as jest.Mock).mockResolvedValue({ enabled: false, canAskAgain: true });
    const { findByText } = await render(<HomeScreen />);

    await fireEvent.press(await findByText("S'entraîner"));

    expect(router.push).toHaveBeenCalledWith('/workout');
  });

  it('asks for confirmation before signing out, and only signs out on confirm', async () => {
    (getNotificationStatus as jest.Mock).mockResolvedValue({ enabled: false, canAskAgain: true });
    const signOut = jest.fn();
    (useAuth as jest.Mock).mockReturnValue({
      session: { user: { id: 'user-1', email: 'test@example.com' } },
      loading: false,
      signOut,
    });
    const alertSpy = jest.spyOn(Alert, 'alert').mockImplementation(() => {});

    const { findByText } = await render(<HomeScreen />);
    await fireEvent.press(await findByText('Se déconnecter'));

    expect(alertSpy).toHaveBeenCalledTimes(1);
    expect(signOut).not.toHaveBeenCalled();

    // Simulate the user tapping the destructive "Se déconnecter" button in the alert.
    const buttons = alertSpy.mock.calls[0][2] as { text: string; onPress?: () => void }[];
    const confirmButton = buttons.find((b) => b.text === 'Se déconnecter');
    confirmButton?.onPress?.();

    expect(signOut).toHaveBeenCalledTimes(1);
    alertSpy.mockRestore();
  });
});
