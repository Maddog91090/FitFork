import type { ImageSourcePropType } from 'react-native';

export type MovementKey =
  | 'squat'
  | 'squatJump'
  | 'squatBulgarian'
  | 'pushupFloor'
  | 'pushupWall'
  | 'lunge'
  | 'lungeJump'
  | 'plank'
  | 'sidePlank'
  | 'gluteBridge'
  | 'jumpingJack'
  | 'highKnees'
  | 'heelToButt'
  | 'marchInPlace'
  | 'mountainClimber'
  | 'burpee';

export type MovementAsset = {
  label: string;
  start: ImageSourcePropType;
  end: ImageSourcePropType;
};

export const movementAssets: Record<MovementKey, MovementAsset> = {
  squat: {
    label: 'Squat',
    start: require('../../assets/images/exercises/squat-start.png'),
    end: require('../../assets/images/exercises/squat-end.png'),
  },
  squatJump: {
    label: 'Squat sauté',
    start: require('../../assets/images/exercises/squat-jump-start.png'),
    end: require('../../assets/images/exercises/squat-jump-end.png'),
  },
  squatBulgarian: {
    label: 'Squat bulgare',
    start: require('../../assets/images/exercises/squat-bulgarian-start.png'),
    end: require('../../assets/images/exercises/squat-bulgarian-end.png'),
  },
  pushupFloor: {
    label: 'Pompe',
    start: require('../../assets/images/exercises/pushup-floor-start.png'),
    end: require('../../assets/images/exercises/pushup-floor-end.png'),
  },
  pushupWall: {
    label: 'Pompe contre un mur',
    start: require('../../assets/images/exercises/pushup-wall-start.png'),
    end: require('../../assets/images/exercises/pushup-wall-end.png'),
  },
  lunge: {
    label: 'Fente',
    start: require('../../assets/images/exercises/lunge-start.png'),
    end: require('../../assets/images/exercises/lunge-end.png'),
  },
  lungeJump: {
    label: 'Fente sautée',
    start: require('../../assets/images/exercises/lunge-jump-start.png'),
    end: require('../../assets/images/exercises/lunge-jump-end.png'),
  },
  plank: {
    label: 'Gainage planche',
    start: require('../../assets/images/exercises/plank-start.png'),
    end: require('../../assets/images/exercises/plank-end.png'),
  },
  sidePlank: {
    label: 'Gainage latéral',
    start: require('../../assets/images/exercises/side-plank-start.png'),
    end: require('../../assets/images/exercises/side-plank-end.png'),
  },
  gluteBridge: {
    label: 'Pont fessier',
    start: require('../../assets/images/exercises/glute-bridge-start.png'),
    end: require('../../assets/images/exercises/glute-bridge-end.png'),
  },
  jumpingJack: {
    label: 'Jumping jack',
    start: require('../../assets/images/exercises/jumping-jack-start.png'),
    end: require('../../assets/images/exercises/jumping-jack-end.png'),
  },
  highKnees: {
    label: 'Montées de genoux',
    start: require('../../assets/images/exercises/high-knees-start.png'),
    end: require('../../assets/images/exercises/high-knees-end.png'),
  },
  heelToButt: {
    label: 'Talons-fesses',
    start: require('../../assets/images/exercises/heel-to-butt-start.png'),
    end: require('../../assets/images/exercises/heel-to-butt-end.png'),
  },
  marchInPlace: {
    label: 'Marche sur place',
    start: require('../../assets/images/exercises/march-in-place-start.png'),
    end: require('../../assets/images/exercises/march-in-place-end.png'),
  },
  mountainClimber: {
    label: 'Mountain climber',
    start: require('../../assets/images/exercises/mountain-climber-start.png'),
    end: require('../../assets/images/exercises/mountain-climber-end.png'),
  },
  burpee: {
    label: 'Burpee',
    start: require('../../assets/images/exercises/burpee-start.png'),
    end: require('../../assets/images/exercises/burpee-end.png'),
  },
};

export const exerciseNameToMovementKey: Record<string, MovementKey> = {
  'Squats sur chaise (assis-debout, lent)': 'squat',
  'Squats à vide, rythme tranquille': 'squat',
  Squats: 'squat',
  'Squats complets': 'squat',
  'Squats sautés ou squats rapides': 'squatJump',
  'Squats sautés': 'squatJump',
  'Squats bulgares (pied arrière surélevé)': 'squatBulgarian',
  'Pompes (sur les genoux si besoin)': 'pushupFloor',
  'Pompes complètes (pieds surélevés pour durcir)': 'pushupFloor',
  'Pompes déclinées': 'pushupFloor',
  'Pompes contre un mur': 'pushupWall',
  "Fentes statiques (une jambe puis l'autre, sans à-coup)": 'lunge',
  'Fentes statiques': 'lunge',
  'Fentes alternées': 'lunge',
  'Fentes arrière': 'lunge',
  'Fentes sautées alternées': 'lungeJump',
  'Fentes sautées': 'lungeJump',
  'Gainage sur les genoux': 'plank',
  'Gainage planche': 'plank',
  "Gainage planche avec touches d'épaules": 'plank',
  'Gainage latéral': 'sidePlank',
  'Gainage latéral dynamique': 'sidePlank',
  'Pont fessier': 'gluteBridge',
  'Pont fessier une jambe': 'gluteBridge',
  'Jumping jacks doux (sans saut : un pied écarté à la fois)': 'jumpingJack',
  'Jumping jacks': 'jumpingJack',
  'Montées de genoux sur place': 'highKnees',
  'Genoux hauts (course sur place)': 'highKnees',
  'Sprint sur place, genoux hauts': 'highKnees',
  'Talons-fesses': 'heelToButt',
  'Marche rapide sur place, genoux montés': 'marchInPlace',
  'Mountain climbers': 'mountainClimber',
  'Mountain climbers rapides': 'mountainClimber',
  'Burpees (version sans saut si trop dur)': 'burpee',
  Burpees: 'burpee',
  'Burpees avec saut': 'burpee',
};

export function getExerciseVisual(exerciseName: string): MovementAsset | undefined {
  const key = exerciseNameToMovementKey[exerciseName];
  if (!key) {
    return undefined;
  }
  return movementAssets[key];
}
