export type MealType = 'breakfast' | 'lunch' | 'dinner' | 'snack';

export type RecipeOption = {
  id: string;
  mealType: MealType;
  baseCalories: number;
};

export type MealSlot = {
  dayIndex: number;
  mealType: MealType;
};

export type GeneratedEntry = {
  dayIndex: number;
  mealType: MealType;
  recipeId: string;
  portionMultiplier: number;
};

export const MEAL_TYPE_RATIOS: Record<MealType, number> = {
  breakfast: 0.25,
  lunch: 0.35,
  dinner: 0.3,
  snack: 0.1,
};

const MIN_PORTION_MULTIPLIER = 0.5;
const MAX_PORTION_MULTIPLIER = 2;
const MAX_REPEATS_PER_WEEK = 2;

export function clampPortionMultiplier(raw: number): number {
  return Math.max(MIN_PORTION_MULTIPLIER, Math.min(MAX_PORTION_MULTIPLIER, raw));
}

export type ScalableIngredient = {
  quantity: number;
  unit: 'g' | 'ml' | 'piece';
};

export function scaleIngredientQuantity(ingredient: ScalableIngredient, multiplier: number): number {
  const scaled = ingredient.quantity * multiplier;
  if (ingredient.unit === 'piece') {
    return Math.max(1, Math.round(scaled));
  }
  return Math.round(scaled * 10) / 10;
}

export function scaleMacroValue(value: number, multiplier: number): number {
  return Math.round(value * multiplier);
}

function leastUsed(candidates: RecipeOption[], usageCount: Map<string, number>): RecipeOption {
  return candidates.reduce((best, candidate) =>
    (usageCount.get(candidate.id) ?? 0) < (usageCount.get(best.id) ?? 0) ? candidate : best
  );
}

export function generateWeeklyPlan(
  dailyTargetCalories: number,
  selectedSlots: MealSlot[],
  recipes: RecipeOption[]
): GeneratedEntry[] {
  const usageCount = new Map<string, number>();
  const entries: GeneratedEntry[] = [];

  for (const slot of selectedSlots) {
    const candidates = recipes.filter((r) => r.mealType === slot.mealType);
    if (candidates.length === 0) continue;

    const underLimit = candidates.filter((r) => (usageCount.get(r.id) ?? 0) < MAX_REPEATS_PER_WEEK);
    const pool = underLimit.length > 0 ? underLimit : candidates;
    const recipe = leastUsed(pool, usageCount);

    const slotTargetCalories = dailyTargetCalories * MEAL_TYPE_RATIOS[slot.mealType];
    const portionMultiplier = clampPortionMultiplier(slotTargetCalories / recipe.baseCalories);

    usageCount.set(recipe.id, (usageCount.get(recipe.id) ?? 0) + 1);
    entries.push({
      dayIndex: slot.dayIndex,
      mealType: slot.mealType,
      recipeId: recipe.id,
      portionMultiplier,
    });
  }

  return entries;
}

export function pickReplacementRecipe(
  mealType: MealType,
  excludeRecipeId: string,
  recipes: RecipeOption[]
): RecipeOption | null {
  const alternatives = recipes.filter((r) => r.mealType === mealType && r.id !== excludeRecipeId);
  if (alternatives.length === 0) return null;
  return alternatives[0];
}
