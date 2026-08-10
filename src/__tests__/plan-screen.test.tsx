import React from 'react';
import { render, waitFor } from '@testing-library/react-native';
import PlanScreen from '../app/(tabs)/plan';
import { useAuth } from '../lib/auth-context';
import { getCurrentPlan, fetchRecipes } from '../lib/mealPlanData';

jest.mock('../lib/auth-context', () => ({
  useAuth: jest.fn(),
}));

jest.mock('../lib/mealPlanData', () => ({
  getCurrentPlan: jest.fn(),
  updatePlanEntry: jest.fn(),
  fetchRecipes: jest.fn(),
}));

jest.mock('expo-router', () => ({
  router: { replace: jest.fn(), push: jest.fn() },
  useFocusEffect: (effect: () => void) => {
    const { useEffect } = require('react');
    useEffect(effect, []);
  },
}));

describe('PlanScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (useAuth as jest.Mock).mockReturnValue({ session: { user: { id: 'user-1' } }, loading: false });
    (getCurrentPlan as jest.Mock).mockResolvedValue(null);
    (fetchRecipes as jest.Mock).mockResolvedValue([]);
  });

  it('shows the idle mascot in the empty-plan state', async () => {
    const { getByTestId } = await render(<PlanScreen />);
    await waitFor(() => expect(getByTestId('mascot-image')).toBeTruthy());
  });
});
