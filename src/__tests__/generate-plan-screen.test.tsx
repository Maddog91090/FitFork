import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import GeneratePlanScreen from '../app/generate-plan';
import { useAuth } from '../lib/auth-context';
import { getProfile, getTrainingProfile } from '../lib/profile';
import { computeTargetsFromProfile } from '../lib/targets';
import { fetchRecipes } from '../lib/mealPlanData';
import { fetchRecentWeightLogs } from '../lib/weightLogData';
import { computeAdjustedTargets } from '../lib/progressTracking';

jest.mock('../lib/auth-context', () => ({
  useAuth: jest.fn(),
}));

jest.mock('../lib/profile', () => ({
  getProfile: jest.fn(),
  getTrainingProfile: jest.fn(),
}));

jest.mock('../lib/targets', () => ({
  computeTargetsFromProfile: jest.fn(),
}));

jest.mock('../lib/mealPlanData', () => ({
  fetchRecipes: jest.fn(),
  fetchRecipeIngredients: jest.fn(),
  saveWeeklyPlan: jest.fn(),
}));

jest.mock('../lib/weightLogData', () => ({
  fetchRecentWeightLogs: jest.fn(),
}));

jest.mock('../lib/progressTracking', () => ({
  computeAdjustedTargets: jest.fn(),
}));

jest.mock('expo-router', () => ({
  router: { replace: jest.fn(), push: jest.fn() },
}));

describe('GeneratePlanScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (useAuth as jest.Mock).mockReturnValue({ session: { user: { id: 'user-1' } }, loading: false });
    (getProfile as jest.Mock).mockResolvedValue({});
    (getTrainingProfile as jest.Mock).mockResolvedValue({});
    (computeTargetsFromProfile as jest.Mock).mockReturnValue({
      calories: 2000,
      proteinG: 150,
      fatG: 60,
      carbsG: 200,
    });
    (fetchRecentWeightLogs as jest.Mock).mockResolvedValue([]);
    (computeAdjustedTargets as jest.Mock).mockReturnValue({
      calories: 2000,
      proteinG: 150,
      fatG: 60,
      carbsG: 200,
    });
  });

  it('shows a refresh icon when generation fails', async () => {
    (fetchRecipes as jest.Mock).mockRejectedValue(new Error('Réseau indisponible'));
    const { getByText, getByTestId } = await render(<GeneratePlanScreen />);
    fireEvent.press(getByText('Générer le plan'));
    await waitFor(() => expect(getByTestId('generate-plan-error-icon')).toBeTruthy());
    expect(getByTestId('generate-plan-error-icon').props.name).toBe('refresh');
  });
});
