import {
  generateWeeklyPlan,
  pickReplacementRecipe,
  clampPortionMultiplier,
  scaleIngredientQuantity,
  scaleMacroValue,
  type RecipeOption,
  type MealSlot,
} from '../lib/mealPlan';

const RECIPES: RecipeOption[] = [
  { id: 'b1', mealType: 'breakfast', baseCalories: 400 },
  { id: 'b2', mealType: 'breakfast', baseCalories: 400 },
  { id: 'l1', mealType: 'lunch', baseCalories: 600 },
  { id: 'l2', mealType: 'lunch', baseCalories: 600 },
  { id: 'd1', mealType: 'dinner', baseCalories: 600 },
  { id: 's1', mealType: 'snack', baseCalories: 200 },
];

describe('generateWeeklyPlan', () => {
  it('creates one entry per selected slot', () => {
    const slots: MealSlot[] = [
      { dayIndex: 0, mealType: 'breakfast' },
      { dayIndex: 0, mealType: 'lunch' },
    ];
    const result = generateWeeklyPlan(2000, slots, RECIPES);
    expect(result).toHaveLength(2);
    expect(result[0]).toMatchObject({ dayIndex: 0, mealType: 'breakfast' });
    expect(result[1]).toMatchObject({ dayIndex: 0, mealType: 'lunch' });
  });

  it('creates no entry for an unselected slot (no redistribution)', () => {
    const slots: MealSlot[] = [{ dayIndex: 0, mealType: 'breakfast' }];
    const result = generateWeeklyPlan(2000, slots, RECIPES);
    expect(result).toHaveLength(1);
    expect(result.find((e) => e.mealType === 'lunch')).toBeUndefined();
  });

  it('scales portionMultiplier to the slot calorie share (breakfast = 25%)', () => {
    const slots: MealSlot[] = [{ dayIndex: 0, mealType: 'breakfast' }];
    // 2000 * 0.25 = 500 target; recipe baseCalories 400 -> multiplier 500/400 = 1.25
    const result = generateWeeklyPlan(2000, slots, RECIPES);
    expect(result[0].portionMultiplier).toBeCloseTo(1.25, 5);
  });

  it('clamps portionMultiplier to a maximum of 2', () => {
    const tinyRecipe: RecipeOption[] = [{ id: 'b1', mealType: 'breakfast', baseCalories: 50 }];
    // target 500 / baseCalories 50 = 10, clamped to 2
    const result = generateWeeklyPlan(2000, [{ dayIndex: 0, mealType: 'breakfast' }], tinyRecipe);
    expect(result[0].portionMultiplier).toBe(2);
  });

  it('clamps portionMultiplier to a minimum of 0.5', () => {
    const hugeRecipe: RecipeOption[] = [{ id: 'b1', mealType: 'breakfast', baseCalories: 5000 }];
    // target 500 / baseCalories 5000 = 0.1, clamped to 0.5
    const result = generateWeeklyPlan(2000, [{ dayIndex: 0, mealType: 'breakfast' }], hugeRecipe);
    expect(result[0].portionMultiplier).toBe(0.5);
  });

  it('avoids repeating the same recipe more than twice when the pool allows it', () => {
    const slots: MealSlot[] = [0, 1, 2, 3].map((dayIndex) => ({ dayIndex, mealType: 'breakfast' as const }));
    const result = generateWeeklyPlan(2000, slots, RECIPES);
    const counts = new Map<string, number>();
    for (const entry of result) counts.set(entry.recipeId, (counts.get(entry.recipeId) ?? 0) + 1);
    for (const count of counts.values()) expect(count).toBeLessThanOrEqual(2);
  });

  it('relaxes the repeat limit when the recipe pool is smaller than the slot count', () => {
    const oneRecipeOnly: RecipeOption[] = [{ id: 'b1', mealType: 'breakfast', baseCalories: 400 }];
    const slots: MealSlot[] = [0, 1, 2, 3].map((dayIndex) => ({ dayIndex, mealType: 'breakfast' as const }));
    const result = generateWeeklyPlan(2000, slots, oneRecipeOnly);
    expect(result).toHaveLength(4);
    expect(result.every((e) => e.recipeId === 'b1')).toBe(true);
  });

  it('skips a slot when no recipe exists for its meal type', () => {
    const noSnackRecipes = RECIPES.filter((r) => r.mealType !== 'snack');
    const slots: MealSlot[] = [{ dayIndex: 0, mealType: 'snack' }];
    const result = generateWeeklyPlan(2000, slots, noSnackRecipes);
    expect(result).toHaveLength(0);
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
