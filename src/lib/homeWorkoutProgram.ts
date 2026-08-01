import type { ExperienceLevel } from './profile';

export type CircuitSession = {
  type: 'circuit';
  name: string;
  workSeconds: number;
  restSeconds: number;
  rounds: number;
  recoveryLabel: string;
  exercises: string[];
};

export type SeriesExercise = {
  name: string;
  detail: string;
};

export type SeriesSession = {
  type: 'series';
  name: string;
  restLabel: string;
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
          workSeconds: 30,
          restSeconds: 30,
          rounds: 2,
          recoveryLabel: '2 min de récup entre les tours',
          exercises: [
            'Squats sur chaise (assis-debout, lent)',
            'Pompes contre un mur',
            "Fentes statiques (une jambe puis l'autre, sans à-coup)",
            'Gainage sur les genoux',
            'Marche rapide sur place, genoux montés',
          ],
        },
        {
          type: 'circuit',
          name: 'Cardio léger',
          workSeconds: 30,
          restSeconds: 30,
          rounds: 3,
          recoveryLabel: '2 min de récup',
          exercises: [
            'Jumping jacks doux (sans saut : un pied écarté à la fois)',
            'Montées de genoux sur place',
            'Squats à vide, rythme tranquille',
            'Talons-fesses',
          ],
        },
        {
          type: 'series',
          name: 'Renforcement de base',
          restLabel: '45 s à 1 min de repos entre chaque',
          exercises: [
            { name: 'Squats', detail: '3 × 12' },
            { name: 'Pont fessier', detail: '3 × 12' },
            { name: 'Fentes statiques', detail: '2 × 10 par jambe' },
            { name: 'Gainage sur les genoux', detail: '3 × 20 s' },
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
          workSeconds: 40,
          restSeconds: 20,
          rounds: 3,
          recoveryLabel: '1 min 30 de récup',
          exercises: [
            'Squats complets',
            'Pompes (sur les genoux si besoin)',
            'Fentes alternées',
            'Gainage planche',
            'Mountain climbers',
          ],
        },
        {
          type: 'circuit',
          name: 'Cardio HIIT',
          workSeconds: 30,
          restSeconds: 30,
          rounds: 4,
          recoveryLabel: '2 min de récup',
          exercises: [
            'Jumping jacks',
            'Burpees (version sans saut si trop dur)',
            'Squats sautés ou squats rapides',
            'Genoux hauts (course sur place)',
          ],
        },
        {
          type: 'series',
          name: 'Bas du corps + gainage',
          restLabel: '45 s à 1 min de repos',
          exercises: [
            { name: 'Squats', detail: '4 × 15' },
            { name: 'Fentes arrière', detail: '3 × 12 par jambe' },
            { name: 'Pont fessier', detail: '4 × 15' },
            { name: 'Gainage planche', detail: '3 × 30 à 45 s' },
            { name: 'Gainage latéral', detail: '3 × 20 s de chaque côté' },
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
          workSeconds: 45,
          restSeconds: 15,
          rounds: 4,
          recoveryLabel: '1 min 30 de récup',
          exercises: [
            'Squats sautés',
            'Pompes complètes (pieds surélevés pour durcir)',
            'Fentes sautées alternées',
            "Gainage planche avec touches d'épaules",
            'Burpees',
          ],
        },
        {
          type: 'circuit',
          name: 'HIIT explosif',
          workSeconds: 40,
          restSeconds: 20,
          rounds: 5,
          recoveryLabel: '1 min 30 de récup',
          exercises: [
            'Burpees avec saut',
            'Squats sautés',
            'Mountain climbers rapides',
            'Fentes sautées',
            'Sprint sur place, genoux hauts',
          ],
        },
        {
          type: 'series',
          name: 'Force + gainage',
          restLabel: '30 à 45 s de repos seulement',
          exercises: [
            { name: 'Squats bulgares (pied arrière surélevé)', detail: '4 × 12 par jambe' },
            { name: 'Pompes déclinées', detail: '4 × 12' },
            { name: 'Pont fessier une jambe', detail: '3 × 12 par jambe' },
            { name: 'Gainage planche', detail: '3 × 60 s' },
            { name: 'Gainage latéral dynamique', detail: '3 × 15 par côté' },
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
