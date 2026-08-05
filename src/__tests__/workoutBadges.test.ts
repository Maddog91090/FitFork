import { BADGES, unlockedBadgeIds } from '../lib/workoutBadges';
import type { GamificationStats } from '../lib/workoutGamification';

const BASE_STATS: GamificationStats = {
  totalCompletions: 0,
  streak: 0,
  thisWeekDays: 0,
  totalPoints: 0,
  level: 1,
  teamBonusCount: 0,
  teamBonusStreak: 0,
};

describe('BADGES', () => {
  it('has exactly the 7 designed badges', () => {
    expect(BADGES.map((b) => b.id).sort()).toEqual(
      [
        'duo-en-or',
        'esprit-equipe',
        'habitue',
        'mois-sans-faute',
        'premiere-seance',
        'sur-la-duree',
        'veteran',
      ].sort()
    );
  });
});

describe('unlockedBadgeIds', () => {
  it('unlocks nothing for a brand-new profile', () => {
    expect(unlockedBadgeIds(BASE_STATS)).toEqual([]);
  });

  it('unlocks "premiere-seance" at 1 completion, not before', () => {
    expect(unlockedBadgeIds({ ...BASE_STATS, totalCompletions: 0 })).not.toContain('premiere-seance');
    expect(unlockedBadgeIds({ ...BASE_STATS, totalCompletions: 1 })).toContain('premiere-seance');
  });

  it('unlocks "habitue" at 10 completions, not at 9', () => {
    expect(unlockedBadgeIds({ ...BASE_STATS, totalCompletions: 9 })).not.toContain('habitue');
    expect(unlockedBadgeIds({ ...BASE_STATS, totalCompletions: 10 })).toContain('habitue');
  });

  it('unlocks "veteran" at 50 completions, not at 49', () => {
    expect(unlockedBadgeIds({ ...BASE_STATS, totalCompletions: 49 })).not.toContain('veteran');
    expect(unlockedBadgeIds({ ...BASE_STATS, totalCompletions: 50 })).toContain('veteran');
  });

  it('unlocks "mois-sans-faute" at streak 4, not at 3', () => {
    expect(unlockedBadgeIds({ ...BASE_STATS, streak: 3 })).not.toContain('mois-sans-faute');
    expect(unlockedBadgeIds({ ...BASE_STATS, streak: 4 })).toContain('mois-sans-faute');
  });

  it('unlocks "sur-la-duree" at streak 12, not at 11', () => {
    expect(unlockedBadgeIds({ ...BASE_STATS, streak: 11 })).not.toContain('sur-la-duree');
    expect(unlockedBadgeIds({ ...BASE_STATS, streak: 12 })).toContain('sur-la-duree');
  });

  it('unlocks "esprit-equipe" at teamBonusCount 1, not at 0', () => {
    expect(unlockedBadgeIds({ ...BASE_STATS, teamBonusCount: 0 })).not.toContain('esprit-equipe');
    expect(unlockedBadgeIds({ ...BASE_STATS, teamBonusCount: 1 })).toContain('esprit-equipe');
  });

  it('unlocks "duo-en-or" at teamBonusStreak 4, not at 3', () => {
    expect(unlockedBadgeIds({ ...BASE_STATS, teamBonusStreak: 3 })).not.toContain('duo-en-or');
    expect(unlockedBadgeIds({ ...BASE_STATS, teamBonusStreak: 4 })).toContain('duo-en-or');
  });
});
