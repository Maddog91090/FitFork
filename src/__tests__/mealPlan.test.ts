import {
  generateWeeklyPlan,
  pickReplacementRecipe,
  clampPortionMultiplier,
  scaleIngredientQuantity,
  scaleMacroValue,
  type RecipeOption,
  type MealSlot,
  type DailyMacroTargets,
} from '../lib/mealPlan';

const RECIPES: RecipeOption[] = [
  { id: 'b1', mealType: 'breakfast', baseCalories: 400, baseProteinG: 20, baseFatG: 10, baseCarbsG: 50 },
  { id: 'b2', mealType: 'breakfast', baseCalories: 400, baseProteinG: 20, baseFatG: 10, baseCarbsG: 50 },
  { id: 'l1', mealType: 'lunch', baseCalories: 600, baseProteinG: 30, baseFatG: 15, baseCarbsG: 70 },
  { id: 'l2', mealType: 'lunch', baseCalories: 600, baseProteinG: 30, baseFatG: 15, baseCarbsG: 70 },
  { id: 'd1', mealType: 'dinner', baseCalories: 600, baseProteinG: 30, baseFatG: 15, baseCarbsG: 70 },
  { id: 's1', mealType: 'snack', baseCalories: 200, baseProteinG: 10, baseFatG: 5, baseCarbsG: 25 },
];

const TARGETS: DailyMacroTargets = { calories: 2000, proteinG: 100, fatG: 55, carbsG: 250 };

describe('generateWeeklyPlan', () => {
  it('creates one entry per selected slot', () => {
    const slots: MealSlot[] = [
      { dayIndex: 0, mealType: 'breakfast' },
      { dayIndex: 0, mealType: 'lunch' },
    ];
    const result = generateWeeklyPlan(TARGETS, slots, RECIPES);
    expect(result).toHaveLength(2);
    expect(result[0]).toMatchObject({ dayIndex: 0, mealType: 'breakfast' });
    expect(result[1]).toMatchObject({ dayIndex: 0, mealType: 'lunch' });
  });

  it('creates no entry for an unselected slot (no redistribution)', () => {
    const slots: MealSlot[] = [{ dayIndex: 0, mealType: 'breakfast' }];
    const result = generateWeeklyPlan(TARGETS, slots, RECIPES);
    expect(result).toHaveLength(1);
    expect(result.find((e) => e.mealType === 'lunch')).toBeUndefined();
  });

  it('scales portionMultiplier to the slot calorie share (breakfast = 25%)', () => {
    const slots: MealSlot[] = [{ dayIndex: 0, mealType: 'breakfast' }];
    // 2000 * 0.25 = 500 target; recipe baseCalories 400 -> multiplier 500/400 = 1.25
    const result = generateWeeklyPlan(TARGETS, slots, RECIPES);
    expect(result[0].portionMultiplier).toBeCloseTo(1.25, 5);
  });

  it('clamps portionMultiplier to a maximum of 2', () => {
    const tinyRecipe: RecipeOption[] = [
      { id: 'b1', mealType: 'breakfast', baseCalories: 50, baseProteinG: 2, baseFatG: 1, baseCarbsG: 6 },
    ];
    // target 500 / baseCalories 50 = 10, clamped to 2
    const result = generateWeeklyPlan(TARGETS, [{ dayIndex: 0, mealType: 'breakfast' }], tinyRecipe);
    expect(result[0].portionMultiplier).toBe(2);
  });

  it('clamps portionMultiplier to a minimum of 0.5', () => {
    const hugeRecipe: RecipeOption[] = [
      { id: 'b1', mealType: 'breakfast', baseCalories: 5000, baseProteinG: 200, baseFatG: 100, baseCarbsG: 600 },
    ];
    // target 500 / baseCalories 5000 = 0.1, clamped to 0.5
    const result = generateWeeklyPlan(TARGETS, [{ dayIndex: 0, mealType: 'breakfast' }], hugeRecipe);
    expect(result[0].portionMultiplier).toBe(0.5);
  });

  it('avoids repeating the same recipe more than twice when the pool allows it', () => {
    const slots: MealSlot[] = [0, 1, 2, 3].map((dayIndex) => ({ dayIndex, mealType: 'breakfast' as const }));
    const result = generateWeeklyPlan(TARGETS, slots, RECIPES);
    const counts = new Map<string, number>();
    for (const entry of result) counts.set(entry.recipeId, (counts.get(entry.recipeId) ?? 0) + 1);
    for (const count of counts.values()) expect(count).toBeLessThanOrEqual(2);
  });

  it('relaxes the repeat limit when the recipe pool is smaller than the slot count', () => {
    const oneRecipeOnly: RecipeOption[] = [
      { id: 'b1', mealType: 'breakfast', baseCalories: 400, baseProteinG: 20, baseFatG: 10, baseCarbsG: 50 },
    ];
    const slots: MealSlot[] = [0, 1, 2, 3].map((dayIndex) => ({ dayIndex, mealType: 'breakfast' as const }));
    const result = generateWeeklyPlan(TARGETS, slots, oneRecipeOnly);
    expect(result).toHaveLength(4);
    expect(result.every((e) => e.recipeId === 'b1')).toBe(true);
  });

  it('skips a slot when no recipe exists for its meal type', () => {
    const noSnackRecipes = RECIPES.filter((r) => r.mealType !== 'snack');
    const slots: MealSlot[] = [{ dayIndex: 0, mealType: 'snack' }];
    const result = generateWeeklyPlan(TARGETS, slots, noSnackRecipes);
    expect(result).toHaveLength(0);
  });

  it('picks the candidate whose macro split is closest to the daily target split', () => {
    // Daily target is high-protein / low-fat (protein 40% of kcal, fat ~11%, carbs ~49%).
    const highProteinTargets: DailyMacroTargets = { calories: 2000, proteinG: 200, fatG: 25, carbsG: 245 };
    const lunchOptions: RecipeOption[] = [
      // Matches the high-protein/low-fat target split closely.
      { id: 'lean', mealType: 'lunch', baseCalories: 600, baseProteinG: 60, baseFatG: 7, baseCarbsG: 74 },
      // Same calories, but fat/carb-heavy — far from the target split.
      { id: 'fatty', mealType: 'lunch', baseCalories: 600, baseProteinG: 15, baseFatG: 35, baseCarbsG: 45 },
    ];
    const result = generateWeeklyPlan(highProteinTargets, [{ dayIndex: 0, mealType: 'lunch' }], lunchOptions);
    expect(result[0].recipeId).toBe('lean');
  });

  it('breaks macro-fit ties by picking the least-used recipe', () => {
    const evenTargets: DailyMacroTargets = { calories: 2000, proteinG: 100, fatG: 55, carbsG: 250 };
    // b1 and b2 have identical macro splits, so the tie should go to whichever was used less.
    const slots: MealSlot[] = [0, 1].map((dayIndex) => ({ dayIndex, mealType: 'breakfast' as const }));
    const result = generateWeeklyPlan(evenTargets, slots, RECIPES.filter((r) => r.mealType === 'breakfast'));
    expect(result.map((e) => e.recipeId).sort()).toEqual(['b1', 'b2']);
  });
});

describe('generateWeeklyPlan day-level calorie nudge', () => {
  it('closes the gap left by an earlier clamped slot when only one other slot has headroom', () => {
    const recipes: RecipeOption[] = [
      { id: 'b1', mealType: 'breakfast', baseCalories: 50, baseProteinG: 2, baseFatG: 1, baseCarbsG: 6 },
      { id: 'l1', mealType: 'lunch', baseCalories: 600, baseProteinG: 30, baseFatG: 15, baseCarbsG: 70 },
    ];
    const slots: MealSlot[] = [
      { dayIndex: 0, mealType: 'breakfast' },
      { dayIndex: 0, mealType: 'lunch' },
    ];

    // dailyTarget 2000 -> breakfast target 500, lunch target 700 (day target 1200).
    // Breakfast needs multiplier 500/50 = 10, clamped to 2 -> delivers only 100 (400 short).
    // The nudge should push the gap onto lunch (the day's last selected meal):
    // needed lunch calories = 1200 - 100 = 1100 -> multiplier 1100/600 = 1.8333...
    const result = generateWeeklyPlan(TARGETS, slots, recipes);

    const breakfast = result.find((e) => e.mealType === 'breakfast')!;
    const lunch = result.find((e) => e.mealType === 'lunch')!;

    expect(breakfast.portionMultiplier).toBe(2);
    expect(lunch.portionMultiplier).toBeCloseTo(1100 / 600, 5);

    const dayTotalCalories = 50 * breakfast.portionMultiplier + 600 * lunch.portionMultiplier;
    expect(dayTotalCalories).toBeCloseTo(1200, 5);
  });

  it('leaves multipliers unchanged when the day is already within tolerance of its target', () => {
    const recipes: RecipeOption[] = [
      { id: 'b1', mealType: 'breakfast', baseCalories: 400, baseProteinG: 20, baseFatG: 10, baseCarbsG: 50 },
      { id: 'l1', mealType: 'lunch', baseCalories: 600, baseProteinG: 30, baseFatG: 15, baseCarbsG: 70 },
    ];
    const slots: MealSlot[] = [
      { dayIndex: 0, mealType: 'breakfast' },
      { dayIndex: 0, mealType: 'lunch' },
    ];

    const result = generateWeeklyPlan(TARGETS, slots, recipes);

    const breakfast = result.find((e) => e.mealType === 'breakfast')!;
    const lunch = result.find((e) => e.mealType === 'lunch')!;

    expect(breakfast.portionMultiplier).toBeCloseTo(500 / 400, 5);
    expect(lunch.portionMultiplier).toBeCloseTo(700 / 600, 5);
  });

  it('spreads the gap across every slot with headroom, not just the last one, when the last slot is already maxed', () => {
    const recipes: RecipeOption[] = [
      { id: 'b1', mealType: 'breakfast', baseCalories: 50, baseProteinG: 2, baseFatG: 1, baseCarbsG: 6 },
      { id: 'l1', mealType: 'lunch', baseCalories: 600, baseProteinG: 30, baseFatG: 15, baseCarbsG: 70 },
      { id: 'd1', mealType: 'dinner', baseCalories: 600, baseProteinG: 30, baseFatG: 15, baseCarbsG: 70 },
      { id: 's1', mealType: 'snack', baseCalories: 100, baseProteinG: 5, baseFatG: 2, baseCarbsG: 13 },
    ];
    const slots: MealSlot[] = [
      { dayIndex: 0, mealType: 'breakfast' },
      { dayIndex: 0, mealType: 'lunch' },
      { dayIndex: 0, mealType: 'dinner' },
      { dayIndex: 0, mealType: 'snack' },
    ];

    // dailyTarget 2000 -> targets: breakfast 500, lunch 700, dinner 600, snack 200 (day target 2000).
    // Breakfast (50 base) needs x10 -> clamped to 2 (100 delivered, 400 short).
    // Snack (100 base) needs exactly x2 -> already at the clamp ceiling, zero headroom.
    // Only lunch and dinner have headroom, so the 400 shortfall must split between them:
    // 200 each -> lunch 900/600 = 1.5, dinner 800/600 = 1.3333...
    const result = generateWeeklyPlan(TARGETS, slots, recipes);

    const breakfast = result.find((e) => e.mealType === 'breakfast')!;
    const lunch = result.find((e) => e.mealType === 'lunch')!;
    const dinner = result.find((e) => e.mealType === 'dinner')!;
    const snack = result.find((e) => e.mealType === 'snack')!;

    expect(breakfast.portionMultiplier).toBe(2);
    expect(snack.portionMultiplier).toBe(2);
    expect(lunch.portionMultiplier).toBeCloseTo(1.5, 5);
    expect(dinner.portionMultiplier).toBeCloseTo(800 / 600, 5);

    const dayTotalCalories =
      50 * breakfast.portionMultiplier +
      600 * lunch.portionMultiplier +
      600 * dinner.portionMultiplier +
      100 * snack.portionMultiplier;
    expect(dayTotalCalories).toBeCloseTo(2000, 5);
  });

  it('accepts a residual deviation when every slot is already at its clamp ceiling', () => {
    const recipes: RecipeOption[] = [
      { id: 'b1', mealType: 'breakfast', baseCalories: 50, baseProteinG: 2, baseFatG: 1, baseCarbsG: 6 },
      { id: 'l1', mealType: 'lunch', baseCalories: 50, baseProteinG: 2, baseFatG: 1, baseCarbsG: 6 },
    ];
    const slots: MealSlot[] = [
      { dayIndex: 0, mealType: 'breakfast' },
      { dayIndex: 0, mealType: 'lunch' },
    ];

    // Both recipes are tiny relative to the targets, so both clamp to x2 and
    // there is no slot left with headroom to absorb the remaining shortfall.
    const result = generateWeeklyPlan(TARGETS, slots, recipes);

    const breakfast = result.find((e) => e.mealType === 'breakfast')!;
    const lunch = result.find((e) => e.mealType === 'lunch')!;

    expect(breakfast.portionMultiplier).toBe(2);
    expect(lunch.portionMultiplier).toBe(2);
  });
});

describe('pickReplacementRecipe', () => {
  it('returns a different recipe of the same meal type', () => {
    const result = pickReplacementRecipe('breakfast', 'b1', RECIPES);
    expect(result).not.toBeNull();
    expect(result!.mealType).toBe('breakfast');
    expect(result!.id).not.toBe('b1');
  });

  it('returns null when no alternative exists', () => {
    const onlyOneBreakfast = RECIPES.filter((r) => r.id === 'b1');
    const result = pickReplacementRecipe('breakfast', 'b1', onlyOneBreakfast);
    expect(result).toBeNull();
  });
});

describe('clampPortionMultiplier', () => {
  it('leaves an in-range value unchanged', () => {
    expect(clampPortionMultiplier(1.25)).toBe(1.25);
  });

  it('clamps above 2 down to 2', () => {
    expect(clampPortionMultiplier(10)).toBe(2);
  });

  it('clamps below 0.5 up to 0.5', () => {
    expect(clampPortionMultiplier(0.1)).toBe(0.5);
  });
});

describe('scaleIngredientQuantity', () => {
  it('scales a gram quantity and rounds to 1 decimal', () => {
    const result = scaleIngredientQuantity({ quantity: 100, unit: 'g' }, 1.234);
    expect(result).toBe(123.4);
  });

  it('scales a ml quantity and rounds to 1 decimal', () => {
    const result = scaleIngredientQuantity({ quantity: 250, unit: 'ml' }, 0.5);
    expect(result).toBe(125);
  });

  it('is a no-op for multiplier 1 on g/ml units', () => {
    expect(scaleIngredientQuantity({ quantity: 150, unit: 'g' }, 1)).toBe(150);
  });

  it('rounds a piece quantity to the nearest whole piece', () => {
    expect(scaleIngredientQuantity({ quantity: 1, unit: 'piece' }, 1.5)).toBe(2);
  });

  it('never rounds a piece quantity down to 0', () => {
    expect(scaleIngredientQuantity({ quantity: 1, unit: 'piece' }, 0.2)).toBe(1);
  });

  it('is a no-op for multiplier 1 on piece units', () => {
    expect(scaleIngredientQuantity({ quantity: 3, unit: 'piece' }, 1)).toBe(3);
  });
});

describe('scaleMacroValue', () => {
  it('scales a macro value and rounds to the nearest integer', () => {
    expect(scaleMacroValue(33, 1.5)).toBe(50);
  });

  it('is a no-op for multiplier 1', () => {
    expect(scaleMacroValue(400, 1)).toBe(400);
  });
});
