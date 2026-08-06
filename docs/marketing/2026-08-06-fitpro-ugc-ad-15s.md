# FitPro — pub UGC 15 s (vertical 9:16)

Première publicité de l'app, produite avec Higgsfield le 2026-08-06.
Format : une créatrice face caméra, 15 secondes, français, 9:16 (TikTok /
Reels / Shorts).

## Le parti pris

Angle **témoin sceptique** : elle a téléchargé l'app en pensant la supprimer
le soir même, et le plan de la semaine était déjà prêt. Pas de promesse
chiffrée, pas de superlatif — la preuve est concrète (le plan, la liste de
courses, la séance faite dans le salon), ce qui colle à la voix de l'app :
on tutoie, on ne survend pas.

Le décor reprend volontairement la « house style » des photos de séances de
l'app (`.claude/skills/fitfork-design/SKILL.md`) : salon normal, tapis sur
parquet clair, lumière naturelle froide, personne au physique atteignable —
« tu pourrais faire ça chez toi ».

## Le script (voix off, verbatim)

> J'ai téléchargé ça pour le supprimer le soir même. Sauf que le plan de la
> semaine était DÉJÀ prêt, la liste de courses aussi. Et la séance — je l'ai
> faite dans mon salon. FitPro.

34 mots, distribués sur 8 plans d'environ 1,9 s. Le plan 3 (macro sur la
planche à découper vide) est volontairement muet : c'est le temps de
respiration, et la synchro labiale est la zone la plus fragile du modèle.

## Les 8 plans

| # | Cadre | POV | Beat |
| --- | --- | --- | --- |
| 1 | Moyen | Selfie | Aveu déjà commencé, bouche prise en plein mot |
| 2 | Pied | Fixe | Elle jauge le tapis roulé contre le mur |
| 3 | Macro | Fixe | Planche à découper vide — rien à cuisiner (plan muet) |
| 4 | Serré | Selfie | L'app entre dans le cadre près de sa joue |
| 5 | Moyen | Fixe | Assise sur le canapé, elle lit le plan — le sourire casse |
| 6 | Macro | Fixe | L'index appuie sur le bouton rouge |
| 7 | Pied | Fixe | Squat sur le tapis déroulé, téléphone posé derrière |
| 8 | Serré | Selfie | Rouge d'effort, hochement de tête, fin en plein mouvement |

Règle appliquée partout : deux plans voisins ne partagent jamais à la fois le
POV et la distance — c'est ce qui fait que la coupure se lit comme une vraie
coupe et non comme un fondu.

## Chaîne de production Higgsfield

| Étape | Modèle | Sortie |
| --- | --- | --- |
| Logo source | — | `assets/images/logo-mark.png` (importé depuis le repo) |
| Écran produit | `nano_banana_pro` | Téléphone montrant l'accueil FitPro en français |
| Créatrice | `soul_2` | Référence d'identité réutilisée partout |
| Storyboard | `gpt_image_2` | Planche 16:9, 8 fentes verticales |
| Nettoyage | `seedream_v5_pro` | Passe anti-« AI slop » sur la planche |
| Clip | `seedance_2_0` | 15 s, 9:16, 1080p, audio natif |

Coût : ~75 crédits au total, dont 67 pour la vidéo.

L'écran de l'app est une reconstitution générée à partir des vraies chaînes
de `src/app/(tabs)/home.tsx` (« Objectifs du jour », « Repas du jour »,
« Générer le plan ») et du vrai logo — ce n'est pas une capture d'écran de
l'app qui tourne. À refaire avec de vraies captures le jour où l'app est
déployée quelque part d'accessible.

## Si on refait une variante

- Garder la même créatrice : réutiliser la référence d'identité plutôt que
  d'en regénérer une, sinon le visage bouge d'une pub à l'autre.
- Ne jamais faire tenir le téléphone produit dans un plan selfie sans
  préciser « un seul appareil à l'écran » — le modèle en ajoute un deuxième.
- Pas de chiffre dans la voix off tant qu'on n'a pas de claims validés.
