import { calculateBMR, calculateTDEE, calculateTargetCalories, calculateMacroTargets } from '../lib/nutrition';

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

describe('calculateTDEE', () => {
  it('applies the activity multiplier — a single number covering the whole week, workouts included', () => {
    expect(calculateTDEE(1780, 'moderate')).toBeCloseTo(1780 * 1.55, 5);
  });

  it('uses the sedentary multiplier (1.2)', () => {
    expect(calculateTDEE(1000, 'sedentary')).toBeCloseTo(1200, 5);
  });

  it('uses the light multiplier (1.375)', () => {
    expect(calculateTDEE(1395.25, 'light')).toBeCloseTo(1918.46875, 5);
  });

  it('uses the very_active multiplier (1.9)', () => {
    expect(calculateTDEE(1000, 'very_active')).toBeCloseTo(1900, 5);
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
