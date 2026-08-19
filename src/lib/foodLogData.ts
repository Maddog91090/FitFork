import { supabase } from './supabase';
import { scaleMacroValue, type MealType } from './mealPlan';
import { scaleProductMacros } from './foodLog';
import type { Recipe, SavedPlanEntry } from './mealPlanData';
import type { ScannedProduct } from './openFoodFacts';

export type FoodLogSource = 'plan_entry' | 'product' | 'manual';

export type FoodLogEntry = {
  id: string;
  loggedAt: string;
  mealType: MealType;
  source: FoodLogSource;
  planEntryId: string | null;
  name: string;
  calories: number;
  proteinG: number;
  fatG: number;
  carbsG: number;
};

function mapRow(row: any): FoodLogEntry {
  return {
    id: row.id,
    loggedAt: row.logged_at,
    mealType: row.meal_type,
    source: row.source,
    planEntryId: row.plan_entry_id,
    name: row.name,
    calories: row.calories,
    proteinG: row.protein_g,
    fatG: row.fat_g,
    carbsG: row.carbs_g,
  };
}

export async function fetchLogsForDate(userId: string, loggedAt: string): Promise<FoodLogEntry[]> {
  const { data, error } = await supabase
    .from('food_logs')
    .select('id, logged_at, meal_type, source, plan_entry_id, name, calories, protein_g, fat_g, carbs_g')
    .eq('user_id', userId)
    .eq('logged_at', loggedAt)
    .order('created_at');

  if (error) throw error;
  return (data ?? []).map(mapRow);
}

/** Checks off a planned meal as eaten, snapshotting its scaled macros so later recipe edits don't change today's total. */
export async function logPlanEntry(userId: string, entry: SavedPlanEntry, recipe: Recipe): Promise<void> {
  const { error } = await supabase.from('food_logs').insert({
    user_id: userId,
    meal_type: entry.mealType,
    source: 'plan_entry',
    plan_entry_id: entry.id,
    name: recipe.name,
    calories: scaleMacroValue(recipe.baseCalories, entry.portionMultiplier),
    protein_g: scaleMacroValue(recipe.baseProteinG, entry.portionMultiplier),
    fat_g: scaleMacroValue(recipe.baseFatG, entry.portionMultiplier),
    carbs_g: scaleMacroValue(recipe.baseCarbsG, entry.portionMultiplier),
  });
  if (error) throw error;
}

export async function unlogPlanEntry(userId: string, planEntryId: string): Promise<void> {
  const { error } = await supabase
    .from('food_logs')
    .delete()
    .eq('user_id', userId)
    .eq('plan_entry_id', planEntryId);
  if (error) throw error;
}

export async function logProduct(
  userId: string,
  mealType: MealType,
  product: ScannedProduct,
  quantityG: number
): Promise<void> {
  const macros = scaleProductMacros(product, quantityG);
  const { error } = await supabase.from('food_logs').insert({
    user_id: userId,
    meal_type: mealType,
    source: 'product',
    product_barcode: product.barcode,
    name: product.name,
    calories: macros.calories,
    protein_g: macros.proteinG,
    fat_g: macros.fatG,
    carbs_g: macros.carbsG,
  });
  if (error) throw error;
}

export async function logManual(
  userId: string,
  mealType: MealType,
  name: string,
  macros: { calories: number; proteinG: number; fatG: number; carbsG: number }
): Promise<void> {
  const { error } = await supabase.from('food_logs').insert({
    user_id: userId,
    meal_type: mealType,
    source: 'manual',
    name,
    calories: macros.calories,
    protein_g: macros.proteinG,
    fat_g: macros.fatG,
    carbs_g: macros.carbsG,
  });
  if (error) throw error;
}

export async function deleteLog(logId: string): Promise<void> {
  const { error } = await supabase.from('food_logs').delete().eq('id', logId);
  if (error) throw error;
}
