import React from 'react';
import { render, waitFor } from '@testing-library/react-native';
import GroceryListScreen from '../app/(tabs)/grocery-list';
import { useAuth } from '../lib/auth-context';
import { getCurrentPlan } from '../lib/mealPlanData';

jest.mock('../lib/auth-context', () => ({
  useAuth: jest.fn(),
}));

jest.mock('../lib/mealPlanData', () => ({
  getCurrentPlan: jest.fn(),
  fetchRecipeIngredients: jest.fn(),
}));

jest.mock('expo-router', () => ({
  router: { replace: jest.fn(), push: jest.fn() },
  useFocusEffect: (effect: () => void) => {
    const { useEffect } = require('react');
    useEffect(effect, []);
  },
}));

describe('GroceryListScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (useAuth as jest.Mock).mockReturnValue({ session: { user: { id: 'user-1' } }, loading: false });
    (getCurrentPlan as jest.Mock).mockResolvedValue(null);
  });

  it('shows the idle mascot in the empty-plan state', async () => {
    const { getByTestId } = await render(<GroceryListScreen />);
    await waitFor(() => expect(getByTestId('mascot-image')).toBeTruthy());
  });
});
