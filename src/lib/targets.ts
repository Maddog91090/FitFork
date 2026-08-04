import type { Profile, TrainingProfile } from './profile';
import {
  calculateBMR,
  calculateTDEE,
  calculateTargetCalories,
  calculateMacroTargets,
  type MacroTargets,
} from './nutrition';

export type { MacroTargets };

export function computeTargetsFromProfile(
  profile: Profile,
  trainingProfile: TrainingProfile
): MacroTargets {
  const bmr = calculateBMR(profile.sex, profile.weightKg, profile.heightCm, profile.age);
  const tdee = calculateTDEE(
    bmr,
    profile.activityLevel,
    trainingProfile.experienceLevel,
    profile.weightKg,
    trainingProfile.daysPerWeek
  );
  const targetCalories = calculateTargetCalories(tdee, profile.goal);
  return calculateMacroTargets(targetCalories, profile.weightKg);
}
