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
const DAILY_CALORIE_TOLERANCE = 0.1;

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
  const entryBaseCalories: number[] = [];
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
    entryBaseCalories.push(recipe.baseCalories);
  }

  nudgeDaysToTarget(entries, entryBaseCalories, dailyTargets.calories);

  return entries;
}

// Per-slot portion multipliers are clamped to keep portions realistic (see
// clampPortionMultiplier), which can leave a day short of or over its daily
// calorie target. This closes that gap by water-filling it across every one
// of the day's slots that still has headroom under its own clamp, splitting
// the remaining gap evenly among them each round until the day's total is
// within tolerance of its target or no slot has headroom left — in which
// case the residual deviation is unavoidable given that day's recipe picks.
function nudgeDaysToTarget(
  entries: GeneratedEntry[],
  entryBaseCalories: number[],
  dailyTargetCalories: number
): void {
  const dayIndices = new Set(entries.map((entry) => entry.dayIndex));

  for (const dayIndex of dayIndices) {
    const dayEntryIndices = entries
      .map((entry, index) => (entry.dayIndex === dayIndex ? index : -1))
      .filter((index) => index !== -1);

    const dayTargetCalories = dayEntryIndices.reduce(
      (sum, index) => sum + dailyTargetCalories * MEAL_TYPE_RATIOS[entries[index].mealType],
      0
    );

    const dayTotalCalories = () =>
      dayEntryIndices.reduce((sum, index) => sum + entryBaseCalories[index] * entries[index].portionMultiplier, 0);

    const initialDeviation = Math.abs(dayTotalCalories() - dayTargetCalories) / dayTargetCalories;
    if (initialDeviation <= DAILY_CALORIE_TOLERANCE) continue;

    for (let round = 0; round < dayEntryIndices.length; round++) {
      const gap = dayTargetCalories - dayTotalCalories();
      if (Math.abs(gap) < 0.01) break;

      const direction = gap > 0 ? 1 : -1;
      const openIndices = dayEntryIndices.filter((index) => {
        const multiplier = entries[index].portionMultiplier;
        return direction > 0 ? multiplier < MAX_PORTION_MULTIPLIER : multiplier > MIN_PORTION_MULTIPLIER;
      });
      if (openIndices.length === 0) break;

      const share = gap / openIndices.length;
      for (const index of openIndices) {
        const delivered = entryBaseCalories[index] * entries[index].portionMultiplier;
        entries[index].portionMultiplier = clampPortionMultiplier((delivered + share) / entryBaseCalories[index]);
      }
    }
  }
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
