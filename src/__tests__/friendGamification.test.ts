import {
  computeFriendBonuses,
  flattenTeamBonusWeeks,
  maxTeamBonusStreak,
  type FriendBonusSummary,
} from '../lib/friendGamification';
import type { WeekDayCount } from '../lib/workoutGamification';

describe('computeFriendBonuses', () => {
  it('computes each friendship independently, including this week\'s combined days', () => {
    const myWeeks: WeekDayCount[] = [
      { weekStart: '2026-07-27', days: 3 },
      { weekStart: '2026-08-03', days: 2 },
    ];
    const friends = [
      {
        friendUserId: 'friend-a',
        weeks: [
          { weekStart: '2026-07-27', days: 3 },
          { weekStart: '2026-08-03', days: 3 },
        ] as WeekDayCount[],
      },
      {
        friendUserId: 'friend-b',
        weeks: [{ weekStart: '2026-07-27', days: 1 }] as WeekDayCount[],
      },
    ];

    const result = computeFriendBonuses(myWeeks, friends, '2026-08-05');

    expect(result).toEqual([
      {
        friendUserId: 'friend-a',
        bonusWeekStarts: ['2026-07-27'],
        bonusStreak: 1,
        thisWeekCombinedDays: 5, // my 2 (capped 3) + friend-a's 3 (capped 3) = 5
      },
      {
        friendUserId: 'friend-b',
        bonusWeekStarts: [],
        bonusStreak: 0,
        thisWeekCombinedDays: 2, // my 2 + friend-b's 0 this week
      },
    ]);
  });

  it('caps each side\'s contribution to this week\'s combined days at 3', () => {
    const myWeeks: WeekDayCount[] = [{ weekStart: '2026-08-03', days: 4 }];
    const friends = [
      { friendUserId: 'friend-a', weeks: [{ weekStart: '2026-08-03', days: 5 }] as WeekDayCount[] },
    ];
    const result = computeFriendBonuses(myWeeks, friends, '2026-08-05');
    expect(result[0].thisWeekCombinedDays).toBe(6); // min(4,3) + min(5,3)
  });

  it('returns an empty array for a user with no friends', () => {
    expect(computeFriendBonuses([{ weekStart: '2026-08-03', days: 3 }], [], '2026-08-05')).toEqual([]);
  });
});

describe('flattenTeamBonusWeeks', () => {
  it('concatenates every friendship\'s bonus weeks, duplicates included', () => {
    const summaries: FriendBonusSummary[] = [
      { friendUserId: 'a', bonusWeekStarts: ['2026-07-27', '2026-08-03'], bonusStreak: 2, thisWeekCombinedDays: 6 },
      { friendUserId: 'b', bonusWeekStarts: ['2026-08-03'], bonusStreak: 1, thisWeekCombinedDays: 6 },
    ];
    // 2026-08-03 appears twice on purpose: matching two friends the same
    // week is two independent bonuses, not one deduplicated bonus.
    expect(flattenTeamBonusWeeks(summaries)).toEqual(['2026-07-27', '2026-08-03', '2026-08-03']);
  });

  it('returns an empty array when there are no friends', () => {
    expect(flattenTeamBonusWeeks([])).toEqual([]);
  });
});

describe('maxTeamBonusStreak', () => {
  it('returns the best single friendship\'s streak, not a sum or union', () => {
    const summaries: FriendBonusSummary[] = [
      { friendUserId: 'a', bonusWeekStarts: [], bonusStreak: 1, thisWeekCombinedDays: 0 },
      { friendUserId: 'b', bonusWeekStarts: [], bonusStreak: 4, thisWeekCombinedDays: 0 },
      { friendUserId: 'c', bonusWeekStarts: [], bonusStreak: 2, thisWeekCombinedDays: 0 },
    ];
    expect(maxTeamBonusStreak(summaries)).toBe(4);
  });

  it('returns 0 when there are no friends', () => {
    expect(maxTeamBonusStreak([])).toBe(0);
  });
});
