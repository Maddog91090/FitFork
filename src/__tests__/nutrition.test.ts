import {
  calculateBMR,
  calculateTDEE,
  calculateTrainingCaloriesPerSession,
  calculateTargetCalories,
  calculateMacroTargets,
} from '../lib/nutrition';

describe('calculateBMR', () => {
  it('computes male BMR via Mifflin-St Jeor', () => {
    // 10*80 + 6.25*180 - 5*30 + 5 = 800 + 1125 - 150 + 5 = 1780
    expect(calculateBMR('male', 80, 180, 30)).toBeCloseTo(1780, 5);
  });

  it('computes female BMR via Mifflin-St Jeor', () => {
    // 10*65 + 6.25*165 - 5*25 - 161 = 650 + 1031.25 - 125 - 161 = 1395.25
    expect(calculateBMR('female', 65, 165, 25)).toBeCloseTo(1395.25, 5);
  });
});

describe('calculateTrainingCaloriesPerSession', () => {
  it('scales with MET and duration for each level, at a given bodyweight', () => {
    // beginner: 4.5 MET * 70kg * (40/60)h = 210
    expect(calculateTrainingCaloriesPerSession('beginner', 70)).toBeCloseTo(210, 5);
    // intermediate: 6 MET * 70kg * (50/60)h = 350
    expect(calculateTrainingCaloriesPerSession('intermediate', 70)).toBeCloseTo(350, 5);
    // advanced: 8 MET * 70kg * (57.5/60)h = 536.666...
    expect(calculateTrainingCaloriesPerSession('advanced', 70)).toBeCloseTo(536.6666667, 5);
  });

  it('scales linearly with bodyweight — a heavier person burns more for the same session', () => {
    const at70kg = calculateTrainingCaloriesPerSession('intermediate', 70);
    const at140kg = calculateTrainingCaloriesPerSession('intermediate', 140);
    expect(at140kg).toBeCloseTo(at70kg * 2, 5);
  });
});

describe('calculateTDEE', () => {
  it('combines the lifestyle multiplier with a weekly-averaged training contribution', () => {
    // lifestyle: 1780 * 1.25 (moderate) = 2225
    // training: (6 MET * 80kg * (50/60)h = 400 kcal/session) * 4 days/week / 7 = 228.571...
    expect(calculateTDEE(1780, 'moderate', 'intermediate', 80, 4)).toBeCloseTo(2225 + 1600 / 7, 5);
  });

  it('reduces to lifestyle-only calories with zero training days', () => {
    // 1395.25 * 1.2 (light) + 0 = 1674.3
    expect(calculateTDEE(1395.25, 'light', 'beginner', 65, 0)).toBeCloseTo(1674.3, 5);
  });

  it('averages a full 7-day training week down to exactly one session per day', () => {
    // training every day of the week: the weekly total divided by 7 is just one session's calories
    const perSession = calculateTrainingCaloriesPerSession('intermediate', 70);
    expect(calculateTDEE(1500, 'sedentary', 'intermediate', 70, 7)).toBeCloseTo(1500 * 1.15 + perSession, 5);
  });

  it('uses the lifestyle-only sedentary multiplier (1.15)', () => {
    expect(calculateTDEE(1000, 'sedentary', 'beginner', 70, 0)).toBeCloseTo(1150, 5);
  });

  it('uses the lifestyle-only very_active multiplier (1.35)', () => {
    expect(calculateTDEE(1000, 'very_active', 'beginner', 70, 0)).toBeCloseTo(1350, 5);
  });
});

describe('calculateTargetCalories', () => {
  it('reduces calories by 17.5% for a cut goal', () => {
    expect(calculateTargetCalories(3559, 'cut')).toBeCloseTo(3559 * 0.825, 5);
  });

  it('increases calories by 12.5% for a bulk goal', () => {
    expect(calculateTargetCalories(3559, 'bulk')).toBeCloseTo(3559 * 1.125, 5);
  });

  it('leaves calories unchanged for a maintain goal', () => {
    expect(calculateTargetCalories(3559, 'maintain')).toBeCloseTo(3559, 5);
  });
});

describe('calculateMacroTargets', () => {
  it('computes protein at 2.0 g/kg, fat at 28% of calories, carbs filling the remainder', () => {
    // weight 80kg -> protein 160g -> 640 kcal
    // fat: 0.28 * 3559 = 996.52 kcal -> 110.7244 g -> rounds to 111
    // carbs: 3559 - 640 - 996.52 = 1922.48 kcal -> 480.62 g -> rounds to 481
    const result = calculateMacroTargets(3559, 80);
    expect(result).toEqual({
      calories: 3559,
      proteinG: 160,
      fatG: 111,
      carbsG: 481,
    });
  });

  it('never returns negative carbs even for an extreme low-calorie/high-weight input', () => {
    // protein 2*150=300g=1200kcal, fat 0.28*1000=280kcal -> already exceeds 1000 kcal target
    const result = calculateMacroTargets(1000, 150);
    expect(result.carbsG).toBe(0);
  });
});
