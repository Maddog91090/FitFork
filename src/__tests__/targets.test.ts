import { computeTargetsFromProfile } from '../lib/targets';

describe('computeTargetsFromProfile', () => {
  it('composes BMR -> TDEE -> target calories -> macros for a full profile', () => {
    const profile = {
      sex: 'male' as const,
      age: 30,
      heightCm: 180,
      weightKg: 80,
      activityLevel: 'moderate' as const,
      goal: 'maintain' as const,
    };
    const trainingProfile = {
      daysPerWeek: 4,
      experienceLevel: 'intermediate' as const,
      equipment: 'full_gym' as const,
    };

    // BMR = 1780
    // lifestyle: 1780 * 1.25 (moderate) = 2225
    // training: 6 MET * 80kg * (50/60)h = 400 kcal/session, * 4 days/week / 7 = 228.57...
    // TDEE = 2225 + 1600/7 = 17175/7 = 2453.571... , maintain -> unchanged
    // protein 160g/640kcal, fat 0.28*(17175/7)=687kcal->76g, carbs (17175/7-640-687)/4=1126.57.../4->282g
    const result = computeTargetsFromProfile(profile, trainingProfile);

    expect(result).toEqual({
      calories: 2454,
      proteinG: 160,
      fatG: 76,
      carbsG: 282,
    });
  });
});
