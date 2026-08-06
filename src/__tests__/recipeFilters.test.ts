import { filterRecipes, type RecipeFilters } from '../lib/recipeFilters';
import type { Recipe } from '../lib/mealPlanData';

function makeRecipe(overrides: Partial<Recipe>): Recipe {
  return {
    id: 'r1',
    name: 'Recette test',
    mealType: 'lunch',
    baseCalories: 500,
    baseProteinG: 30,
    baseFatG: 15,
    baseCarbsG: 50,
    baseServingG: 400,
    imageUrl: null,
    prepTimeMinutes: 20,
    tags: [],
    ...overrides,
  };
}

const NO_FILTERS: RecipeFilters = { mealType: 'all', tags: [], maxPrepTimeMinutes: 'all' };

describe('filterRecipes', () => {
  it('returns every recipe when no filter is active', () => {
    const recipes = [makeRecipe({ id: 'a' }), makeRecipe({ id: 'b' })];
    expect(filterRecipes(recipes, NO_FILTERS)).toEqual(recipes);
  });

  it('filters by meal type', () => {
    const recipes = [
      makeRecipe({ id: 'a', mealType: 'breakfast' }),
      makeRecipe({ id: 'b', mealType: 'dinner' }),
    ];
    const result = filterRecipes(recipes, { ...NO_FILTERS, mealType: 'dinner' });
    expect(result.map((r) => r.id)).toEqual(['b']);
  });

  it('requires every selected tag to be present (AND logic)', () => {
    const recipes = [
      makeRecipe({ id: 'a', tags: ['poulet'] }),
      makeRecipe({ id: 'b', tags: ['poulet', 'porc'] }),
      makeRecipe({ id: 'c', tags: ['porc'] }),
    ];
    const result = filterRecipes(recipes, { ...NO_FILTERS, tags: ['poulet', 'porc'] });
    expect(result.map((r) => r.id)).toEqual(['b']);
  });

  it('filters by a prep-time upper bound', () => {
    const recipes = [
      makeRecipe({ id: 'a', prepTimeMinutes: 10 }),
      makeRecipe({ id: 'b', prepTimeMinutes: 40 }),
    ];
    const result = filterRecipes(recipes, { ...NO_FILTERS, maxPrepTimeMinutes: 15 });
    expect(result.map((r) => r.id)).toEqual(['a']);
  });

  it('excludes recipes with no prep time from a strict time bucket', () => {
    const recipes = [makeRecipe({ id: 'a', prepTimeMinutes: null })];
    const result = filterRecipes(recipes, { ...NO_FILTERS, maxPrepTimeMinutes: 15 });
    expect(result).toEqual([]);
  });

  it('keeps recipes with no prep time when the time filter is "all"', () => {
    const recipes = [makeRecipe({ id: 'a', prepTimeMinutes: null })];
    const result = filterRecipes(recipes, NO_FILTERS);
    expect(result.map((r) => r.id)).toEqual(['a']);
  });

  it('combines all three filter axes with AND', () => {
    const recipes = [
      makeRecipe({ id: 'a', mealType: 'dinner', tags: ['poulet'], prepTimeMinutes: 20 }),
      makeRecipe({ id: 'b', mealType: 'dinner', tags: ['poulet'], prepTimeMinutes: 40 }),
      makeRecipe({ id: 'c', mealType: 'lunch', tags: ['poulet'], prepTimeMinutes: 20 }),
    ];
    const result = filterRecipes(recipes, { mealType: 'dinner', tags: ['poulet'], maxPrepTimeMinutes: 30 });
    expect(result.map((r) => r.id)).toEqual(['a']);
  });
});
