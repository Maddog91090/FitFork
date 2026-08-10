import type { ImageSourcePropType } from 'react-native';
import type { GamificationStats } from './workoutGamification';

export type BadgeId =
  | 'premiere-seance'
  | 'habitue'
  | 'veteran'
  | 'mois-sans-faute'
  | 'sur-la-duree'
  | 'esprit-equipe'
  | 'duo-en-or';

export type Badge = {
  id: BadgeId;
  label: string;
  description: string;
  medalImage: ImageSourcePropType;
  check: (stats: GamificationStats) => boolean;
  /**
   * False when nobody can currently earn this badge because a feature it
   * depends on doesn't exist yet (e.g. the friend/partner system) — distinct
   * from "locked, but you can go earn it". Defaults to true when omitted.
   */
  available?: boolean;
};

export const BADGES: Badge[] = [
  {
    id: 'premiere-seance',
    label: 'Première séance',
    description: 'Valider ta toute première séance.',
    medalImage: require('../../assets/images/badges/premiere-seance.png'),
    check: (stats) => stats.totalCompletions >= 1,
  },
  {
    id: 'habitue',
    label: 'Habitué',
    description: '10 séances validées au total.',
    medalImage: require('../../assets/images/badges/habitue.png'),
    check: (stats) => stats.totalCompletions >= 10,
  },
  {
    id: 'veteran',
    label: 'Vétéran',
    description: '50 séances validées au total.',
    medalImage: require('../../assets/images/badges/veteran.png'),
    check: (stats) => stats.totalCompletions >= 50,
  },
  {
    id: 'mois-sans-faute',
    label: 'Un mois sans faute',
    description: '4 semaines de suite à 3 séances.',
    medalImage: require('../../assets/images/badges/mois-sans-faute.png'),
    check: (stats) => stats.streak >= 4,
  },
  {
    id: 'sur-la-duree',
    label: 'Sur la durée',
    description: '12 semaines de suite à 3 séances.',
    medalImage: require('../../assets/images/badges/sur-la-duree.png'),
    check: (stats) => stats.streak >= 12,
  },
  {
    id: 'esprit-equipe',
    label: "Esprit d'équipe",
    description: "Bientôt disponible — nécessite un système d'amis.",
    medalImage: require('../../assets/images/badges/esprit-equipe.png'),
    check: (stats) => stats.teamBonusCount >= 1,
    available: false,
  },
  {
    id: 'duo-en-or',
    label: 'Duo en or',
    description: "Bientôt disponible — nécessite un système d'amis.",
    medalImage: require('../../assets/images/badges/duo-en-or.png'),
    check: (stats) => stats.teamBonusStreak >= 4,
    available: false,
  },
];

export function unlockedBadgeIds(stats: GamificationStats): BadgeId[] {
  return BADGES.filter((badge) => badge.check(stats)).map((badge) => badge.id);
}
