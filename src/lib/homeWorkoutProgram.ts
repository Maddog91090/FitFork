import type { ImageSourcePropType } from 'react-native';
import type { ExperienceLevel } from './profile';

export type CircuitExercise = {
  name: string;
  exerciseId: string;
};

export type CircuitSession = {
  type: 'circuit';
  name: string;
  image: ImageSourcePropType;
  workSeconds: number;
  restSeconds: number;
  rounds: number;
  recoveryLabel: string;
  recoverySeconds: number;
  exercises: CircuitExercise[];
};

export type SeriesExercise = {
  name: string;
  detail: string;
  exerciseId: string;
};

export type SeriesSession = {
  type: 'series';
  name: string;
  image: ImageSourcePropType;
  restLabel: string;
  restSeconds: number;
  exercises: SeriesExercise[];
};

export type Session = CircuitSession | SeriesSession;

export type LevelProgram = {
  level: ExperienceLevel;
  label: string;
  summary: string;
  sessionDurationLabel: string;
  sessions: [Session, Session, Session];
};

export type RoutineBlock = {
  title: string;
  durationLabel: string;
  description: string;
};

export type HomeWorkoutProgram = {
  title: string;
  subtitle: string;
  guidance: string;
  warmup: RoutineBlock;
  cooldown: RoutineBlock;
  coachNotes: string[];
  levels: [LevelProgram, LevelProgram, LevelProgram];
};

export const homeWorkoutProgram: HomeWorkoutProgram = {
  title: 'Programme sportif perte de poids – à la maison',
  subtitle: '3 séances par semaine · sans matériel · 3 niveaux',
  guidance:
    "Choisis le niveau qui correspond à ta forme actuelle. Laisse toujours au moins un jour de repos entre deux séances (ex. lundi / mercredi / vendredi ou samedi). Quand un niveau devient facile, passe au suivant — pas avant. Chaque séance suit la même structure : échauffement → corps de séance → retour au calme.",
  warmup: {
    title: 'Échauffement',
    durationLabel: '5 minutes',
    description:
      "5 minutes, chaque mouvement 30 à 45 secondes enchaînés : montées de genoux sur place, rotations épaules et hanches, talons-fesses, squats lents à vide, jumping jacks doux. Objectif : avoir un peu chaud et le cœur qui monte.",
  },
  cooldown: {
    title: 'Retour au calme',
    durationLabel: '5 minutes',
    description:
      "5 minutes d'étirements doux et de respiration : cuisses, mollets, dos, épaules. Chaque étirement 20 à 30 s, sans forcer.",
  },
  coachNotes: [
    "La régularité prime sur l'intensité. Trois séances tenues chaque semaine valent mieux qu'une semaine parfaite suivie d'un abandon.",
    "Progresser : quand c'est facile, ajoute un tour, allonge l'effort, ralentis la descente des mouvements, ou monte d'un niveau.",
    "L'assiette compte au moins autant que l'entraînement dans la perte de poids : l'entraînement seul suffit rarement.",
    "Marche à côté : 7 000 à 10 000 pas par jour ajoutent une vraie dépense sans fatigue supplémentaire.",
    "Écoute ton corps. Une douleur articulaire n'est pas une courbature : en cas de doute (dos, genoux, longue pause, reprise), valide avec un médecin avant de te lancer, surtout sur les exercices avec sauts.",
  ],
  levels: [
    {
      level: 'beginner',
      label: 'Débutant',
      summary:
        "Pour une reprise ou un premier programme. On privilégie les mouvements contrôlés, sans saut.",
      sessionDurationLabel: 'environ 30 min',
      sessions: [
        {
          type: 'circuit',
          name: 'Full body doux',
          image: require('../../assets/images/workouts/beginner-full-body-doux.jpg'),
          workSeconds: 30,
          restSeconds: 30,
          rounds: 2,
          recoveryLabel: '2 min de récup entre les tours',
          recoverySeconds: 120,
          exercises: [
            { name: 'Squats sur chaise (assis-debout, lent)', exerciseId: 'squat-chaise' },
            { name: 'Pompes contre un mur', exerciseId: 'pompes-mur' },
            { name: "Fentes statiques (une jambe puis l'autre, sans à-coup)", exerciseId: 'fentes-statiques' },
            { name: 'Gainage sur les genoux', exerciseId: 'gainage-genoux' },
            { name: 'Marche rapide sur place, genoux montés', exerciseId: 'montees-genoux' },
          ],
        },
        {
          type: 'circuit',
          name: 'Cardio léger',
          image: require('../../assets/images/workouts/beginner-cardio-leger.jpg'),
          workSeconds: 30,
          restSeconds: 30,
          rounds: 3,
          recoveryLabel: '2 min de récup',
          recoverySeconds: 120,
          exercises: [
            { name: 'Jumping jacks doux (sans saut : un pied écarté à la fois)', exerciseId: 'jumping-jacks' },
            { name: 'Montées de genoux sur place', exerciseId: 'montees-genoux' },
            { name: 'Squats à vide, rythme tranquille', exerciseId: 'squat' },
            { name: 'Talons-fesses', exerciseId: 'talons-fesses' },
          ],
        },
        {
          type: 'series',
          name: 'Renforcement de base',
          image: require('../../assets/images/workouts/beginner-renforcement-de-base.jpg'),
          restLabel: '45 s à 1 min de repos entre chaque',
          restSeconds: 60,
          exercises: [
            { name: 'Squats', detail: '3 × 12', exerciseId: 'squat' },
            { name: 'Pont fessier', detail: '3 × 12', exerciseId: 'pont-fessier' },
            { name: 'Fentes statiques', detail: '2 × 10 par jambe', exerciseId: 'fentes-statiques' },
            { name: 'Gainage sur les genoux', detail: '3 × 20 s', exerciseId: 'gainage-genoux' },
          ],
        },
      ],
    },
    {
      level: 'intermediate',
      label: 'Intermédiaire',
      summary: "Pour quelqu'un déjà un peu actif. On introduit l'intensité et quelques sauts.",
      sessionDurationLabel: 'environ 40 min',
      sessions: [
        {
          type: 'circuit',
          name: 'Full body en circuit',
          image: require('../../assets/images/workouts/intermediaire-full-body-circuit.jpg'),
          workSeconds: 40,
          restSeconds: 20,
          rounds: 3,
          recoveryLabel: '1 min 30 de récup',
          recoverySeconds: 90,
          exercises: [
            { name: 'Squats complets', exerciseId: 'squat' },
            { name: 'Pompes (sur les genoux si besoin)', exerciseId: 'pompes' },
            { name: 'Fentes alternées', exerciseId: 'fentes-alternees' },
            { name: 'Gainage planche', exerciseId: 'gainage-planche' },
            { name: 'Mountain climbers', exerciseId: 'mountain-climbers' },
          ],
        },
        {
          type: 'circuit',
          name: 'Cardio HIIT',
          image: require('../../assets/images/workouts/intermediaire-cardio-hiit.jpg'),
          workSeconds: 30,
          restSeconds: 30,
          rounds: 4,
          recoveryLabel: '2 min de récup',
          recoverySeconds: 120,
          exercises: [
            { name: 'Jumping jacks', exerciseId: 'jumping-jacks' },
            { name: 'Burpees (version sans saut si trop dur)', exerciseId: 'burpees' },
            { name: 'Squats sautés ou squats rapides', exerciseId: 'squat-saute' },
            { name: 'Genoux hauts (course sur place)', exerciseId: 'montees-genoux' },
          ],
        },
        {
          type: 'series',
          name: 'Bas du corps + gainage',
          image: require('../../assets/images/workouts/intermediaire-bas-du-corps-gainage.jpg'),
          restLabel: '45 s à 1 min de repos',
          restSeconds: 60,
          exercises: [
            { name: 'Squats', detail: '4 × 15', exerciseId: 'squat' },
            { name: 'Fentes arrière', detail: '3 × 12 par jambe', exerciseId: 'fentes-arriere' },
            { name: 'Pont fessier', detail: '4 × 15', exerciseId: 'pont-fessier' },
            { name: 'Gainage planche', detail: '3 × 30 à 45 s', exerciseId: 'gainage-planche' },
            { name: 'Gainage latéral', detail: '3 × 20 s de chaque côté', exerciseId: 'gainage-lateral' },
          ],
        },
      ],
    },
    {
      level: 'advanced',
      label: 'Avancé',
      summary:
        "Pour un bon niveau de base, à l'aise avec les sauts et le gainage. Densité et intensité élevées.",
      sessionDurationLabel: '45 à 50 min',
      sessions: [
        {
          type: 'circuit',
          name: 'Full body intense',
          image: require('../../assets/images/workouts/avance-full-body-intense.jpg'),
          workSeconds: 45,
          restSeconds: 15,
          rounds: 4,
          recoveryLabel: '1 min 30 de récup',
          recoverySeconds: 90,
          exercises: [
            { name: 'Squats sautés', exerciseId: 'squat-saute' },
            { name: 'Pompes complètes (pieds surélevés pour durcir)', exerciseId: 'pompes-declinees' },
            { name: 'Fentes sautées alternées', exerciseId: 'fentes-sautees' },
            { name: "Gainage planche avec touches d'épaules", exerciseId: 'gainage-planche' },
            { name: 'Burpees', exerciseId: 'burpees' },
          ],
        },
        {
          type: 'circuit',
          name: 'HIIT explosif',
          image: require('../../assets/images/workouts/avance-hiit-explosif.jpg'),
          workSeconds: 40,
          restSeconds: 20,
          rounds: 5,
          recoveryLabel: '1 min 30 de récup',
          recoverySeconds: 90,
          exercises: [
            { name: 'Burpees avec saut', exerciseId: 'burpees' },
            { name: 'Squats sautés', exerciseId: 'squat-saute' },
            { name: 'Mountain climbers rapides', exerciseId: 'mountain-climbers' },
            { name: 'Fentes sautées', exerciseId: 'fentes-sautees' },
            { name: 'Sprint sur place, genoux hauts', exerciseId: 'montees-genoux' },
          ],
        },
        {
          type: 'series',
          name: 'Force + gainage',
          image: require('../../assets/images/workouts/avance-force-gainage.jpg'),
          restLabel: '30 à 45 s de repos seulement',
          restSeconds: 45,
          exercises: [
            { name: 'Squats bulgares (pied arrière surélevé)', detail: '4 × 12 par jambe', exerciseId: 'squat-bulgare' },
            { name: 'Pompes déclinées', detail: '4 × 12', exerciseId: 'pompes-declinees' },
            { name: 'Pont fessier une jambe', detail: '3 × 12 par jambe', exerciseId: 'pont-fessier-jambe' },
            { name: 'Gainage planche', detail: '3 × 60 s', exerciseId: 'gainage-planche' },
            { name: 'Gainage latéral dynamique', detail: '3 × 15 par côté', exerciseId: 'gainage-lateral' },
          ],
        },
      ],
    },
  ],
};

export function getLevelProgram(level: ExperienceLevel): LevelProgram {
  const found = homeWorkoutProgram.levels.find((entry) => entry.level === level);
  if (!found) {
    throw new Error(`No level program for ${level}`);
  }
  return found;
}
