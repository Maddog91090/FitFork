import React from 'react';
import { render } from '@testing-library/react-native';
import RecipeDetailScreen from '../app/recipe/[id]';
import { useLocalSearchParams } from 'expo-router';
import { fetchRecipes, fetchRecipeIngredients, fetchRecipeInstructions } from '../lib/mealPlanData';

jest.mock('../lib/mealPlanData', () => ({
  fetchRecipes: jest.fn(),
  fetchRecipeIngredients: jest.fn(),
  fetchRecipeInstructions: jest.fn(),
}));

jest.mock('expo-router', () => ({
  useLocalSearchParams: jest.fn(),
  useFocusEffect: (effect: () => void) => {
    const { useEffect } = require('react');
    useEffect(effect, []);
  },
}));

describe('RecipeDetailScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (useLocalSearchParams as jest.Mock).mockReturnValue({ id: 'r1' });
    (fetchRecipes as jest.Mock).mockResolvedValue([
      {
        id: 'r1',
        name: 'Poulet grillé',
        mealType: 'lunch',
        baseCalories: 500,
        baseProteinG: 40,
        baseFatG: 15,
        baseCarbsG: 50,
        baseServingG: 400,
        imageUrl: null,
      },
    ]);
    (fetchRecipeIngredients as jest.Mock).mockResolvedValue([]);
    (fetchRecipeInstructions as jest.Mock).mockResolvedValue(['Cuire le poulet.']);
  });

  it('renders the recipe once loaded', async () => {
    const { findByText } = await render(<RecipeDetailScreen />);
    expect(await findByText('Poulet grillé')).toBeTruthy();
  });
});
