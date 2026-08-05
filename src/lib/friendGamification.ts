import { getWeekStart, computeTeamBonusWeeks, weeksStreak, type WeekDayCount } from './workoutGamification';

const WEEKLY_TARGET_DAYS = 3;

export type FriendInput = {
  friendUserId: string;
  weeks: WeekDayCount[];
};

export type FriendBonusSummary = {
  friendUserId: string;
  bonusWeekStarts: string[];
  bonusStreak: number;
  thisWeekCombinedDays: number;
};

export function computeFriendBonuses(
  myWeeks: WeekDayCount[],
  friends: FriendInput[],
  todayStr: string
): FriendBonusSummary[] {
  const currentWeekStart = getWeekStart(todayStr);
  const myThisWeek = Math.min(
    myWeeks.find((w) => w.weekStart === currentWeekStart)?.days ?? 0,
    WEEKLY_TARGET_DAYS
  );

  return friends.map((friend) => {
    const bonusWeekStarts = computeTeamBonusWeeks(myWeeks, friend.weeks);
    const bonusStreak = weeksStreak(new Set(bonusWeekStarts), todayStr);
    const friendThisWeek = Math.min(
      friend.weeks.find((w) => w.weekStart === currentWeekStart)?.days ?? 0,
      WEEKLY_TARGET_DAYS
    );
    return {
      friendUserId: friend.friendUserId,
      bonusWeekStarts,
      bonusStreak,
      thisWeekCombinedDays: myThisWeek + friendThisWeek,
    };
  });
}

export function flattenTeamBonusWeeks(summaries: FriendBonusSummary[]): string[] {
  return summaries.flatMap((s) => s.bonusWeekStarts);
}

export function maxTeamBonusStreak(summaries: FriendBonusSummary[]): number {
  return summaries.reduce((max, s) => Math.max(max, s.bonusStreak), 0);
}
