import {
  calculateWeeklyTrendPercent,
  calculateCalorieAdjustment,
  computeAdjustedTargets,
  type WeightLogPoint,
} from '../lib/progressTracking';

describe('calculateWeeklyTrendPercent', () => {
  it('returns null with fewer than 2 log entries', () => {
    expect(calculateWeeklyTrendPercent([])).toBeNull();
    expect(calculateWeeklyTrendPercent([{ loggedAt: '2026-01-01', weightKg: 80 }])).toBeNull();
  });

  it('computes the weekly percent change between the earliest and latest entries', () => {
    const logs: WeightLogPoint[] = [
      { loggedAt: '2026-01-01', weightKg: 80 },
      { loggedAt: '2026-01-15', weightKg: 79 },
    ];
    // 14 days = 2 weeks; (79-80)/80*100 = -1.25% over 2 weeks = -0.625%/week
    expect(calculateWeeklyTrendPercent(logs)).toBeCloseTo(-0.625, 5);
  });

  it('sorts entries by date before computing (order-independent input)', () => {
    const logs: WeightLogPoint[] = [
      { loggedAt: '2026-01-15', weightKg: 79 },
      { loggedAt: '2026-01-01', weightKg: 80 },
    ];
    expect(calculateWeeklyTrendPercent(logs)).toBeCloseTo(-0.625, 5);
  });

  it('returns null when the earliest and latest entries share the same date', () => {
    const logs: WeightLogPoint[] = [
      { loggedAt: '2026-01-01', weightKg: 80 },
      { loggedAt: '2026-01-01', weightKg: 79 },
    ];
    expect(calculateWeeklyTrendPercent(logs)).toBeNull();
  });
});

describe('calculateCalorieAdjustment', () => {
  it('cuts harder when losing weight slower than expected', () => {
    // expected -0.75%/week, actual -0.1%/week (much less negative) -> deviation exceeds threshold
    expect(calculateCalorieAdjustment('cut', -0.1)).toBe(-150);
  });

  it('eases up when losing weight faster than expected', () => {
    expect(calculateCalorieAdjustment('cut', -2)).toBe(150);
  });

  it('makes no adjustment when cutting trend is within tolerance', () => {
    expect(calculateCalorieAdjustment('cut', -0.75)).toBe(0);
  });

  it('increases surplus when gaining weight slower than expected', () => {
    expect(calculateCalorieAdjustment('bulk', 0.05)).toBe(150);
  });

  it('eases up when gaining weight faster than expected', () => {
    expect(calculateCalorieAdjustment('bulk', 1)).toBe(-150);
  });

  it('makes no adjustment when bulking trend is within tolerance', () => {
    expect(calculateCalorieAdjustment('bulk', 0.375)).toBe(0);
  });

  it('reduces calories when maintaining but actually gaining', () => {
    expect(calculateCalorieAdjustment('maintain', 0.5)).toBe(-150);
  });

  it('increases calories when maintaining but actually losing', () => {
    expect(calculateCalorieAdjustment('maintain', -0.5)).toBe(150);
  });

  it('makes no adjustment when maintaining within tolerance', () => {
    expect(calculateCalorieAdjustment('maintain', 0.1)).toBe(0);
  });
});

describe('computeAdjustedTargets', () => {
  const baseTargets = { calories: 2000, proteinG: 150, fatG: 60, carbsG: 200 };

  it('returns the base targets unchanged when there is insufficient weight data', () => {
    expect(computeAdjustedTargets(baseTargets, 'cut', 80, [])).toEqual(baseTargets);
  });

  it('returns the base targets unchanged when the trend is within tolerance', () => {
    const logs: WeightLogPoint[] = [
      { loggedAt: '2026-01-01', weightKg: 80 },
      { loggedAt: '2026-01-08', weightKg: 79.4 }, // -0.75%/week, exactly on target for a cut
    ];
    expect(computeAdjustedTargets(baseTargets, 'cut', 80, logs)).toEqual(baseTargets);
  });

  it('recomputes macros from the adjusted calorie total when a deviation is found', () => {
    const logs: WeightLogPoint[] = [
      { loggedAt: '2026-01-01', weightKg: 80 },
      { loggedAt: '2026-01-08', weightKg: 79.9 }, // losing much slower than expected -> -150 kcal
    ];
    const result = computeAdjustedTargets(baseTargets, 'cut', 80, logs);
    expect(result.calories).toBe(1850);
    expect(result).not.toEqual(baseTargets);
  });
});
