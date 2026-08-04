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

    // BMR = 1780, TDEE = 1780*1.55 = 2759, maintain -> 2759 unchanged
    // protein 160g/640kcal, fat 0.28*2759=772.52kcal->86g, carbs (2759-640-772.52)/4=1346.48/4=336.62->337g
    const result = computeTargetsFromProfile(profile);

    expect(result).toEqual({
      calories: 2759,
      proteinG: 160,
      fatG: 86,
      carbsG: 337,
    });
  });
});
