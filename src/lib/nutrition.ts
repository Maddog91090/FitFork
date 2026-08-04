export type Sex = 'male' | 'female';
export type ActivityLevel = 'sedentary' | 'light' | 'moderate' | 'active' | 'very_active';
export type Goal = 'cut' | 'bulk' | 'maintain';
export type ExperienceLevel = 'beginner' | 'intermediate' | 'advanced';

export type MacroTargets = {
  calories: number;
  proteinG: number;
  fatG: number;
  carbsG: number;
};

/**
 * Onboarding asks "Niveau d'activité quotidienne" as a question distinct from
 * training days — it's meant to capture non-exercise daily movement (job,
 * commute, chores), not overall activity including workouts. That's why
 * these multipliers are a compressed 1.15–1.35 band rather than the
 * classic Mifflin-St Jeor 1.2–1.9 scale: those textbook values already
 * bake in an assumed exercise frequency per level (e.g. "active" = hard
 * exercise 6–7 days/week), and this app adds structured training back in
 * separately via `calculateTrainingCaloriesPerSession`. Using the textbook
 * scale here as well would double-count exercise energy expenditure.
 */
const LIFESTYLE_ACTIVITY_MULTIPLIERS: Record<ActivityLevel, number> = {
  sedentary: 1.15,
  light: 1.2,
  moderate: 1.25,
  active: 1.3,
  very_active: 1.35,
};

const GOAL_ADJUSTMENTS: Record<Goal, number> = {
  cut: -0.175,
  bulk: 0.125,
  maintain: 0,
};

const PROTEIN_G_PER_KG = 2.0;
const FAT_PERCENT_OF_CALORIES = 0.28;

/**
 * Rough MET (metabolic equivalent) for each home-workout level's typical
 * session, plus its duration including the shared 5-min warm-up and 5-min
 * cool-down every level does. Beginner sessions are controlled and
 * jump-free (~4.5 MET, "calisthenics, moderate effort"); intermediate adds
 * jumps and circuits (~6 MET); advanced is sustained HIIT/plyometric work
 * (~8 MET). These are deliberately approximate — MET-based estimates are
 * themselves only ever ballpark — but scaling by bodyweight and duration is
 * still far closer to reality than a flat per-session constant.
 */
const TRAINING_SESSION: Record<ExperienceLevel, { met: number; durationHours: number }> = {
  beginner: { met: 4.5, durationHours: (30 + 10) / 60 },
  intermediate: { met: 6, durationHours: (40 + 10) / 60 },
  advanced: { met: 8, durationHours: (47.5 + 10) / 60 },
};

export function calculateBMR(sex: Sex, weightKg: number, heightCm: number, age: number): number {
  const base = 10 * weightKg + 6.25 * heightCm - 5 * age;
  return sex === 'male' ? base + 5 : base - 161;
}

/** Estimated calories burned in one home-workout session at this level, for this bodyweight. */
export function calculateTrainingCaloriesPerSession(
  experienceLevel: ExperienceLevel,
  weightKg: number
): number {
  const { met, durationHours } = TRAINING_SESSION[experienceLevel];
  return met * weightKg * durationHours;
}

/**
 * TDEE = lifestyle energy expenditure (BMR × non-exercise activity
 * multiplier) + training energy, averaged across all 7 days of the week.
 * The weekly-average step matters: `trainingDaysPerWeek` is a weekly count,
 * but the app applies a single flat calorie target to every day of the meal
 * plan (including rest days), so the training contribution must be spread
 * across 7 days rather than added in full to each one — otherwise someone
 * training 4 days/week would have a full 4-session calorie bonus stacked
 * onto every single day, rest days included.
 */
export function calculateTDEE(
  bmr: number,
  activityLevel: ActivityLevel,
  experienceLevel: ExperienceLevel,
  weightKg: number,
  trainingDaysPerWeek: number
): number {
  const lifestyleCalories = bmr * LIFESTYLE_ACTIVITY_MULTIPLIERS[activityLevel];
  const weeklyTrainingCalories =
    calculateTrainingCaloriesPerSession(experienceLevel, weightKg) * trainingDaysPerWeek;
  return lifestyleCalories + weeklyTrainingCalories / 7;
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
