# Plan marketing — FitFork

Date : 2026-08-07
Statut : proposition, à arbitrer

---

## 1. Résumé en une page

FitFork est une app mobile française qui fait une chose que très peu d'apps
font ensemble et bien : **elle décide à ta place quoi manger et quoi
t'entraîner, puis elle te tient par la main jusqu'à ce que ce soit fait.**
Plan de repas de la semaine calculé sur tes besoins réels, liste de courses
qui en découle automatiquement, et un programme sportif maison sans matériel
guidé exercice par exercice, chrono compris.

Le produit est en état d'être publié sur Google Play. Il n'a aujourd'hui
**aucune présence marketing** : pas de fiche store rédigée, pas de landing
page, pas de compte social, pas d'analytics, pas de politique de
confidentialité (bloquant pour Play). Le premier chantier n'est donc pas
« faire de la pub », c'est **rendre le produit trouvable et mesurable**.

Le plan ci-dessous se déroule en trois phases sur 6 mois :

| Phase | Fenêtre | Objectif |
| --- | --- | --- |
| 0 — Fondations | Août 2026 (≈ 4 semaines) | Marque tranchée, fiche Play, landing, RGPD, analytics |
| 1 — Lancement doux | Sept. 2026 | 100 premiers utilisateurs réels, mesurer l'activation, corriger |
| 2 — Croissance organique | Oct. 2026 – Janv. 2027 | Contenu vidéo + ASO + parrainage, viser la rentrée de janvier |

Le pari central : **la croissance sera organique et éditoriale, pas payante.**
L'app a déjà, sans le savoir, une banque de contenu marketing considérable —
86 photos de plats, 42 photos d'exercices, 9 photos de séances, 7 médailles —
produites dans une direction artistique cohérente. C'est du carburant TikTok /
Reels / Pinterest immédiatement exploitable, à coût marginal nul.

---

## 2. Le produit tel qu'il existe vraiment

Un plan marketing qui promet ce que l'app ne fait pas se retourne en avis 1
étoile. Voici l'inventaire honnête, au 7 août 2026.

### Ce qui est livré et fonctionne

**Nutrition**
- Onboarding qui collecte sexe, âge, taille, poids, niveau d'activité, objectif
  (sèche / prise de masse / maintien) et profil d'entraînement.
- Calcul des besoins : BMR Mifflin-St Jeor → TDEE → ajustement objectif
  (−17,5 % en sèche, +12,5 % en prise). Macros : protéines 2,0 g/kg, lipides
  28 % des calories, glucides en complément.
- Génération d'un plan de repas hebdomadaire sur une grille 7 jours × 4
  créneaux, **où l'utilisateur choisit quels créneaux planifier** (décocher
  « déjeuner » en semaine parce qu'on mange au travail). Les créneaux non
  cochés ne consomment ni recette, ni calories, ni ingrédients.
- Mise à l'échelle des portions (`portion_multiplier`, borné 0,5×–2×) pour
  tomber sur la cible calorique du créneau.
- Échange de repas créneau par créneau.
- **86 recettes** en base, chacune avec photo réaliste, macros, ingrédients en
  unités canoniques et étapes de préparation numérotées.
- Onglet Recettes avec filtres (type de repas, catégorie de protéine, temps de
  préparation).
- **Liste de courses générée automatiquement** par agrégation des ingrédients
  de la semaine — pas une liste à cocher à la main.

**Entraînement**
- Programme « perte de poids à la maison », 3 séances/semaine, **sans aucun
  matériel**, en 3 niveaux (débutant / intermédiaire / avancé), avec
  échauffement et retour au calme cadrés.
- 9 séances (circuits chronométrés et séries), chacune illustrée.
- 21 exercices avec fiche détaillée : deux photos (position de départ /
  position finale) et instructions numérotées en français.
- **Séance guidée** : déroulé pas à pas avec chronomètre effort / repos.

**Habitude et suivi**
- Journal de poids avec courbe de tendance.
- Gamification : 10 points par séance, 20 points pour la semaine à 3 séances,
  niveaux tous les 100 points, streak hebdomadaire, **7 badges** illustrés.
- Système d'ami par **code d'invitation partageable** (SMS, WhatsApp) et bonus
  d'équipe coopératif quand deux amis tiennent la semaine ensemble.
- Notifications push serveur : rappel de séance du jour, et alerte « streak en
  danger » après 2 jours sans séance — envoyées côté serveur, donc elles
  fonctionnent même si l'app n'a pas été rouverte.

**Identité**
- Direction artistique « Soft Neutral » assumée et documentée : papier
  chaud, serif douce pour les titres et les chiffres, sans géométrique pour
  l'action, un seul rouge utilisé avec parcimonie. Ton de voix précis :
  tutoiement, phrases courtes, zéro hype, zéro culpabilisation.
- Photos volontairement « faisables » : plats de cuisinier amateur (pas de
  dressage de restaurant), exercices exécutés par une personne normale dans un
  salon (pas de physique de mannequin, pas de salle de sport).

### Ce qui n'existe pas encore

| Manque | Conséquence marketing |
| --- | --- |
| Politique de confidentialité + formulaire Data Safety | **Bloque la publication Play.** Non négociable. |
| Aucun outil d'analytics | On ne saura pas où les gens décrochent. Impossible d'optimiser quoi que ce soit. |
| Pas de build iOS (`app.json` ne configure que Android) | Le marché iOS est hors périmètre au lancement. À assumer, pas à cacher. |
| Fiche Play (titre, descriptions, captures, vidéo) | Sans elle, zéro acquisition organique store. |
| Pas de landing page ni de nom de domaine | Rien à mettre en bio TikTok, rien à partager. |
| Pas de monétisation | Aucun revenu à ce stade — c'est un choix défendable au lancement (voir §9). |
| Recettes non modifiables / non ajoutables par l'utilisateur | Ne pas promettre « tes recettes » dans la comm. |
| Programme sportif unique (perte de poids maison) | Ne pas promettre « programme sur mesure » côté sport : le sur-mesure est côté nutrition. |
| Pas d'export, pas de partage de plan | Pas de boucle virale côté nutrition, seulement côté ami/sport. |

---

## 3. Décision préalable : le nom

**Il y a un conflit de marque non résolu dans le produit.** L'app s'affiche
« FitPro » (écrans de connexion et d'inscription, notifications push, splash),
le dépôt et le design system s'appellent « FitFork », et le slug Play est
`fitpro` / `com.maddog91steam.fitpro`.

Il faut trancher avant la fiche Play, parce que le nom est le premier levier
ASO et qu'il ne se change pas gratuitement ensuite.

**Recommandation : FitFork.**

- « FitPro » est générique et saturé : la recherche Play sur ce terme renvoie
  une masse d'apps de coaching et de gestion de salle. On serait invisible et
  exposé à des conflits de marque.
- « FitFork » est distinctif, mémorisable, et **dit le produit** : la
  fourchette (l'assiette) plus le fit (le sport). C'est exactement la
  proposition à deux jambes de l'app.
- Le logo existant — une assiette bordée d'une piste d'athlétisme, avec
  couverts — illustre déjà « FitFork », pas « FitPro ».
- Le `.fr` et les pseudos sociaux ont beaucoup plus de chances d'être libres.

**Ce que ça implique techniquement** (à vérifier avant décision finale) : le
package Android `com.maddog91steam.fitpro` est **immuable après la première
publication** sur Play. Tant que rien n'est publié, le renommer est gratuit ;
après, c'est une nouvelle fiche et zéro report des installs. C'est le seul
vrai argument de coût, et il disparaît si on décide maintenant.

**Action** : renommer partout (`app.json` name/slug/package, `login.tsx`,
`signup.tsx`, `send-reminders/index.ts`, splash) **avant** la première
soumission, et déposer le nom à l'INPI si le budget le permet (~250 €).

> Le reste de ce document utilise « FitFork ». Si l'arbitrage retient
> « FitPro », tout le plan reste valide sauf §5 (ASO) et §6, où le nom porte
> une partie du message.

---

## 4. Cible

### Le marché

Le créneau visé n'est pas « le fitness » en général, mais l'intersection :
**perte de poids + cuisine maison + entraînement à domicile sans matériel, en
français.** C'est là que l'app est réellement forte, et c'est un segment
mal servi : les gros acteurs sont soit purement nutrition (Yazio, MyFitnessPal,
Foodvisor), soit purement sport (Freeletics, Nike Training Club), et
l'utilisateur doit assembler les deux lui-même.

### Persona 1 — « Sarah, 34 ans » (cœur de cible, ≈ 70 % de l'effort)

Travaille, deux enfants, 8–12 kg à perdre depuis la deuxième grossesse. A
déjà essayé MyFitnessPal et abandonné au bout de trois semaines : **scanner
chaque aliment est un deuxième travail.** Ne mettra pas les pieds dans une
salle de sport (temps, budget, regard des autres). Cuisine le soir pour toute
la famille. Fait ses courses le samedi.

- **Sa douleur** : la charge mentale. Ce n'est pas « je ne sais pas qu'il faut
  manger équilibré », c'est « je n'ai pas l'énergie de décider ça en plus du
  reste ».
- **Ce que FitFork lui apporte** : on lui dit quoi manger, on lui donne la
  liste de courses, on lui donne 30 minutes dans son salon 3 fois par semaine.
- **Le déclic à provoquer** : « la liste de courses se fait toute seule ».
  C'est le bénéfice le plus concret et le plus facile à démontrer en 15
  secondes de vidéo.

### Persona 2 — « Karim, 27 ans » (secondaire, ≈ 20 %)

A repris le sport, s'entraîne chez lui, veut sécher proprement sans perdre de
muscle. Comprend les macros mais en a marre de les calculer.

- **Ce qui l'accroche** : la rigueur du calcul (Mifflin-St Jeor, 2 g/kg de
  protéines), la progression en 3 niveaux, les badges, le streak.
- **Attention** : il est aussi le plus susceptible de trouver le programme
  sportif limité (un seul programme, maison, sans matériel). Ne pas le
  sur-promettre.

### Persona 3 — « le binôme » (≈ 10 %, mais stratégique)

Ce n'est pas une personne, c'est un mécanisme : le système d'ami par code
d'invitation et le bonus d'équipe transforment chaque utilisateur motivé en
canal d'acquisition. Un utilisateur qui invite un ami crée **deux** rétentions,
pas une. C'est le seul levier viral déjà codé dans l'app — il doit être mis en
avant, pas caché dans un écran de réglages.

### Hors cible (à assumer)

- Les pratiquants en salle avec charges — le programme est sans matériel.
- Les régimes médicaux, allergies, intolérances — le filtrage n'existe pas.
- Le marché non francophone — toute l'app est en français.
- iOS, tant qu'il n'y a pas de build.

---

## 5. Positionnement

### La phrase

> **FitFork décide de tes repas et de tes séances. Toi, tu n'as plus qu'à les
> faire.**

### Le paysage concurrentiel

| Acteur | Ce qu'il fait bien | La faille qu'on exploite |
| --- | --- | --- |
| MyFitnessPal / Yazio | Base alimentaire immense, scan code-barres | **Tracking rétrospectif** : l'utilisateur saisit ce qu'il a mangé. Fastidieux, culpabilisant, abandonné en 3 semaines. FitFork est prospectif : il planifie à l'avance. |
| Foodvisor | Reconnaissance photo des plats | Même modèle de saisie, et pas de sport. |
| Freeletics / Nike Training Club | Programmes sportifs excellents | Aucune nutrition. L'utilisateur doit assembler deux apps. |
| Jow / Marmiton | Plans de repas + liste de courses | Aucun calcul de besoins caloriques personnels, aucun sport. |
| Coach humain | Le sur-mesure et la responsabilisation | 150–300 €/mois. |

**Le trou dans le marché** : personne ne fait *planification nutritionnelle
personnalisée + liste de courses + programme sportif guidé* dans une seule app
en français, gratuitement.

### Les trois piliers de message

1. **Zéro décision.** « Tu ouvres l'app le dimanche, tu as ta semaine et ta
   liste de courses. » — contre la charge mentale.
2. **Chez toi, sans rien acheter.** « 30 minutes dans ton salon, aucun
   matériel, trois niveaux. » — contre la barrière salle de sport.
3. **Faisable, pas parfait.** Les photos de plats sont des plats de vraie
   cuisine ; les photos d'exercices montrent une personne normale dans un
   salon. C'est un différenciateur réel contre l'esthétique fitness-influenceur
   qui fait fuir la cible 1. **À ne jamais trahir dans les visuels marketing.**

### Ce qu'on ne dira jamais

Le ton de voix du produit (tutoiement, pas d'exclamations, pas de
culpabilisation, pas de hype) **doit s'appliquer au marketing**. Une pub qui
crie « TRANSFORME TON CORPS EN 30 JOURS !! » avec un avant/après amènerait des
utilisateurs qui seront déçus par l'app calme qu'ils trouvent derrière. La
cohérence ton produit / ton marketing est ici une contrainte de conversion, pas
une coquetterie.

Interdits : les avant/après, les promesses chiffrées de perte de poids, le
vocabulaire médical, « brûle-graisse », « détox », les corps de mannequins.

---

## 6. Phase 0 — Fondations (août 2026, ≈ 4 semaines)

Rien ne se lance avant que ces cinq chantiers soient finis. Trois d'entre eux
sont des blocages réglementaires ou techniques, pas du confort.

### 0.1 — Conformité (BLOQUANT)

- **Politique de confidentialité** publiée à une URL stable. Doit couvrir : les
  données de santé collectées (poids, taille, âge, sexe, objectif — considérées
  comme données sensibles au sens du RGPD), l'hébergement Supabase et sa
  localisation, les tokens push Expo, la durée de conservation, et la procédure
  de suppression de compte.
- **Formulaire Data Safety de Google Play** — cohérent avec la politique, sinon
  rejet.
- **Suppression de compte** accessible depuis l'app : **exigence Play depuis
  2023** pour toute app avec création de compte. **Elle n'existe pas
  aujourd'hui** — aucune trace dans `src/` ni dans les fonctions Supabase.
  C'est un développement à faire avant soumission.
- **Avertissement médical** à l'onboarding. Les notes du coach le disent déjà
  (« en cas de doute, valide avec un médecin »), mais il faut un écran explicite
  au premier lancement : l'app ne délivre pas de conseil médical, et déconseille
  la grossesse, les troubles du comportement alimentaire, les pathologies
  cardiaques. C'est autant une protection juridique qu'un signal de sérieux.

### 0.2 — Mesure (BLOQUANT pour tout le reste)

Sans instrumentation, la phase 1 ne produit aucune information exploitable.
Minimum vital, avec un outil respectueux de la vie privée (PostHog ou Plausible
côté web, ou une simple table Supabase d'événements si on veut rester sur la
stack existante) :

| Événement | Ce qu'il révèle |
| --- | --- |
| `onboarding_started` / `onboarding_completed` | Le taux d'abandon du tunnel — la fuite la plus coûteuse |
| `plan_generated` | Le vrai moment « aha » côté nutrition |
| `grocery_list_viewed` | Le bénéfice #1 est-il découvert ? |
| `workout_session_started` / `_completed` | L'activation côté sport |
| `friend_invite_created` / `_redeemed` | Le coefficient viral réel |
| `notifications_enabled` | La capacité de réengagement |
| Rétention J1 / J7 / J30 | Le seul chiffre qui compte à terme |

**La question la plus importante à instrumenter** : combien d'utilisateurs
génèrent un plan **et** terminent une séance ? Si les deux moitiés du produit
ne sont pas adoptées ensemble, le positionnement « les deux dans une app » est
à revoir avant de dépenser un euro en acquisition.

### 0.3 — Fiche Google Play (ASO)

C'est le canal d'acquisition le moins cher qui existe. À travailler
sérieusement.

- **Titre (30 car.)** : `FitFork : repas & sport maison` — le nom de marque
  plus les deux mots-clés qui portent le trafic.
- **Description courte (80 car.)** : `Ton plan de repas, ta liste de courses et
  tes séances à la maison.` — les trois bénéfices concrets, dans l'ordre de
  leur pouvoir d'accroche.
- **Description longue** : structurée autour des mots-clés que la cible tape
  réellement — « perte de poids », « plan alimentaire », « liste de courses »,
  « sport à la maison », « sans matériel », « rééquilibrage alimentaire ». Pas
  de bourrage : Play pénalise, et surtout ça se lit mal.
- **Captures d'écran (8)**, dans cet ordre — la première fait 80 % du travail :
  1. La liste de courses générée (le bénéfice le plus différenciant)
  2. Le plan de la semaine
  3. Une fiche recette avec sa photo
  4. Le programme en 3 niveaux
  5. La séance guidée avec chrono
  6. Une fiche exercice (position départ / arrivée)
  7. La courbe de poids
  8. Les badges et le streak

  Chaque capture porte une légende courte au-dessus, dans la typo de la marque.
- **Vidéo de 30 s** : dimanche soir → génération du plan → liste de courses →
  courses → séance dans le salon → badge. Aucun texte crié, musique calme, le
  ton de l'app.
- **Icône** : déjà faite et bonne.

### 0.4 — Landing page

Une seule page, hébergée gratuitement (Cloudflare Pages ou Vercel), sur
`fitfork.fr` :

- Le pitch, trois captures, le bouton Play, la politique de confidentialité, un
  formulaire e-mail pour « prévenez-moi pour la version iOS » (qui mesure la
  demande iOS avant de la développer).
- Sert de destination pour les bios TikTok / Instagram et de cible pour le
  référencement de marque.
- **Bonus stratégique** : l'app tourne déjà sur le web (`react-native-web` est
  installé, `expo start --web` fonctionne). Une démo web cliquable de
  l'onboarding est un atout de conversion rare — à évaluer en phase 2.

### 0.5 — Marque

Trancher le nom (§3), renommer partout, réserver `fitfork.fr`, `@fitfork.fr`
sur TikTok / Instagram / Pinterest, éventuellement déposer à l'INPI.

---

## 7. Phase 1 — Lancement doux (septembre 2026)

**Objectif : 100 utilisateurs réels, et surtout la vérité sur l'activation.**
Pas 10 000 téléchargements. Cent personnes dont on comprend le comportement
valent mieux que dix mille qui désinstallent.

### Séquence

1. **Semaine 1 — Test fermé Play (20 testeurs).** Google Play impose de toute
   façon un test fermé de 12 jours avec 12 testeurs minimum avant la production
   pour les nouveaux comptes développeur personnels. Autant en faire un vrai
   test : entourage, collègues, deux ou trois personnes correspondant au
   persona 1 qu'on ne connaît pas personnellement (le retour le plus utile).
2. **Semaine 2 — Corrections.** Priorité absolue au tunnel d'onboarding : c'est
   là que se perdent les utilisateurs, et c'est le seul écran que 100 % d'entre
   eux voient.
3. **Semaine 3 — Production, sans annonce.** Laisser vivre quelques jours pour
   vérifier crashs, notifications push en conditions réelles, et le cron des
   rappels.
4. **Semaine 4 — Premier vrai signal.** Publication dans 3 à 5 communautés
   francophones ciblées, en se présentant honnêtement comme le créateur et en
   demandant un avis — pas en faisant de la pub :
   - r/france, r/Fitness_fr, r/perdredupoids
   - Groupes Facebook « perte de poids » et « rééquilibrage alimentaire »
     (lire les règles : beaucoup interdisent la promo — dans ce cas, participer
     d'abord, mentionner ensuite)
   - Forums de nutrition francophones
   - Product Hunt et IndieHackers si l'angle « projet solo » est assumé

### Ce qu'on mesure

- Taux de complétion de l'onboarding (cible saine : **> 60 %**)
- % d'utilisateurs générant un plan dans les 24 h (cible : **> 50 %**)
- % terminant une séance dans les 7 jours (cible : **> 30 %**)
- Rétention J7 (cible : **> 25 %**)
- Note moyenne Play (cible : **> 4,3** — en dessous, l'ASO ne décolle jamais)

> Ces cibles sont des repères d'apps grand public de cette catégorie, pas des
> mesures de FitFork. Elles servent à décider : atteintes → on passe en phase
> 2 ; ratées → on répare le produit avant de dépenser en acquisition.

### Le levier gratuit à activer dès maintenant

Demander l'avis Play **au bon moment** : après le déblocage d'un badge ou après
la première semaine complétée à 3 séances — jamais au 2ᵉ lancement. Les avis
sont le carburant de l'ASO, et une demande faite dans un moment de satisfaction
change complètement le taux de réponse et la note.

---

## 8. Phase 2 — Croissance organique (octobre 2026 – janvier 2027)

Le calendrier n'est pas neutre : **janvier est le pic annuel absolu de la
catégorie** (bonnes résolutions). Tout ce qui se construit d'octobre à décembre
sert à être prêt pour ce pic, pas à le rater.

### 8.1 — Contenu vidéo court (l'axe principal)

C'est là que se trouve la cible, et c'est là que l'app a un avantage
structurel : **le contenu est déjà produit.** 86 photos de plats, 42 photos
d'exercices, 9 photos de séances, 7 médailles, 3 illustrations de marque, tous
dans une direction artistique cohérente. Un compte TikTok / Reels / Pinterest
peut publier pendant des mois sans nouvelle production photo.

**Rythme réaliste : 3 à 4 vidéos par semaine.** En dessous, l'algorithme ne
suit pas ; au-dessus, ce n'est pas tenable en solo.

Quatre formats à faire tourner :

1. **« Ma semaine de repas »** (15–20 s) — défilé des 7 jours du plan généré,
   puis la liste de courses qui apparaît. C'est **le** format signature : il
   démontre le bénéfice #1 sans un mot d'explication.
2. **Recette en 20 secondes** — une photo de plat, ses macros, ses étapes. 86
   recettes = 86 vidéos possibles. Format Pinterest par excellence (durée de vie
   d'une épingle : des mois, contre des heures pour un post).
3. **« Fais cette séance avec moi »** — la séance guidée filmée en écran
   partagé avec quelqu'un qui l'exécute dans son salon. Répond directement à
   l'objection « je ne saurai pas faire ».
4. **Pédagogie honnête** — « pourquoi 2 g de protéines par kilo », « pourquoi
   perdre 500 g par semaine et pas 2 kg », « pourquoi le sport seul ne suffit
   pas à maigrir ». Ce dernier sujet est déjà écrit dans les notes du coach de
   l'app. C'est le format qui construit la confiance, et c'est celui qui
   correspond le mieux au ton de la marque.

**Le piège à éviter** : basculer dans l'esthétique fitness-influenceur pour
faire des vues. Ça marcherait à court terme et ferait fuir Sarah, qui est
précisément la personne que le produit sert le mieux.

### 8.2 — Boucle de parrainage (le levier le plus rentable)

Le système d'ami existe déjà, avec un code partageable et un bonus d'équipe.
Il est **sous-exploité en tant que canal**. Trois actions, par ordre de coût
croissant :

1. **Le proposer au bon moment** : après la première semaine réussie, quand
   l'utilisateur est dans un moment de fierté — pas à l'onboarding, où il ne
   sait pas encore ce qu'il recommande.
2. **Expliciter le bénéfice mutuel** dans le message de partage : le bonus
   d'équipe rapporte des points aux deux, ce n'est pas une faveur demandée.
3. **Mesurer le coefficient viral** (invitations créées → invitations
   utilisées → comptes créés). S'il dépasse 0,3, c'est le canal sur lequel
   concentrer l'effort produit — un ratio de ce niveau change complètement
   l'économie de l'acquisition.

### 8.3 — ASO en continu

- Suivre le classement sur 10 requêtes cibles (« perte de poids », « plan
  alimentaire », « sport maison », « liste de courses », « rééquilibrage
  alimentaire »…).
- Tester les captures et la description courte via les expériences Play Store
  (A/B natif et gratuit).
- Répondre à **tous** les avis, y compris les mauvais. Les réponses sont
  publiques et pèsent sur la conversion des visiteurs de la fiche.

### 8.4 — Partenariats micro-influence

Pas d'influenceurs fitness à 500 k abonnés (chers, audience mal ciblée,
esthétique incompatible). Viser des comptes de **1 k à 20 k abonnés** dans la
niche « perte de poids réaliste », « batch cooking », « maman qui reprend le
sport ». Proposer un accès et une vraie relation plutôt qu'un cachet.
5 à 10 partenariats bien choisis valent mieux qu'un gros.

### 8.5 — SEO éditorial (fond de portefeuille)

Un blog sur `fitfork.fr` alimenté par ce qui existe déjà en base :
« 86 recettes équilibrées avec leurs macros », « programme perte de poids
maison sans matériel », « calculer ses besoins caloriques ». Le contenu est
déjà écrit dans le produit — il s'agit de le publier au bon format. Le SEO met
6 à 12 mois à produire, d'où l'intérêt de commencer tôt.

### 8.6 — La campagne de janvier

Tout converge vers la première semaine de janvier 2027 :

- Séquence de contenu « ta résolution, mais en vrai » du 26 décembre au 10
  janvier.
- Fiche Play mise à jour avec des captures saisonnières.
- Premier test d'acquisition payante — **et seulement là**, une fois que la
  rétention est connue et que la conversion de la fiche est optimisée. Dépenser
  avant, c'est acheter des désinstallations.

---

## 9. Monétisation

**Recommandation : rester gratuit jusqu'à ce que la rétention J30 soit connue
et supérieure à 15 %.** Monétiser un produit qu'on ne retient pas revient à
optimiser une fuite.

Quand ce seuil est franchi, le modèle qui correspond le mieux à ce produit est
un **freemium où le gratuit reste vraiment utile** :

| Gratuit | Payant (≈ 4,99 €/mois ou 29,99 €/an) |
| --- | --- |
| Programme sportif complet, 3 niveaux | Programmes supplémentaires (renforcement, avec matériel, reprise post-blessure) |
| Génération du plan de repas | Plusieurs plans, historique, favoris |
| Liste de courses | Export / partage de la liste, courses en ligne |
| Suivi du poids, badges, amis | Statistiques avancées, mensurations, photos de progression |
| 86 recettes | Filtres alimentaires (végétarien, sans lactose, sans gluten) et recettes personnelles |

Deux points d'attention :

- Les **filtres alimentaires** sont probablement la fonctionnalité pour
  laquelle les gens paieraient le plus volontiers — et c'est aussi la plus
  demandée en avis store dans cette catégorie. À instrumenter comme une
  demande, pas à supposer.
- Le paywall ne doit jamais bloquer la **première génération de plan** : c'est
  le moment « aha », et le mettre derrière un mur tue l'acquisition organique.

---

## 10. Budget

Deux scénarios, en ordres de grandeur sur 6 mois. Le poste dominant reste le
temps, pas l'argent.

**Scénario minimal — ≈ 150 € sur 6 mois**

| Poste | Coût |
| --- | --- |
| Compte développeur Google Play | 25 € (une fois) |
| Nom de domaine `.fr` | ≈ 10 €/an |
| Hébergement landing (Cloudflare Pages) | 0 € |
| Analytics (PostHog free tier) | 0 € |
| Supabase (plan gratuit, suffisant sous ~50 k utilisateurs actifs) | 0 € |
| Production de contenu | 0 € (assets existants) |
| Marge / imprévus | ≈ 100 € |

**Scénario confortable — ≈ 1 500 à 2 500 € sur 6 mois**

Ajoute : dépôt de marque INPI (≈ 250 €), Supabase Pro (25 $/mois) si l'usage
le demande, 5 à 10 partenariats micro-influence (500–1 000 €), et un premier
test payant en janvier (500–1 000 € — uniquement si la rétention le justifie).

---

## 11. Tableau de bord

Une revue mensuelle sur cinq chiffres, pas quinze :

| Indicateur | Source | Cible à 6 mois |
| --- | --- | --- |
| Installations cumulées | Play Console | 2 000 |
| Utilisateurs actifs mensuels | Analytics | 500 |
| Rétention J30 | Analytics | > 15 % |
| Note Play | Play Console | > 4,3 (≥ 50 avis) |
| Coefficient viral (invitations → comptes) | Table `friend_invites` | > 0,2 |

> Les cibles sont des ambitions de travail pour un projet solo sans budget
> d'acquisition, calibrées pour être atteignables et discriminantes — pas des
> prévisions. Elles se réajustent après le premier mois de données réelles.

---

## 12. Risques

| Risque | Gravité | Réponse |
| --- | --- | --- |
| Politique de confidentialité / suppression de compte manquantes | **Bloquant** | Chantier 0.1, avant toute soumission |
| Données de santé et RGPD | Élevée | Politique explicite, minimisation, droit à l'effacement fonctionnel |
| Google Play rejette une app « santé » mal cadrée | Élevée | Avertissement médical explicite, aucune promesse thérapeutique ni chiffrée |
| Le nom « FitPro » entre en conflit avec une marque déposée | Moyenne | Renommer en FitFork avant publication (§3) |
| Nutrition et sport adoptés séparément, pas ensemble | Moyenne | Instrumenter dès la phase 1 ; si confirmé, revoir le positionnement |
| Un seul programme sportif → plafond de rétention à 8–12 semaines | Moyenne | Prévoir un 2ᵉ programme pour janvier ; ne pas sur-promettre entre-temps |
| Absence d'iOS | Moyenne | Assumée au lancement ; le formulaire d'attente sur la landing mesure la demande |
| Épuisement du créateur (contenu 3–4×/semaine en solo) | Élevée en pratique | Produire par lots de 10–15 vidéos, programmer, ne pas improviser au quotidien |
| Avis négatifs sur l'absence de filtres alimentaires | Moyenne | Répondre systématiquement, annoncer la feuille de route, prioriser si le volume le confirme |

---

## 13. Les cinq prochaines actions

Dans cet ordre, sans en sauter :

1. **Trancher le nom** (FitFork vs FitPro) — bloque la fiche Play, le domaine
   et les comptes sociaux.
2. **Écrire la politique de confidentialité et vérifier la suppression de
   compte** — bloque la publication.
3. **Instrumenter les 7 événements** du §0.2 — sans ça, la phase 1
   n'apprend rien.
4. **Rédiger la fiche Play et produire les 8 captures** — le canal
   d'acquisition le moins cher qui existe.
5. **Publier le test fermé à 20 testeurs** — le compte à rebours des 12 jours
   imposés par Play démarre à ce moment, autant le lancer tôt.

---

## Annexe — Ce que ce plan suppose, et qu'il faut vérifier

Ce document est construit sur la lecture du code et des spécifications du
dépôt au 7 août 2026. Trois points relèvent de sources externes que je n'ai
pas vérifiées et qui doivent l'être avant d'engager des moyens :

- Les règles actuelles de Google Play (durée et volume du test fermé, exigence
  de suppression de compte, formulaire Data Safety) évoluent régulièrement.
- La disponibilité de « FitFork » comme marque, domaine et pseudo social.
- Les repères chiffrés du §7 et du §11 sont des ordres de grandeur de
  catégorie servant à décider, pas des mesures ni des prévisions.
