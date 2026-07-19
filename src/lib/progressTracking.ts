import { calculateMacroTargets, type Goal, type MacroTargets } from './nutrition';

export type WeightLogPoint = {
  loggedAt: string;
  weightKg: number;
};

const EXPECTED_WEEKLY_PERCENT: Record<Goal, number> = {
  cut: -0.75,
  maintain: 0,
  bulk: 0.375,
};

const CALORIE_ADJUSTMENT_STEP = 150;
const MAINTAIN_DEVIATION_THRESHOLD_PERCENT = 0.375;

export function calculateWeeklyTrendPercent(logs: WeightLogPoint[]): number | null {
  if (logs.length < 2) return null;

  const sorted = [...logs].sort(
    (a, b) => new Date(a.loggedAt).getTime() - new Date(b.loggedAt).getTime()
  );
  const earliest = sorted[0];
  const latest = sorted[sorted.length - 1];

  const daysBetween =
    (new Date(latest.loggedAt).getTime() - new Date(earliest.loggedAt).getTime()) /
    (1000 * 60 * 60 * 24);
  if (daysBetween <= 0) return null;

  const weeksBetween = daysBetween / 7;
  const percentChange = ((latest.weightKg - earliest.weightKg) / earliest.weightKg) * 100;
  return percentChange / weeksBetween;
}

export function calculateCalorieAdjustment(goal: Goal, actualWeeklyPercentChange: number): number {
  if (goal === 'maintain') {
    if (actualWeeklyPercentChange > MAINTAIN_DEVIATION_THRESHOLD_PERCENT) return -CALORIE_ADJUSTMENT_STEP;
    if (actualWeeklyPercentChange < -MAINTAIN_DEVIATION_THRESHOLD_PERCENT) return CALORIE_ADJUSTMENT_STEP;
    return 0;
  }

  const expected = EXPECTED_WEEKLY_PERCENT[goal];
  const deviation = actualWeeklyPercentChange - expected;
  const threshold = Math.abs(expected) * 0.5;

  if (goal === 'cut') {
    if (deviation > threshold) return -CALORIE_ADJUSTMENT_STEP;
    if (deviation < -threshold) return CALORIE_ADJUSTMENT_STEP;
    return 0;
  }

  // bulk
  if (deviation < -threshold) return CALORIE_ADJUSTMENT_STEP;
  if (deviation > threshold) return -CALORIE_ADJUSTMENT_STEP;
  return 0;
}

export function computeAdjustedTargets(
  baseTargets: MacroTargets,
  goal: Goal,
  weightKg: number,
  logs: WeightLogPoint[]
): MacroTargets {
  const trend = calculateWeeklyTrendPercent(logs);
  if (trend === null) return baseTargets;

  const adjustment = calculateCalorieAdjustment(goal, trend);
  if (adjustment === 0) return baseTargets;

  return calculateMacroTargets(baseTargets.calories + adjustment, weightKg);
}
