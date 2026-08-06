import type { Recipe } from './mealPlanData';
import type { MealType } from './mealPlan';

export type PrepTimeFilter = 'all' | 15 | 30 | 45;

export type RecipeFilters = {
  mealType: MealType | 'all';
  tags: string[];
  maxPrepTimeMinutes: PrepTimeFilter;
};

export function matchesFilters(recipe: Recipe, filters: RecipeFilters): boolean {
  if (filters.mealType !== 'all' && recipe.mealType !== filters.mealType) {
    return false;
  }

  if (filters.tags.length > 0 && !filters.tags.every((tag) => recipe.tags.includes(tag))) {
    return false;
  }

  if (filters.maxPrepTimeMinutes !== 'all') {
    if (recipe.prepTimeMinutes == null || recipe.prepTimeMinutes > filters.maxPrepTimeMinutes) {
      return false;
    }
  }

  return true;
}

export function filterRecipes(recipes: Recipe[], filters: RecipeFilters): Recipe[] {
  return recipes.filter((recipe) => matchesFilters(recipe, filters));
}
