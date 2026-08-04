import type { ImageSourcePropType } from 'react-native';

export type Exercise = {
  id: string;
  name: string;
  instructions: string[];
  imageStart: ImageSourcePropType;
  imageEnd: ImageSourcePropType;
};

export const exercises: Record<string, Exercise> = {
  squat: {
    id: 'squat',
    name: 'Squat',
    instructions: [
      'Pieds écartés largeur de hanches, pointes légèrement vers l’extérieur.',
      'Pousse les fesses en arrière comme pour t’asseoir, dos droit, poitrine ouverte.',
      'Descends jusqu’à ce que les cuisses soient parallèles au sol (ou moins bas si besoin).',
      'Pousse dans tes talons pour remonter, sans verrouiller les genoux en haut.',
    ],
    imageStart: require('../../assets/images/exercises/squat-start.jpg'),
    imageEnd: require('../../assets/images/exercises/squat-end.jpg'),
  },
  'squat-chaise': {
    id: 'squat-chaise',
    name: 'Squat sur chaise',
    instructions: [
      'Place-toi debout devant une chaise, dos à l’assise, pieds largeur de hanches.',
      'Descends lentement comme pour t’asseoir, bras tendus devant pour l’équilibre.',
      'Touche à peine l’assise avec les fesses, sans t’asseoir complètement.',
      'Remonte en poussant dans tes talons, dos droit tout du long.',
    ],
    imageStart: require('../../assets/images/exercises/squat-chaise-start.jpg'),
    imageEnd: require('../../assets/images/exercises/squat-chaise-end.jpg'),
  },
  'squat-saute': {
    id: 'squat-saute',
    name: 'Squat sauté',
    instructions: [
      'Départ en position de squat, genoux fléchis, bras vers l’arrière.',
      'Pousse fort dans le sol pour sauter, bras qui montent pour l’élan.',
      'Atterris souplement, genoux fléchis, directement dans la position basse du squat suivant.',
      'Enchaîne sans bloquer les genoux à la réception.',
    ],
    imageStart: require('../../assets/images/exercises/squat-saute-start.jpg'),
    imageEnd: require('../../assets/images/exercises/squat-saute-end.jpg'),
  },
  'squat-bulgare': {
    id: 'squat-bulgare',
    name: 'Squat bulgare',
    instructions: [
      'Place le dessus du pied arrière sur une chaise derrière toi, jambe avant à distance confortable.',
      'Descends en pliant le genou avant jusqu’à ce que la cuisse soit presque parallèle au sol.',
      'Garde le buste droit, le genou avant aligné avec les orteils.',
      'Remonte en poussant sur la jambe avant, puis change de jambe après la série.',
    ],
    imageStart: require('../../assets/images/exercises/squat-bulgare-start.jpg'),
    imageEnd: require('../../assets/images/exercises/squat-bulgare-end.jpg'),
  },
  pompes: {
    id: 'pompes',
    name: 'Pompes',
    instructions: [
      'Mains au sol un peu plus larges que les épaules, corps aligné de la tête aux talons (ou aux genoux).',
      'Descends en pliant les coudes près du corps, jusqu’à frôler le sol avec la poitrine.',
      'Garde le gainage : pas de creux dans le bas du dos, pas de fesses en l’air.',
      'Pousse pour remonter en position haute, bras tendus sans bloquer les coudes.',
    ],
    imageStart: require('../../assets/images/exercises/pompes-start.jpg'),
    imageEnd: require('../../assets/images/exercises/pompes-end.jpg'),
  },
  'pompes-mur': {
    id: 'pompes-mur',
    name: 'Pompes contre un mur',
    instructions: [
      'Debout face à un mur, mains à plat écartées largeur d’épaules, à hauteur de poitrine.',
      'Recule les pieds jusqu’à avoir le corps légèrement incliné vers le mur.',
      'Plie les coudes pour rapprocher la poitrine du mur, corps gainé.',
      'Pousse pour revenir à la position de départ.',
    ],
    imageStart: require('../../assets/images/exercises/pompes-mur-start.jpg'),
    imageEnd: require('../../assets/images/exercises/pompes-mur-end.jpg'),
  },
  'pompes-declinees': {
    id: 'pompes-declinees',
    name: 'Pompes déclinées',
    instructions: [
      'Place les pieds surélevés sur une chaise ou une marche, mains au sol largeur d’épaules.',
      'Corps aligné de la tête aux talons, gainage engagé.',
      'Descends en pliant les coudes jusqu’à frôler le sol.',
      'Pousse pour remonter, sans cambrer le bas du dos.',
    ],
    imageStart: require('../../assets/images/exercises/pompes-declinees-start.jpg'),
    imageEnd: require('../../assets/images/exercises/pompes-declinees-end.jpg'),
  },
  'fentes-statiques': {
    id: 'fentes-statiques',
    name: 'Fentes statiques',
    instructions: [
      'Un pied devant, un pied derrière, à bonne distance l’un de l’autre.',
      'Descends en pliant les deux genoux à 90°, genou arrière proche du sol sans le toucher.',
      'Garde le buste droit, le genou avant aligné avec la cheville.',
      'Remonte en poussant sur la jambe avant, termine la série puis change de jambe.',
    ],
    imageStart: require('../../assets/images/exercises/fentes-statiques-start.jpg'),
    imageEnd: require('../../assets/images/exercises/fentes-statiques-end.jpg'),
  },
  'fentes-alternees': {
    id: 'fentes-alternees',
    name: 'Fentes alternées',
    instructions: [
      'Debout, pieds largeur de hanches.',
      'Fais un grand pas en avant et descends en fente, genou arrière proche du sol.',
      'Pousse pour revenir debout, pieds joints.',
      'Refais le mouvement en avançant l’autre jambe, en alternant à chaque répétition.',
    ],
    imageStart: require('../../assets/images/exercises/fentes-alternees-start.jpg'),
    imageEnd: require('../../assets/images/exercises/fentes-alternees-end.jpg'),
  },
  'fentes-arriere': {
    id: 'fentes-arriere',
    name: 'Fentes arrière',
    instructions: [
      'Debout, pieds largeur de hanches.',
      'Recule une jambe et descends en fente, genou arrière proche du sol.',
      'Pousse sur la jambe avant pour revenir debout, pieds joints.',
      'Alterne les jambes à chaque répétition.',
    ],
    imageStart: require('../../assets/images/exercises/fentes-arriere-start.jpg'),
    imageEnd: require('../../assets/images/exercises/fentes-arriere-end.jpg'),
  },
  'fentes-sautees': {
    id: 'fentes-sautees',
    name: 'Fentes sautées',
    instructions: [
      'Départ en fente, une jambe devant, une derrière.',
      'Pousse fort dans le sol pour sauter, et change les jambes en l’air.',
      'Atterris directement en fente avec l’autre jambe devant, genoux souples.',
      'Enchaîne sans marquer de pause entre les sauts.',
    ],
    imageStart: require('../../assets/images/exercises/fentes-sautees-start.jpg'),
    imageEnd: require('../../assets/images/exercises/fentes-sautees-end.jpg'),
  },
  'pont-fessier': {
    id: 'pont-fessier',
    name: 'Pont fessier',
    instructions: [
      'Allongé sur le dos, genoux pliés, pieds à plat au sol, écartés largeur de hanches.',
      'Pousse dans les talons pour lever les hanches vers le plafond.',
      'Serre les fessiers en haut du mouvement, corps aligné des genoux aux épaules.',
      'Redescends les hanches sans les reposer complètement au sol entre les répétitions.',
    ],
    imageStart: require('../../assets/images/exercises/pont-fessier-start.jpg'),
    imageEnd: require('../../assets/images/exercises/pont-fessier-end.jpg'),
  },
  'pont-fessier-jambe': {
    id: 'pont-fessier-jambe',
    name: 'Pont fessier une jambe',
    instructions: [
      'Allongé sur le dos, un genou plié, pied au sol, l’autre jambe tendue vers le plafond.',
      'Pousse dans le talon au sol pour lever les hanches.',
      'Garde le bassin bien droit, sans le laisser basculer d’un côté.',
      'Redescends avec contrôle, puis termine la série avant de changer de jambe.',
    ],
    imageStart: require('../../assets/images/exercises/pont-fessier-jambe-start.jpg'),
    imageEnd: require('../../assets/images/exercises/pont-fessier-jambe-end.jpg'),
  },
  'gainage-genoux': {
    id: 'gainage-genoux',
    name: 'Gainage sur les genoux',
    instructions: [
      'À genoux, avant-bras au sol, coudes sous les épaules.',
      'Corps aligné des genoux à la tête, ventre engagé.',
      'Regarde légèrement vers l’avant, nuque relâchée.',
      'Tiens la position sans creuser le bas du dos.',
    ],
    imageStart: require('../../assets/images/exercises/gainage-genoux-start.jpg'),
    imageEnd: require('../../assets/images/exercises/gainage-genoux-end.jpg'),
  },
  'gainage-planche': {
    id: 'gainage-planche',
    name: 'Gainage planche',
    instructions: [
      'Avant-bras au sol, coudes sous les épaules, jambes tendues, orteils au sol.',
      'Corps aligné de la tête aux talons, ventre engagé.',
      'Serre les fessiers pour éviter que le bassin ne tombe.',
      'Tiens la position en respirant normalement, sans bloquer.',
      'Variante plus difficile : ajoute des touches d’épaules alternées (une main touche l’épaule opposée) sans faire bouger le bassin.',
    ],
    imageStart: require('../../assets/images/exercises/gainage-planche-start.jpg'),
    imageEnd: require('../../assets/images/exercises/gainage-planche-end.jpg'),
  },
  'gainage-lateral': {
    id: 'gainage-lateral',
    name: 'Gainage latéral',
    instructions: [
      'Allongé sur le côté, appui sur l’avant-bras, coude sous l’épaule.',
      'Soulève les hanches du sol pour aligner le corps en ligne droite.',
      'Garde le bassin gainé, sans le laisser tomber vers le sol.',
      'Tiens la position, puis change de côté.',
      'Variante dynamique : monte et redescends légèrement les hanches au lieu de tenir fixe.',
    ],
    imageStart: require('../../assets/images/exercises/gainage-lateral-start.jpg'),
    imageEnd: require('../../assets/images/exercises/gainage-lateral-end.jpg'),
  },
  'montees-genoux': {
    id: 'montees-genoux',
    name: 'Montées de genoux',
    instructions: [
      'Debout, sur place, dos droit.',
      'Monte un genou vers la poitrine, puis repose le pied.',
      'Enchaîne avec l’autre jambe, à un rythme régulier ou plus rapide selon l’intensité voulue.',
      'Garde le buste stable, les bras qui accompagnent le mouvement.',
    ],
    imageStart: require('../../assets/images/exercises/montees-genoux-start.jpg'),
    imageEnd: require('../../assets/images/exercises/montees-genoux-end.jpg'),
  },
  'jumping-jacks': {
    id: 'jumping-jacks',
    name: 'Jumping jacks',
    instructions: [
      'Debout, pieds joints, bras le long du corps.',
      'Saute en écartant les jambes et en levant les bras au-dessus de la tête.',
      'Saute à nouveau pour revenir à la position de départ.',
      'Version sans saut : écarte un pied à la fois si les sauts sont trop difficiles.',
    ],
    imageStart: require('../../assets/images/exercises/jumping-jacks-start.jpg'),
    imageEnd: require('../../assets/images/exercises/jumping-jacks-end.jpg'),
  },
  'talons-fesses': {
    id: 'talons-fesses',
    name: 'Talons-fesses',
    instructions: [
      'Debout, sur place, dos droit.',
      'Amène rapidement un talon vers la fesse, puis repose le pied.',
      'Enchaîne avec l’autre jambe, à un rythme soutenu.',
      'Garde le buste droit, les genoux qui pointent vers le bas.',
    ],
    imageStart: require('../../assets/images/exercises/talons-fesses-start.jpg'),
    imageEnd: require('../../assets/images/exercises/talons-fesses-end.jpg'),
  },
  'mountain-climbers': {
    id: 'mountain-climbers',
    name: 'Mountain climbers',
    instructions: [
      'Position de planche, mains sous les épaules, corps aligné.',
      'Amène un genou vers la poitrine, sans casser le dos.',
      'Repose le pied et enchaîne avec l’autre jambe, comme une course sur place à l’horizontale.',
      'Garde le bassin bas et stable tout du long.',
    ],
    imageStart: require('../../assets/images/exercises/mountain-climbers-start.jpg'),
    imageEnd: require('../../assets/images/exercises/mountain-climbers-end.jpg'),
  },
  burpees: {
    id: 'burpees',
    name: 'Burpees',
    instructions: [
      'Debout, descends en squat et pose les mains au sol.',
      'Envoie les pieds en arrière pour arriver en position de planche.',
      'Ramène les pieds près des mains, puis remonte debout.',
      'Termine par un saut, bras levés (version sans saut : remonte simplement debout).',
    ],
    imageStart: require('../../assets/images/exercises/burpees-start.jpg'),
    imageEnd: require('../../assets/images/exercises/burpees-end.jpg'),
  },
};

export function getExercise(id: string): Exercise | undefined {
  return exercises[id];
}
