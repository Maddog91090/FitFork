export type MealType = 'breakfast' | 'lunch' | 'dinner' | 'snack';

export type RecipeOption = {
  id: string;
  mealType: MealType;
  baseCalories: number;
  baseProteinG: number;
  baseFatG: number;
  baseCarbsG: number;
};

export type DailyMacroTargets = {
  calories: number;
  proteinG: number;
  fatG: number;
  carbsG: number;
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

function leastUsed(candidates: RecipeOption[], usageCount: Map<string, number>): RecipeOption {
  return candidates.reduce((best, candidate) =>
    (usageCount.get(candidate.id) ?? 0) < (usageCount.get(best.id) ?? 0) ? candidate : best
  );
}

type MacroShare = { protein: number; fat: number; carbs: number };

function macroShare(recipe: RecipeOption): MacroShare {
  if (recipe.baseCalories <= 0) return { protein: 0, fat: 0, carbs: 0 };
  return {
    protein: (recipe.baseProteinG * 4) / recipe.baseCalories,
    fat: (recipe.baseFatG * 9) / recipe.baseCalories,
    carbs: (recipe.baseCarbsG * 4) / recipe.baseCalories,
  };
}

function macroTargetShare(dailyTargets: DailyMacroTargets): MacroShare {
  if (dailyTargets.calories <= 0) return { protein: 0, fat: 0, carbs: 0 };
  return {
    protein: (dailyTargets.proteinG * 4) / dailyTargets.calories,
    fat: (dailyTargets.fatG * 9) / dailyTargets.calories,
    carbs: (dailyTargets.carbsG * 4) / dailyTargets.calories,
  };
}

function macroDistance(a: MacroShare, b: MacroShare): number {
  return (a.protein - b.protein) ** 2 + (a.fat - b.fat) ** 2 + (a.carbs - b.carbs) ** 2;
}

function bestMacroFit(
  candidates: RecipeOption[],
  targetShare: MacroShare,
  usageCount: Map<string, number>
): RecipeOption {
  let bestScore = Infinity;
  let bestCandidates: RecipeOption[] = [];

  for (const candidate of candidates) {
    const score = macroDistance(macroShare(candidate), targetShare);
    if (score < bestScore - 1e-9) {
      bestScore = score;
      bestCandidates = [candidate];
    } else if (score <= bestScore + 1e-9) {
      bestCandidates.push(candidate);
    }
  }

  return leastUsed(bestCandidates, usageCount);
}

export function generateWeeklyPlan(
  dailyTargets: DailyMacroTargets,
  selectedSlots: MealSlot[],
  recipes: RecipeOption[]
): GeneratedEntry[] {
  const usageCount = new Map<string, number>();
  const entries: GeneratedEntry[] = [];
  const targetShare = macroTargetShare(dailyTargets);

  for (const slot of selectedSlots) {
    const candidates = recipes.filter((r) => r.mealType === slot.mealType);
    if (candidates.length === 0) continue;

    const underLimit = candidates.filter((r) => (usageCount.get(r.id) ?? 0) < MAX_REPEATS_PER_WEEK);
    const pool = underLimit.length > 0 ? underLimit : candidates;
    const recipe = bestMacroFit(pool, targetShare, usageCount);

    const slotTargetCalories = dailyTargets.calories * MEAL_TYPE_RATIOS[slot.mealType];
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
