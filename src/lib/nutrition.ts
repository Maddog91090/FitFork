export type Sex = 'male' | 'female';
export type ActivityLevel = 'sedentary' | 'light' | 'moderate' | 'active' | 'very_active';
export type Goal = 'cut' | 'bulk' | 'maintain';

export type MacroTargets = {
  calories: number;
  proteinG: number;
  fatG: number;
  carbsG: number;
};

/**
 * The classic Mifflin-St Jeor activity multipliers. Each tier's name already
 * implies a typical exercise frequency (this is standard, textbook usage —
 * see the day-count descriptions next to each option in onboarding), so this
 * single number is meant to capture the user's *overall* week: daily-life
 * movement and structured training together. Do not also add a separate
 * per-training-day calorie bonus on top of this — that would double-count
 * the exercise these multipliers already assume.
 */
const ACTIVITY_MULTIPLIERS: Record<ActivityLevel, number> = {
  sedentary: 1.2,
  light: 1.375,
  moderate: 1.55,
  active: 1.725,
  very_active: 1.9,
};

const GOAL_ADJUSTMENTS: Record<Goal, number> = {
  cut: -0.175,
  bulk: 0.125,
  maintain: 0,
};

const PROTEIN_G_PER_KG = 2.0;
const FAT_PERCENT_OF_CALORIES = 0.28;

export function calculateBMR(sex: Sex, weightKg: number, heightCm: number, age: number): number {
  const base = 10 * weightKg + 6.25 * heightCm - 5 * age;
  return sex === 'male' ? base + 5 : base - 161;
}

export function calculateTDEE(bmr: number, activityLevel: ActivityLevel): number {
  return bmr * ACTIVITY_MULTIPLIERS[activityLevel];
}

export function calculateTargetCalories(tdee: number, goal: Goal): number {
  return tdee * (1 + GOAL_ADJUSTMENTS[goal]);
}

export function calculateMacroTargets(targetCalories: number, weightKg: number): MacroTargets {
  const proteinG = PROTEIN_G_PER_KG * weightKg;
  const proteinKcal = proteinG * 4;
  const fatKcal = FAT_PERCENT_OF_CALORIES * targetCalories;
  const fatG = fatKcal / 9;
  const carbsKcal = Math.max(0, targetCalories - proteinKcal - fatKcal);
  const carbsG = carbsKcal / 4;

  return {
    calories: Math.round(targetCalories),
    proteinG: Math.round(proteinG),
    fatG: Math.round(fatG),
    carbsG: Math.round(carbsG),
  };
}
