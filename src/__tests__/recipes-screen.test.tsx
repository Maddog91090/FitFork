import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import RecipesScreen from '../app/(tabs)/recipes';
import { useAuth } from '../lib/auth-context';
import { fetchRecipes } from '../lib/mealPlanData';

jest.mock('../lib/auth-context', () => ({
  useAuth: jest.fn(),
}));

jest.mock('../lib/mealPlanData', () => ({
  fetchRecipes: jest.fn(),
}));

jest.mock('expo-router', () => ({
  router: { replace: jest.fn(), push: jest.fn() },
  useFocusEffect: (effect: () => void) => {
    const { useEffect } = require('react');
    useEffect(effect, []);
  },
}));

jest.mock('@expo/vector-icons', () => ({
  MaterialIcons: (props: any) => {
    const React = require('react');
    return React.createElement('MaterialIcon', props);
  },
}));

const CHICKEN_RECIPE = {
  id: 'r1',
  name: 'Poulet grillé',
  mealType: 'lunch',
  baseCalories: 500,
  baseProteinG: 40,
  baseFatG: 15,
  baseCarbsG: 50,
  baseServingG: 400,
  imageUrl: null,
  prepTimeMinutes: 20,
  tags: ['poulet'],
};

const VEG_RECIPE = {
  id: 'r2',
  name: 'Buddha bowl',
  mealType: 'lunch',
  baseCalories: 450,
  baseProteinG: 20,
  baseFatG: 12,
  baseCarbsG: 60,
  baseServingG: 400,
  imageUrl: null,
  prepTimeMinutes: 40,
  tags: ['vegetarien'],
};

describe('RecipesScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (useAuth as jest.Mock).mockReturnValue({ session: { user: { id: 'user-1' } }, loading: false });
    (fetchRecipes as jest.Mock).mockResolvedValue([CHICKEN_RECIPE, VEG_RECIPE]);
  });

  it('shows every recipe with no filter selected', async () => {
    const { findByText } = await render(<RecipesScreen />);
    expect(await findByText('Poulet grillé')).toBeTruthy();
    expect(await findByText('Buddha bowl')).toBeTruthy();
  });

  it('narrows the list when a category tag is selected', async () => {
    const { findByText, getByText, queryByText } = await render(<RecipesScreen />);
    await findByText('Poulet grillé');

    await fireEvent.press(getByText('Poulet'));

    expect(await findByText('Poulet grillé')).toBeTruthy();
    expect(queryByText('Buddha bowl')).toBeNull();
  });

  it('shows an empty state when no recipe matches the active filters', async () => {
    const { findByText, getByText } = await render(<RecipesScreen />);
    await findByText('Poulet grillé');

    await fireEvent.press(getByText('Poulet'));
    await fireEvent.press(getByText('Végétarien'));

    expect(await findByText('Aucune recette ne correspond')).toBeTruthy();
  });

  it('shows the empty-results icon when no recipe matches the filters', async () => {
    const { findByText, getByText, getByTestId } = await render(<RecipesScreen />);
    await findByText('Poulet grillé');

    await fireEvent.press(getByText('Poulet'));
    await fireEvent.press(getByText('Végétarien'));

    await waitFor(() => expect(getByTestId('empty-state-icon').props.name).toBe('restaurant-menu'));
  });

  it('filters by prep time', async () => {
    const { findByText, getByText, queryByText } = await render(<RecipesScreen />);
    await findByText('Poulet grillé');

    await fireEvent.press(getByText('≤ 30 min'));

    expect(await findByText('Poulet grillé')).toBeTruthy();
    expect(queryByText('Buddha bowl')).toBeNull();
  });
});
