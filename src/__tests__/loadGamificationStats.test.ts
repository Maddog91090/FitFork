// src/__tests__/loadGamificationStats.test.ts
import { loadGamificationStats } from '../lib/loadGamificationStats';
import { fetchMyCompletions, fetchTeamWeekProgress } from '../lib/workoutCompletionsData';
import { fetchMyFriends } from '../lib/friendsData';

jest.mock('../lib/workoutCompletionsData', () => ({
  fetchMyCompletions: jest.fn(),
  fetchTeamWeekProgress: jest.fn(),
}));

jest.mock('../lib/friendsData', () => ({
  fetchMyFriends: jest.fn(),
}));

beforeEach(() => {
  jest.clearAllMocks();
});

describe('loadGamificationStats', () => {
  it("combines my completions with each friend's independent bonus", async () => {
    (fetchMyCompletions as jest.Mock).mockResolvedValue([
      { id: 'c1', sessionIndex: 0, completedDate: '2026-08-03' },
      { id: 'c2', sessionIndex: 1, completedDate: '2026-08-04' },
      { id: 'c3', sessionIndex: 2, completedDate: '2026-08-05' },
    ]);
    (fetchMyFriends as jest.Mock).mockResolvedValue([
      { friendUserId: 'friend-a', friendEmail: 'a@example.com', friendedAt: '2026-07-01T00:00:00Z' },
    ]);
    (fetchTeamWeekProgress as jest.Mock).mockResolvedValue([
      { userId: 'friend-a', weekStart: '2026-08-03', days: 3 },
    ]);

    const result = await loadGamificationStats('me', '2026-08-05');

    expect(result.friendsError).toBeNull();
    expect(result.friends).toEqual([
      { friendUserId: 'friend-a', friendEmail: 'a@example.com', friendedAt: '2026-07-01T00:00:00Z' },
    ]);
    expect(result.friendBonuses).toEqual([
      {
        friendUserId: 'friend-a',
        bonusWeekStarts: ['2026-08-03'],
        bonusStreak: 1,
        thisWeekCombinedDays: 6,
      },
    ]);
    // 3 completions * 10 + 1 weekly target * 20 + 1 team bonus week * 15 = 65
    expect(result.stats.totalPoints).toBe(65);
    expect(result.stats.teamBonusStreak).toBe(1);
  });

  it('still returns personal stats when the friends fetch fails', async () => {
    (fetchMyCompletions as jest.Mock).mockResolvedValue([
      { id: 'c1', sessionIndex: 0, completedDate: '2026-08-03' },
    ]);
    (fetchMyFriends as jest.Mock).mockRejectedValue(new Error('network'));

    const result = await loadGamificationStats('me', '2026-08-05');

    expect(result.friendsError).not.toBeNull();
    expect(result.friends).toEqual([]);
    expect(result.friendBonuses).toEqual([]);
    expect(result.stats.totalCompletions).toBe(1);
    expect(result.stats.totalPoints).toBe(10);
  });

  it('propagates a fetchMyCompletions failure to the caller', async () => {
    (fetchMyCompletions as jest.Mock).mockRejectedValue(new Error('completions down'));
    await expect(loadGamificationStats('me', '2026-08-05')).rejects.toThrow('completions down');
  });
});
