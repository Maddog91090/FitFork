import type { MacroTargets } from './nutrition';

export type ProductMacrosPer100g = {
  caloriesPer100g: number;
  proteinGPer100g: number;
  fatGPer100g: number;
  carbsGPer100g: number;
};

/** Scales a product's per-100g macros to the quantity actually consumed. */
export function scaleProductMacros(product: ProductMacrosPer100g, quantityG: number): MacroTargets {
  const factor = quantityG / 100;
  return {
    calories: Math.round(product.caloriesPer100g * factor),
    proteinG: Math.round(product.proteinGPer100g * factor),
    fatG: Math.round(product.fatGPer100g * factor),
    carbsG: Math.round(product.carbsGPer100g * factor),
  };
}

export function sumMacros(entries: MacroTargets[]): MacroTargets {
  return entries.reduce(
    (total, entry) => ({
      calories: total.calories + entry.calories,
      proteinG: total.proteinG + entry.proteinG,
      fatG: total.fatG + entry.fatG,
      carbsG: total.carbsG + entry.carbsG,
    }),
    { calories: 0, proteinG: 0, fatG: 0, carbsG: 0 }
  );
}

/** Can go negative — a negative value means the day is over that target, which callers surface rather than clamp away. */
export function remainingMacros(target: MacroTargets, consumed: MacroTargets): MacroTargets {
  return {
    calories: target.calories - consumed.calories,
    proteinG: target.proteinG - consumed.proteinG,
    fatG: target.fatG - consumed.fatG,
    carbsG: target.carbsG - consumed.carbsG,
  };
}
