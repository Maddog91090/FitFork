import {
  getWeekStart,
  groupByWeek,
  calculateStreak,
  calculatePoints,
  calculateLevel,
  computeTeamBonusWeeks,
  weeksForFriend,
  weeksStreak,
  computeStats,
  type WorkoutCompletion,
  type TeamWeekRow,
} from '../lib/workoutGamification';

describe('getWeekStart', () => {
  it('returns the Monday of the week containing the date', () => {
    expect(getWeekStart('2026-08-05')).toBe('2026-08-03'); // Wednesday -> Monday
    expect(getWeekStart('2026-08-03')).toBe('2026-08-03'); // Monday -> itself
    expect(getWeekStart('2026-08-09')).toBe('2026-08-03'); // Sunday -> previous Monday
  });
});

describe('groupByWeek', () => {
  it('counts distinct days per week, not distinct completions', () => {
    const completions: WorkoutCompletion[] = [
      { sessionIndex: 0, completedDate: '2026-08-03' },
      { sessionIndex: 1, completedDate: '2026-08-03' }, // same day, different session
      { sessionIndex: 2, completedDate: '2026-08-05' },
    ];
    const weeks = groupByWeek(completions);
    expect(weeks).toEqual([{ weekStart: '2026-08-03', days: 2 }]);
  });

  it('splits completions across weeks', () => {
    const completions: WorkoutCompletion[] = [
      { sessionIndex: 0, completedDate: '2026-07-27' },
      { sessionIndex: 0, completedDate: '2026-08-03' },
    ];
    const weeks = groupByWeek(completions);
    expect(weeks).toEqual([
      { weekStart: '2026-07-27', days: 1 },
      { weekStart: '2026-08-03', days: 1 },
    ]);
  });
});

describe('calculateStreak', () => {
  it('breaks the streak on a week with fewer than 3 distinct days, counts only the elapsed run after the gap', () => {
    const completions: WorkoutCompletion[] = [
      // week 2026-07-06: 3 days (qualifies)
      { sessionIndex: 0, completedDate: '2026-07-06' },
      { sessionIndex: 1, completedDate: '2026-07-08' },
      { sessionIndex: 2, completedDate: '2026-07-10' },
      // week 2026-07-13: 3 days (qualifies)
      { sessionIndex: 0, completedDate: '2026-07-13' },
      { sessionIndex: 1, completedDate: '2026-07-15' },
      { sessionIndex: 2, completedDate: '2026-07-17' },
      // week 2026-07-20: only 1 day (gap)
      { sessionIndex: 0, completedDate: '2026-07-20' },
      // week 2026-07-27: 3 days (qualifies, most recent elapsed week)
      { sessionIndex: 0, completedDate: '2026-07-27' },
      { sessionIndex: 1, completedDate: '2026-07-29' },
      { sessionIndex: 2, completedDate: '2026-07-31' },
      // current week 2026-08-03 (today = 2026-08-05): 2 days so far, in progress
      { sessionIndex: 0, completedDate: '2026-08-03' },
      { sessionIndex: 1, completedDate: '2026-08-04' },
    ];
    const result = calculateStreak(completions, '2026-08-05');
    expect(result).toEqual({ streak: 1, thisWeekDays: 2 });
  });

  it('counts the current in-progress week provisionally once it reaches 3/3', () => {
    const completions: WorkoutCompletion[] = [
      { sessionIndex: 0, completedDate: '2026-07-27' },
      { sessionIndex: 1, completedDate: '2026-07-29' },
      { sessionIndex: 2, completedDate: '2026-07-31' },
      { sessionIndex: 0, completedDate: '2026-08-03' },
      { sessionIndex: 1, completedDate: '2026-08-04' },
      { sessionIndex: 2, completedDate: '2026-08-05' },
    ];
    const result = calculateStreak(completions, '2026-08-05');
    expect(result).toEqual({ streak: 2, thisWeekDays: 3 });
  });

  it('returns zero streak and zero thisWeekDays with no history', () => {
    expect(calculateStreak([], '2026-08-05')).toEqual({ streak: 0, thisWeekDays: 0 });
  });
});

describe('calculatePoints', () => {
  it('awards 10 per completion, 20 per week reaching 3/3, 15 per team bonus week', () => {
    const completions: WorkoutCompletion[] = [
      { sessionIndex: 0, completedDate: '2026-08-03' },
      { sessionIndex: 1, completedDate: '2026-08-04' },
      { sessionIndex: 2, completedDate: '2026-08-05' },
    ];
    // 3 completions * 10 = 30, one qualifying week * 20 = 20, that week is
    // also a team bonus week * 15 = 15 -> 65
    expect(calculatePoints(completions, ['2026-08-03'])).toBe(65);
  });

  it('awards points for a same-day double session without double-counting the weekly bonus', () => {
    const completions: WorkoutCompletion[] = [
      { sessionIndex: 0, completedDate: '2026-08-03' },
      { sessionIndex: 1, completedDate: '2026-08-03' },
    ];
    // 2 completions * 10 = 20, week has only 1 distinct day -> no weekly bonus
    expect(calculatePoints(completions, [])).toBe(20);
  });
});

describe('calculateLevel', () => {
  it('levels up every 100 points, starting at level 1', () => {
    expect(calculateLevel(0)).toBe(1);
    expect(calculateLevel(99)).toBe(1);
    expect(calculateLevel(100)).toBe(2);
    expect(calculateLevel(199)).toBe(2);
    expect(calculateLevel(200)).toBe(3);
  });
});

describe('computeTeamBonusWeeks', () => {
  it('only returns weeks where both profiles reached 3/3', () => {
    const myWeeks = [
      { weekStart: '2026-07-27', days: 3 },
      { weekStart: '2026-08-03', days: 2 },
    ];
    const otherWeeks = [
      { weekStart: '2026-07-27', days: 3 },
      { weekStart: '2026-08-03', days: 3 },
    ];
    expect(computeTeamBonusWeeks(myWeeks, otherWeeks)).toEqual(['2026-07-27']);
  });

  it('returns an empty list when the partner has no matching weeks', () => {
    const myWeeks = [{ weekStart: '2026-07-27', days: 3 }];
    expect(computeTeamBonusWeeks(myWeeks, [])).toEqual([]);
  });
});

describe('weeksForFriend', () => {
  it("returns only the given friend's rows, mapped to WeekDayCount", () => {
    const teamRows: TeamWeekRow[] = [
      { userId: 'friend-a', weekStart: '2026-07-27', days: 3 },
      { userId: 'friend-b', weekStart: '2026-07-27', days: 1 },
      { userId: 'friend-a', weekStart: '2026-08-03', days: 2 },
    ];
    expect(weeksForFriend(teamRows, 'friend-a')).toEqual([
      { weekStart: '2026-07-27', days: 3 },
      { weekStart: '2026-08-03', days: 2 },
    ]);
  });

  it('returns an empty list when the friend has no rows', () => {
    expect(weeksForFriend([], 'friend-a')).toEqual([]);
  });
});

describe('weeksStreak', () => {
  it('is exported and computes a consecutive-week streak from a qualifying set', () => {
    const qualifying = new Set(['2026-07-27', '2026-08-03']);
    expect(weeksStreak(qualifying, '2026-08-05')).toBe(2);
  });

  it('returns 0 for an empty qualifying set', () => {
    expect(weeksStreak(new Set(), '2026-08-05')).toBe(0);
  });
});

describe('computeStats', () => {
  it('combines streak, points, level, and the team-bonus streak it is given', () => {
    const completions: WorkoutCompletion[] = [
      { sessionIndex: 0, completedDate: '2026-07-27' },
      { sessionIndex: 1, completedDate: '2026-07-29' },
      { sessionIndex: 2, completedDate: '2026-07-31' },
      { sessionIndex: 0, completedDate: '2026-08-03' },
      { sessionIndex: 1, completedDate: '2026-08-04' },
      { sessionIndex: 2, completedDate: '2026-08-05' },
    ];
    const teamBonusWeekStarts = ['2026-07-27', '2026-08-03'];
    const stats = computeStats(completions, teamBonusWeekStarts, 2, '2026-08-05');
    expect(stats.totalCompletions).toBe(6);
    expect(stats.streak).toBe(2);
    expect(stats.thisWeekDays).toBe(3);
    expect(stats.teamBonusCount).toBe(2);
    expect(stats.teamBonusStreak).toBe(2);
    // 6*10 + 2*20 (both weeks qualify) + 2*15 (both team bonus weeks) = 130
    expect(stats.totalPoints).toBe(130);
    expect(stats.level).toBe(2);
  });

  it('uses the supplied teamBonusStreak verbatim, independent of teamBonusWeekStarts', () => {
    // A caller can legitimately pass a teamBonusStreak that doesn't match a
    // naive re-derivation from teamBonusWeekStarts — e.g. when the streak
    // is the max across several independent friendships, not a walk over the
    // (duplicate-containing) union of every friendship's bonus weeks.
    const completions: WorkoutCompletion[] = [
      { sessionIndex: 0, completedDate: '2026-08-03' },
    ];
    const stats = computeStats(completions, ['2026-08-03', '2026-08-03'], 5, '2026-08-05');
    expect(stats.teamBonusStreak).toBe(5);
    expect(stats.teamBonusCount).toBe(2);
  });
});
