export type WorkoutCompletion = {
  sessionIndex: number;
  completedDate: string; // 'YYYY-MM-DD'
};

export type WeekDayCount = {
  weekStart: string; // 'YYYY-MM-DD', Monday
  days: number; // distinct completed_date values that week, uncapped
};

export type TeamWeekRow = {
  userId: string;
  weekStart: string;
  days: number;
};

export type GamificationStats = {
  totalCompletions: number;
  streak: number;
  thisWeekDays: number;
  totalPoints: number;
  level: number;
  teamBonusCount: number;
  teamBonusStreak: number;
};

const WEEKLY_TARGET_DAYS = 3;
const POINTS_PER_COMPLETION = 10;
const POINTS_PER_WEEKLY_TARGET = 20;
const POINTS_PER_TEAM_BONUS = 15;
const POINTS_PER_LEVEL = 100;

/** Monday (ISO week start) of the week containing `dateStr`. */
export function getWeekStart(dateStr: string): string {
  const d = new Date(`${dateStr}T00:00:00Z`);
  const day = d.getUTCDay(); // 0 = Sunday .. 6 = Saturday
  const daysSinceMonday = (day + 6) % 7;
  d.setUTCDate(d.getUTCDate() - daysSinceMonday);
  return d.toISOString().slice(0, 10);
}

function addWeeks(weekStartStr: string, weeks: number): string {
  const d = new Date(`${weekStartStr}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + weeks * 7);
  return d.toISOString().slice(0, 10);
}

export function groupByWeek(completions: WorkoutCompletion[]): WeekDayCount[] {
  const byWeek = new Map<string, Set<string>>();
  for (const c of completions) {
    const weekStart = getWeekStart(c.completedDate);
    if (!byWeek.has(weekStart)) byWeek.set(weekStart, new Set());
    byWeek.get(weekStart)!.add(c.completedDate);
  }
  return Array.from(byWeek.entries())
    .map(([weekStart, days]) => ({ weekStart, days: days.size }))
    .sort((a, b) => a.weekStart.localeCompare(b.weekStart));
}

/**
 * Consecutive-week streak from a set of "qualifying" week-starts, walking
 * backward from the current week if it already qualifies, otherwise from
 * the most recent fully-elapsed week. Shared by the personal streak and
 * the team-bonus streak — same rule, different qualifying set.
 */
export function weeksStreak(qualifyingWeekStarts: Set<string>, todayStr: string): number {
  const currentWeekStart = getWeekStart(todayStr);
  let cursor = qualifyingWeekStarts.has(currentWeekStart)
    ? currentWeekStart
    : addWeeks(currentWeekStart, -1);
  let streak = 0;
  while (qualifyingWeekStarts.has(cursor)) {
    streak += 1;
    cursor = addWeeks(cursor, -1);
  }
  return streak;
}

export function calculateStreak(
  completions: WorkoutCompletion[],
  todayStr: string
): { streak: number; thisWeekDays: number } {
  const weeks = groupByWeek(completions);
  const qualifying = new Set(weeks.filter((w) => w.days >= WEEKLY_TARGET_DAYS).map((w) => w.weekStart));
  const currentWeekStart = getWeekStart(todayStr);
  const thisWeek = weeks.find((w) => w.weekStart === currentWeekStart);
  return {
    streak: weeksStreak(qualifying, todayStr),
    thisWeekDays: Math.min(thisWeek?.days ?? 0, WEEKLY_TARGET_DAYS),
  };
}

export function calculatePoints(completions: WorkoutCompletion[], teamBonusWeekStarts: string[]): number {
  const weeks = groupByWeek(completions);
  const weeklyBonusCount = weeks.filter((w) => w.days >= WEEKLY_TARGET_DAYS).length;
  return (
    completions.length * POINTS_PER_COMPLETION +
    weeklyBonusCount * POINTS_PER_WEEKLY_TARGET +
    teamBonusWeekStarts.length * POINTS_PER_TEAM_BONUS
  );
}

export function calculateLevel(points: number): number {
  return Math.floor(points / POINTS_PER_LEVEL) + 1;
}

export function computeTeamBonusWeeks(myWeeks: WeekDayCount[], partnerWeeksList: WeekDayCount[]): string[] {
  const myQualifying = new Set(myWeeks.filter((w) => w.days >= WEEKLY_TARGET_DAYS).map((w) => w.weekStart));
  const partnerQualifying = new Set(
    partnerWeeksList.filter((w) => w.days >= WEEKLY_TARGET_DAYS).map((w) => w.weekStart)
  );
  return Array.from(myQualifying)
    .filter((weekStart) => partnerQualifying.has(weekStart))
    .sort();
}

export function weeksForFriend(teamRows: TeamWeekRow[], friendUserId: string): WeekDayCount[] {
  return teamRows
    .filter((row) => row.userId === friendUserId)
    .map((row) => ({ weekStart: row.weekStart, days: row.days }));
}

export function computeStats(
  completions: WorkoutCompletion[],
  teamBonusWeekStarts: string[],
  teamBonusStreak: number,
  todayStr: string
): GamificationStats {
  const { streak, thisWeekDays } = calculateStreak(completions, todayStr);
  const totalPoints = calculatePoints(completions, teamBonusWeekStarts);
  return {
    totalCompletions: completions.length,
    streak,
    thisWeekDays,
    totalPoints,
    level: calculateLevel(totalPoints),
    teamBonusCount: teamBonusWeekStarts.length,
    teamBonusStreak,
  };
}
