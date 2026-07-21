import { supabase } from './supabase';
import type { MealType, GeneratedEntry } from './mealPlan';

export type Recipe = {
  id: string;
  name: string;
  mealType: MealType;
  baseCalories: number;
  baseProteinG: number;
  baseFatG: number;
  baseCarbsG: number;
  baseServingG: number;
};

export type RecipeIngredient = {
  recipeId: string;
  ingredientName: string;
  quantity: number;
  unit: 'g' | 'ml' | 'piece';
};

export type SavedPlanEntry = {
  id: string;
  dayIndex: number;
  mealType: MealType;
  recipeId: string;
  portionMultiplier: number;
};

export type SavedPlan = {
  id: string;
  targetCalories: number;
  entries: SavedPlanEntry[];
};

export async function fetchRecipes(): Promise<Recipe[]> {
  const { data, error } = await supabase
    .from('recipes')
    .select('id, name, meal_type, base_calories, base_protein_g, base_fat_g, base_carbs_g, base_serving_g')
    .order('id');

  if (error) throw error;

  return (data ?? []).map((row: any) => ({
    id: row.id,
    name: row.name,
    mealType: row.meal_type,
    baseCalories: row.base_calories,
    baseProteinG: row.base_protein_g,
    baseFatG: row.base_fat_g,
    baseCarbsG: row.base_carbs_g,
    baseServingG: row.base_serving_g,
  }));
}

export async function fetchRecipeIngredients(recipeIds: string[]): Promise<RecipeIngredient[]> {
  if (recipeIds.length === 0) return [];

  const { data, error } = await supabase
    .from('recipe_ingredients')
    .select('recipe_id, ingredient_name, quantity, unit')
    .in('recipe_id', recipeIds);

  if (error) throw error;

  return (data ?? []).map((row: any) => ({
    recipeId: row.recipe_id,
    ingredientName: row.ingredient_name,
    quantity: row.quantity,
    unit: row.unit,
  }));
}

export async function fetchRecipeInstructions(recipeId: string): Promise<string[]> {
  const { data, error } = await supabase
    .from('recipe_instructions')
    .select('step_number, text')
    .eq('recipe_id', recipeId)
    .order('step_number');

  if (error) throw error;

  return (data ?? [])
    .sort((a: any, b: any) => a.step_number - b.step_number)
    .map((row: any) => row.text);
}

export async function saveWeeklyPlan(
  userId: string,
  targets: { calories: number; proteinG: number; fatG: number; carbsG: number },
  entries: GeneratedEntry[]
): Promise<string> {
  const { data: plan, error: planError } = await supabase
    .from('weekly_meal_plans')
    .insert({
      user_id: userId,
      target_calories: targets.calories,
      target_protein_g: targets.proteinG,
      target_fat_g: targets.fatG,
      target_carbs_g: targets.carbsG,
    })
    .select('id')
    .single();

  if (planError) throw planError;
  const planId = plan.id;

  if (entries.length > 0) {
    const { error: entriesError } = await supabase.from('meal_plan_entries').insert(
      entries.map((entry) => ({
        plan_id: planId,
        day_index: entry.dayIndex,
        meal_type: entry.mealType,
        recipe_id: entry.recipeId,
        portion_multiplier: entry.portionMultiplier,
      }))
    );
    if (entriesError) {
      await supabase.from('weekly_meal_plans').delete().eq('id', planId);
      throw entriesError;
    }
  }

  return planId;
}

export async function getCurrentPlan(userId: string): Promise<SavedPlan | null> {
  const { data: plan, error: planError } = await supabase
    .from('weekly_meal_plans')
    .select('id, target_calories')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (planError) throw planError;
  if (!plan) return null;

  const { data: entries, error: entriesError } = await supabase
    .from('meal_plan_entries')
    .select('id, day_index, meal_type, recipe_id, portion_multiplier')
    .eq('plan_id', plan.id);

  if (entriesError) throw entriesError;

  return {
    id: plan.id,
    targetCalories: plan.target_calories,
    entries: (entries ?? []).map((row: any) => ({
      id: row.id,
      dayIndex: row.day_index,
      mealType: row.meal_type,
      recipeId: row.recipe_id,
      portionMultiplier: row.portion_multiplier,
    })),
  };
}

export async function updatePlanEntry(
  entryId: string,
  recipeId: string,
  portionMultiplier: number
): Promise<void> {
  const { error } = await supabase
    .from('meal_plan_entries')
    .update({ recipe_id: recipeId, portion_multiplier: portionMultiplier })
    .eq('id', entryId);

  if (error) throw error;
}
