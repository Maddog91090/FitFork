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

    // BMR = 1780, TDEE = 1780*1.55 + 4*200 = 3559, maintain -> 3559 unchanged
    // protein 160g/640kcal, fat 0.28*3559=996.52kcal->111g, carbs (3559-640-996.52)/4->481g
    const result = computeTargetsFromProfile(profile, trainingProfile);

    expect(result).toEqual({
      calories: 3559,
      proteinG: 160,
      fatG: 111,
      carbsG: 481,
    });
  });
});
