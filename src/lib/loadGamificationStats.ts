import { fetchMyCompletions, fetchTeamWeekProgress } from './workoutCompletionsData';
import { fetchMyFriends, type Friend } from './friendsData';
import { groupByWeek, computeStats, weeksForFriend, type GamificationStats } from './workoutGamification';
import {
  computeFriendBonuses,
  flattenTeamBonusWeeks,
  maxTeamBonusStreak,
  type FriendBonusSummary,
} from './friendGamification';

export type GamificationLoadResult = {
  stats: GamificationStats;
  friendBonuses: FriendBonusSummary[];
  friends: Friend[];
  friendsError: string | null;
};

export async function loadGamificationStats(userId: string, todayStr: string): Promise<GamificationLoadResult> {
  const myCompletions = await fetchMyCompletions(userId);
  const myWeeks = groupByWeek(myCompletions);

  let friends: Friend[] = [];
  let friendBonuses: FriendBonusSummary[] = [];
  let friendsError: string | null = null;

  try {
    friends = await fetchMyFriends();
    const teamRows = await fetchTeamWeekProgress();
    friendBonuses = computeFriendBonuses(
      myWeeks,
      friends.map((f) => ({ friendUserId: f.friendUserId, weeks: weeksForFriend(teamRows, f.friendUserId) })),
      todayStr
    );
  } catch {
    friendsError = 'Impossible de charger tes amis.';
  }

  const teamBonusWeekStarts = flattenTeamBonusWeeks(friendBonuses);
  const teamBonusStreak = maxTeamBonusStreak(friendBonuses);
  const stats = computeStats(myCompletions, teamBonusWeekStarts, teamBonusStreak, todayStr);

  return { stats, friendBonuses, friends, friendsError };
}
