import type { Profile } from './profile';
import {
  calculateBMR,
  calculateTDEE,
  calculateTargetCalories,
  calculateMacroTargets,
  type MacroTargets,
} from './nutrition';

export type { MacroTargets };

/**
 * Training frequency doesn't factor in here: `profile.activityLevel` is
 * meant to describe the user's whole week, workouts included (see the
 * comment on `ACTIVITY_MULTIPLIERS` in nutrition.ts) — a separate training
 * days/week input would double-count that exercise.
 */
export function computeTargetsFromProfile(profile: Profile): MacroTargets {
  const bmr = calculateBMR(profile.sex, profile.weightKg, profile.heightCm, profile.age);
  const tdee = calculateTDEE(bmr, profile.activityLevel);
  const targetCalories = calculateTargetCalories(tdee, profile.goal);
  return calculateMacroTargets(targetCalories, profile.weightKg);
}
