import {
  fetchRecipes,
  fetchRecipeIngredients,
  saveWeeklyPlan,
  getCurrentPlan,
  updatePlanEntry,
} from '../lib/mealPlanData';
import { supabase } from '../lib/supabase';

jest.mock('../lib/supabase', () => ({
  supabase: { from: jest.fn() },
}));

beforeEach(() => {
  jest.clearAllMocks();
});

describe('fetchRecipes', () => {
  it('maps rows to the Recipe shape', async () => {
    const order = jest.fn().mockResolvedValue({
      data: [
        {
          id: 'r1',
          name: 'Porridge',
          meal_type: 'breakfast',
          base_calories: 350,
          base_protein_g: 12,
          base_fat_g: 8,
          base_carbs_g: 58,
          base_serving_g: 300,
        },
      ],
      error: null,
    });
    const select = jest.fn().mockReturnValue({ order });
    (supabase.from as jest.Mock).mockReturnValue({ select });

    const result = await fetchRecipes();

    expect(result).toEqual([
      {
        id: 'r1',
        name: 'Porridge',
        mealType: 'breakfast',
        baseCalories: 350,
        baseProteinG: 12,
        baseFatG: 8,
        baseCarbsG: 58,
        baseServingG: 300,
      },
    ]);
    expect(order).toHaveBeenCalledWith('id');
  });

  it('throws on a Supabase error', async () => {
    const order = jest.fn().mockResolvedValue({ data: null, error: new Error('boom') });
    const select = jest.fn().mockReturnValue({ order });
    (supabase.from as jest.Mock).mockReturnValue({ select });

    await expect(fetchRecipes()).rejects.toThrow('boom');
  });
});

describe('fetchRecipeIngredients', () => {
  it('returns an empty array without calling Supabase when given no recipe ids', async () => {
    const result = await fetchRecipeIngredients([]);
    expect(result).toEqual([]);
    expect(supabase.from).not.toHaveBeenCalled();
  });

  it('maps rows to the RecipeIngredient shape', async () => {
    const inFn = jest.fn().mockResolvedValue({
      data: [{ recipe_id: 'r1', ingredient_name: "Flocons d'avoine", quantity: 80, unit: 'g' }],
      error: null,
    });
    const select = jest.fn().mockReturnValue({ in: inFn });
    (supabase.from as jest.Mock).mockReturnValue({ select });

    const result = await fetchRecipeIngredients(['r1']);

    expect(result).toEqual([{ recipeId: 'r1', ingredientName: "Flocons d'avoine", quantity: 80, unit: 'g' }]);
    expect(inFn).toHaveBeenCalledWith('recipe_id', ['r1']);
  });
});

describe('saveWeeklyPlan', () => {
  it('inserts the plan then its entries and returns the plan id', async () => {
    const single = jest.fn().mockResolvedValue({ data: { id: 'plan-1' }, error: null });
    const selectAfterInsert = jest.fn().mockReturnValue({ single });
    const planInsert = jest.fn().mockReturnValue({ select: selectAfterInsert });
    const entriesInsert = jest.fn().mockResolvedValue({ error: null });

    (supabase.from as jest.Mock)
      .mockReturnValueOnce({ insert: planInsert })
      .mockReturnValueOnce({ insert: entriesInsert });

    const planId = await saveWeeklyPlan(
      'user-1',
      { calories: 2000, proteinG: 150, fatG: 60, carbsG: 200 },
      [{ dayIndex: 0, mealType: 'breakfast', recipeId: 'r1', portionMultiplier: 1.2 }]
    );

    expect(planId).toBe('plan-1');
    expect(planInsert).toHaveBeenCalledWith({
      user_id: 'user-1',
      target_calories: 2000,
      target_protein_g: 150,
      target_fat_g: 60,
      target_carbs_g: 200,
    });
    expect(entriesInsert).toHaveBeenCalledWith([
      { plan_id: 'plan-1', day_index: 0, meal_type: 'breakfast', recipe_id: 'r1', portion_multiplier: 1.2 },
    ]);
  });

  it('does not call a second table for entries when there are none', async () => {
    const single = jest.fn().mockResolvedValue({ data: { id: 'plan-1' }, error: null });
    const selectAfterInsert = jest.fn().mockReturnValue({ single });
    const planInsert = jest.fn().mockReturnValue({ select: selectAfterInsert });
    (supabase.from as jest.Mock).mockReturnValue({ insert: planInsert });

    const planId = await saveWeeklyPlan('user-1', { calories: 2000, proteinG: 150, fatG: 60, carbsG: 200 }, []);

    expect(planId).toBe('plan-1');
    expect(supabase.from).toHaveBeenCalledTimes(1);
  });

  it('cleans up the plan row if the entries insert fails', async () => {
    const single = jest.fn().mockResolvedValue({ data: { id: 'plan-1' }, error: null });
    const selectAfterInsert = jest.fn().mockReturnValue({ single });
    const planInsert = jest.fn().mockReturnValue({ select: selectAfterInsert });
    const entriesInsert = jest.fn().mockResolvedValue({ error: new Error('boom') });
    const deleteEq = jest.fn().mockResolvedValue({ error: null });
    const deleteFn = jest.fn().mockReturnValue({ eq: deleteEq });

    (supabase.from as jest.Mock)
      .mockReturnValueOnce({ insert: planInsert })
      .mockReturnValueOnce({ insert: entriesInsert })
      .mockReturnValueOnce({ delete: deleteFn });

    await expect(
      saveWeeklyPlan(
        'user-1',
        { calories: 2000, proteinG: 150, fatG: 60, carbsG: 200 },
        [{ dayIndex: 0, mealType: 'breakfast', recipeId: 'r1', portionMultiplier: 1.2 }]
      )
    ).rejects.toThrow('boom');

    expect(deleteEq).toHaveBeenCalledWith('id', 'plan-1');
  });
});

describe('getCurrentPlan', () => {
  it('returns null when the user has no plan', async () => {
    const maybeSingle = jest.fn().mockResolvedValue({ data: null, error: null });
    const limit = jest.fn().mockReturnValue({ maybeSingle });
    const order = jest.fn().mockReturnValue({ limit });
    const eq = jest.fn().mockReturnValue({ order });
    const select = jest.fn().mockReturnValue({ eq });
    (supabase.from as jest.Mock).mockReturnValue({ select });

    const result = await getCurrentPlan('user-1');

    expect(result).toBeNull();
  });

  it('returns the most recent plan with its mapped entries', async () => {
    const maybeSingle = jest.fn().mockResolvedValue({ data: { id: 'plan-1', target_calories: 2000 }, error: null });
    const limit = jest.fn().mockReturnValue({ maybeSingle });
    const order = jest.fn().mockReturnValue({ limit });
    const planEq = jest.fn().mockReturnValue({ order });
    const planSelect = jest.fn().mockReturnValue({ eq: planEq });

    const entriesEq = jest.fn().mockResolvedValue({
      data: [{ id: 'e1', day_index: 0, meal_type: 'breakfast', recipe_id: 'r1', portion_multiplier: 1.2 }],
      error: null,
    });
    const entriesSelect = jest.fn().mockReturnValue({ eq: entriesEq });

    (supabase.from as jest.Mock)
      .mockReturnValueOnce({ select: planSelect })
      .mockReturnValueOnce({ select: entriesSelect });

    const result = await getCurrentPlan('user-1');

    expect(result).toEqual({
      id: 'plan-1',
      targetCalories: 2000,
      entries: [{ id: 'e1', dayIndex: 0, mealType: 'breakfast', recipeId: 'r1', portionMultiplier: 1.2 }],
    });
    expect(order).toHaveBeenCalledWith('created_at', { ascending: false });
  });
});

describe('updatePlanEntry', () => {
  it('updates the recipe and portion multiplier for an entry', async () => {
    const eq = jest.fn().mockResolvedValue({ error: null });
    const update = jest.fn().mockReturnValue({ eq });
    (supabase.from as jest.Mock).mockReturnValue({ update });

    await updatePlanEntry('entry-1', 'r2', 0.9);

    expect(update).toHaveBeenCalledWith({ recipe_id: 'r2', portion_multiplier: 0.9 });
    expect(eq).toHaveBeenCalledWith('id', 'entry-1');
  });

  it('throws on a Supabase error', async () => {
    const eq = jest.fn().mockResolvedValue({ error: new Error('boom') });
    const update = jest.fn().mockReturnValue({ eq });
    (supabase.from as jest.Mock).mockReturnValue({ update });

    await expect(updatePlanEntry('entry-1', 'r2', 0.9)).rejects.toThrow('boom');
  });
});
