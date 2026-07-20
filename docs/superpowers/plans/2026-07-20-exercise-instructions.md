# Exercise Instructions Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Every exercise in a user's generated workout program can be tapped to reveal step-by-step execution instructions, loaded in the same request as the rest of the program (no extra network round-trip).

**Architecture:** A new `exercise_instructions` table (public-read, like `exercises`/`recipe_ingredients`) holds ordered steps per exercise. `fetchProgramDetails` is extended to join this table in its existing query, and `ProgramExercise` gains an `instructions: string[]` field. `workout.tsx` makes each exercise row tappable to expand/collapse its instructions using local screen state — no new network call on tap.

**Tech Stack:** Expo (React Native, TypeScript), Supabase (Postgres, RLS, PostgREST), Jest (`jest-expo` preset) with mocked Supabase client for data-layer tests.

## Global Constraints

- Migrations are SQL files applied manually via the Supabase SQL Editor (no CLI access). Apply in small numbered pieces with curl verification between each, per the established project pattern.
- `src/lib/<name>.ts` files contain pure logic with no Supabase import; `src/lib/<name>Data.ts` files hold I/O, tested via `jest.mock('../lib/supabase', () => ({ supabase: { from: jest.fn() } }))`.
- No dedicated UI test for `workout.tsx` — consistent with every other screen in this project, verified manually instead.
- This plan does not touch meal-plan/recipe code or `src/lib/workoutTemplate.ts`/`workoutProgram.ts`'s generation logic — only the exercise-instructions feature.

---

### Task 1: Schema migration — exercise_instructions table and content

**Files:**
- Create: `supabase/migrations/0007_exercise_instructions.sql`

**Interfaces:**
- Produces: Postgres table `exercise_instructions` (id, exercise_id, step_number, text — public-read, RLS with a single `using (true)` select policy, no insert/update/delete policies since content is seeded once via migration). Task 2's `workoutProgramData.ts` joins this table by `exercise_id` and reads `step_number`/`text` verbatim.

- [ ] **Step 1: Write the migration SQL**

Create `supabase/migrations/0007_exercise_instructions.sql`:

```sql
create table if not exists public.exercise_instructions (
  id uuid primary key default gen_random_uuid(),
  exercise_id uuid not null references public.exercises(id) on delete cascade,
  step_number integer not null check (step_number >= 1),
  text text not null
);

alter table public.exercise_instructions enable row level security;

create policy "Anyone can read exercise instructions"
  on public.exercise_instructions for select
  using (true);

insert into public.exercise_instructions (exercise_id, step_number, text)
select e.id, v.step_number, v.text
from (values
  ('Rowing inversé table', 1, 'Allonge-toi sous une table solide, saisis le bord avec les mains écartées largeur d''épaules, corps droit et talons au sol.'),
  ('Rowing inversé table', 2, 'Tire ta poitrine vers le bord de la table en gardant le corps gainé.'),
  ('Rowing inversé table', 3, 'Redescends lentement en tendant les bras sans relâcher le gainage.'),
  ('Superman', 1, 'Allonge-toi sur le ventre, bras tendus devant toi.'),
  ('Superman', 2, 'Soulève simultanément bras, poitrine et jambes du sol en contractant le bas du dos.'),
  ('Superman', 3, 'Maintiens la position 1-2 secondes puis redescends contrôlé.'),
  ('Superman alterné', 1, 'Allonge-toi sur le ventre, bras tendus devant toi.'),
  ('Superman alterné', 2, 'Soulève le bras droit et la jambe gauche en même temps, puis alterne.'),
  ('Superman alterné', 3, 'Garde le bassin au sol tout au long du mouvement.'),
  ('Tractions', 1, 'Suspends-toi à la barre, mains en pronation, largeur légèrement supérieure aux épaules.'),
  ('Tractions', 2, 'Tire le corps vers le haut jusqu''à ce que le menton dépasse la barre.'),
  ('Tractions', 3, 'Redescends en contrôlant la descente jusqu''à extension complète des bras.'),
  ('Dips sur chaises', 1, 'Place les mains sur le bord de deux chaises (ou une chaise et un support), jambes tendues devant toi.'),
  ('Dips sur chaises', 2, 'Descends en pliant les coudes jusqu''à un angle d''environ 90°.'),
  ('Dips sur chaises', 3, 'Repousse pour remonter sans hausser les épaules.'),
  ('Pompes', 1, 'Position de planche, mains légèrement plus larges que les épaules.'),
  ('Pompes', 2, 'Descends en pliant les coudes jusqu''à effleurer le sol, corps gainé et aligné.'),
  ('Pompes', 3, 'Repousse le sol pour remonter en position de départ.'),
  ('Pompes diamant', 1, 'Position de planche, mains rapprochées sous la poitrine formant un losange avec les pouces et index.'),
  ('Pompes diamant', 2, 'Descends en pliant les coudes près du corps.'),
  ('Pompes diamant', 3, 'Repousse pour remonter en contractant les triceps.'),
  ('Pompes surélevées pieds', 1, 'Place les pieds sur un support surélevé (chaise, banc), mains au sol largeur d''épaules.'),
  ('Pompes surélevées pieds', 2, 'Descends en pliant les coudes, corps gainé et aligné.'),
  ('Pompes surélevées pieds', 3, 'Repousse pour remonter en position de départ.'),
  ('Abdos crunch', 1, 'Allonge-toi sur le dos, genoux pliés, pieds au sol, mains derrière la tête sans tirer sur la nuque.'),
  ('Abdos crunch', 2, 'Contracte les abdominaux pour décoller les omoplates du sol.'),
  ('Abdos crunch', 3, 'Redescends contrôlé sans relâcher la tension abdominale.'),
  ('Burpees', 1, 'Départ debout, descends en position accroupie puis pose les mains au sol.'),
  ('Burpees', 2, 'Envoie les jambes en arrière pour une position de planche, puis reviens en position accroupie.'),
  ('Burpees', 3, 'Saute verticalement en tendant tout le corps pour terminer le mouvement.'),
  ('Mountain climbers', 1, 'Position de planche, mains sous les épaules.'),
  ('Mountain climbers', 2, 'Ramène un genou vers la poitrine puis alterne rapidement avec l''autre jambe.'),
  ('Mountain climbers', 3, 'Garde le bassin bas et stable tout au long du mouvement.'),
  ('Fentes avant', 1, 'Départ debout, fais un grand pas en avant.'),
  ('Fentes avant', 2, 'Descends jusqu''à ce que le genou arrière frôle le sol, genou avant aligné avec la cheville.'),
  ('Fentes avant', 3, 'Repousse sur la jambe avant pour revenir en position de départ.'),
  ('Fentes sautées', 1, 'Départ en fente, une jambe devant, une derrière.'),
  ('Fentes sautées', 2, 'Saute en inversant la position des jambes en l''air.'),
  ('Fentes sautées', 3, 'Amortis la réception en pliant les genoux avant d''enchaîner.'),
  ('Pont fessier', 1, 'Allonge-toi sur le dos, genoux pliés, pieds au sol proches des fessiers.'),
  ('Pont fessier', 2, 'Pousse dans les talons pour soulever le bassin en contractant les fessiers.'),
  ('Pont fessier', 3, 'Redescends contrôlé sans reposer complètement le bassin.'),
  ('Squat au poids du corps', 1, 'Départ debout, pieds largeur d''épaules.'),
  ('Squat au poids du corps', 2, 'Descends en pliant hanches et genoux, dos droit, comme pour t''asseoir sur une chaise.'),
  ('Squat au poids du corps', 3, 'Remonte en poussant dans les talons.'),
  ('Squat bulgare chaise', 1, 'Place le dessus du pied arrière sur une chaise, jambe avant à distance confortable.'),
  ('Squat bulgare chaise', 2, 'Descends en pliant le genou avant jusqu''à ce que la cuisse soit proche de l''horizontale.'),
  ('Squat bulgare chaise', 3, 'Remonte en poussant sur la jambe avant.'),
  ('Squat sauté', 1, 'Départ en position de squat, pieds largeur d''épaules.'),
  ('Squat sauté', 2, 'Descends puis explose vers le haut en sautant.'),
  ('Squat sauté', 3, 'Amortis la réception en repliant directement dans un squat.'),
  ('Pike push-up surélevé', 1, 'Place les pieds sur un support surélevé, mains au sol, bassin haut formant un V inversé.'),
  ('Pike push-up surélevé', 2, 'Plie les coudes pour amener le sommet du crâne vers le sol entre les mains.'),
  ('Pike push-up surélevé', 3, 'Repousse pour remonter en gardant le bassin haut.'),
  ('Pompes pike', 1, 'Position de planche, bassin relevé haut pour former un V inversé.'),
  ('Pompes pike', 2, 'Plie les coudes pour descendre la tête vers le sol.'),
  ('Pompes pike', 3, 'Repousse pour remonter en position de départ.'),
  ('Rowing barre', 1, 'Penche le buste vers l''avant, dos droit, barre tenue à largeur d''épaules.'),
  ('Rowing barre', 2, 'Tire la barre vers le bas du ventre en reculant les coudes.'),
  ('Rowing barre', 3, 'Redescends contrôlé sans arrondir le dos.'),
  ('Rowing T-bar', 1, 'Place-toi au-dessus de la barre en T, buste penché en avant, dos droit.'),
  ('Rowing T-bar', 2, 'Tire la charge vers la poitrine en reculant les coudes.'),
  ('Rowing T-bar', 3, 'Redescends contrôlé sans à-coups.'),
  ('Soulevé de terre', 1, 'Place-toi debout, barre au sol devant les tibias, pieds largeur de hanches.'),
  ('Soulevé de terre', 2, 'Saisis la barre, dos droit, et tire en poussant dans les jambes jusqu''à extension complète.'),
  ('Soulevé de terre', 3, 'Redescends la barre en gardant le dos droit et la barre proche du corps.'),
  ('Tirage horizontal poulie basse', 1, 'Assis face à la poulie, pieds calés, saisis la poignée bras tendus.'),
  ('Tirage horizontal poulie basse', 2, 'Tire la poignée vers le ventre en reculant les coudes, buste droit.'),
  ('Tirage horizontal poulie basse', 3, 'Reviens contrôlé en tendant les bras sans arrondir le dos.'),
  ('Tirage vertical', 1, 'Assis face à la machine, saisis la barre plus large que les épaules.'),
  ('Tirage vertical', 2, 'Tire la barre vers le haut de la poitrine en reculant les coudes.'),
  ('Tirage vertical', 3, 'Reviens contrôlé jusqu''à extension complète des bras.'),
  ('Tractions lestées', 1, 'Attache une charge à une ceinture de lest, suspends-toi à la barre en pronation.'),
  ('Tractions lestées', 2, 'Tire le corps vers le haut jusqu''à ce que le menton dépasse la barre.'),
  ('Tractions lestées', 3, 'Redescends contrôlé jusqu''à extension complète des bras.'),
  ('Curl biceps barre', 1, 'Départ debout, barre tenue en supination, bras tendus le long du corps.'),
  ('Curl biceps barre', 2, 'Plie les coudes pour remonter la barre vers les épaules sans bouger les coudes.'),
  ('Curl biceps barre', 3, 'Redescends contrôlé jusqu''à extension complète.'),
  ('Curl marteau haltères', 1, 'Départ debout, haltères tenus en prise neutre (paumes face à face).'),
  ('Curl marteau haltères', 2, 'Plie les coudes pour remonter les haltères sans tourner les poignets.'),
  ('Curl marteau haltères', 3, 'Redescends contrôlé jusqu''à extension complète.'),
  ('Développé couché', 1, 'Allonge-toi sur le banc, barre au-dessus de la poitrine, pieds au sol.'),
  ('Développé couché', 2, 'Descends la barre vers la poitrine en contrôlant la descente.'),
  ('Développé couché', 3, 'Repousse la barre jusqu''à extension complète des bras.'),
  ('Développé couché prise serrée', 1, 'Allonge-toi sur le banc, mains rapprochées sur la barre (largeur d''épaules ou moins).'),
  ('Développé couché prise serrée', 2, 'Descends la barre vers le bas de la poitrine, coudes proches du corps.'),
  ('Développé couché prise serrée', 3, 'Repousse en contractant les triceps jusqu''à extension complète.'),
  ('Développé incliné', 1, 'Allonge-toi sur un banc incliné, barre au-dessus de la poitrine haute.'),
  ('Développé incliné', 2, 'Descends la barre vers le haut de la poitrine.'),
  ('Développé incliné', 3, 'Repousse jusqu''à extension complète des bras.'),
  ('Dips lestés', 1, 'Attache une charge à une ceinture de lest, positionne-toi bras tendus sur les barres parallèles.'),
  ('Dips lestés', 2, 'Descends en pliant les coudes, buste légèrement penché en avant.'),
  ('Dips lestés', 3, 'Repousse pour remonter jusqu''à extension complète des bras.'),
  ('Écarté couché haltères', 1, 'Allonge-toi sur le banc, haltères tenus au-dessus de la poitrine, bras légèrement fléchis.'),
  ('Écarté couché haltères', 2, 'Ouvre les bras sur les côtés en gardant la même flexion de coude jusqu''à sentir l''étirement pectoral.'),
  ('Écarté couché haltères', 3, 'Ramène les haltères au-dessus de la poitrine en contractant les pectoraux.'),
  ('Pull-over haltère', 1, 'Allonge-toi sur le banc, haltère tenu à deux mains au-dessus de la poitrine.'),
  ('Pull-over haltère', 2, 'Descends l''haltère en arrière au-delà de la tête en gardant les bras légèrement fléchis.'),
  ('Pull-over haltère', 3, 'Ramène l''haltère au-dessus de la poitrine en contractant les dorsaux et pectoraux.'),
  ('Extension des jambes', 1, 'Assis sur la machine, tibias calés sous le rouleau, dos calé au dossier.'),
  ('Extension des jambes', 2, 'Tends les jambes pour soulever le rouleau jusqu''à extension complète.'),
  ('Extension des jambes', 3, 'Redescends contrôlé sans relâcher brutalement.'),
  ('Extension mollets debout', 1, 'Debout sur la machine ou une marche, avant-pieds calés, talons dans le vide.'),
  ('Extension mollets debout', 2, 'Monte sur la pointe des pieds en contractant les mollets.'),
  ('Extension mollets debout', 3, 'Redescends en laissant les talons descendre sous le niveau des orteils pour étirer le mollet.'),
  ('Fentes marchées barre', 1, 'Place la barre sur le haut du dos, départ debout.'),
  ('Fentes marchées barre', 2, 'Avance en fente, genou arrière proche du sol, puis pousse pour ramener les pieds ensemble.'),
  ('Fentes marchées barre', 3, 'Enchaîne avec la jambe opposée en avançant progressivement.'),
  ('Hip thrust barre', 1, 'Assis au sol, haut du dos calé contre un banc, barre posée sur les hanches.'),
  ('Hip thrust barre', 2, 'Pousse dans les talons pour lever le bassin jusqu''à extension complète des hanches.'),
  ('Hip thrust barre', 3, 'Redescends contrôlé sans reposer complètement le bassin au sol.'),
  ('Leg curl', 1, 'Allonge-toi sur la machine, chevilles calées sous le rouleau.'),
  ('Leg curl', 2, 'Plie les genoux pour ramener le rouleau vers les fessiers.'),
  ('Leg curl', 3, 'Redescends contrôlé jusqu''à extension complète.'),
  ('Presse à cuisses', 1, 'Assis sur la machine, pieds à largeur d''épaules sur la plateforme.'),
  ('Presse à cuisses', 2, 'Plie les genoux pour descendre la plateforme vers la poitrine.'),
  ('Presse à cuisses', 3, 'Repousse en tendant les jambes sans verrouiller complètement les genoux.'),
  ('Presse à cuisses unilatérale', 1, 'Assis sur la machine, un seul pied posé au centre de la plateforme.'),
  ('Presse à cuisses unilatérale', 2, 'Plie le genou pour descendre la plateforme de façon contrôlée.'),
  ('Presse à cuisses unilatérale', 3, 'Repousse en tendant la jambe sans verrouiller le genou.'),
  ('Soulevé de terre roumain', 1, 'Départ debout, barre tenue devant les cuisses, genoux légèrement fléchis.'),
  ('Soulevé de terre roumain', 2, 'Pousse les hanches en arrière en descendant la barre le long des jambes, dos droit.'),
  ('Soulevé de terre roumain', 3, 'Reviens en position debout en poussant les hanches vers l''avant.'),
  ('Squat barre', 1, 'Place la barre sur le haut du dos, pieds largeur d''épaules.'),
  ('Squat barre', 2, 'Descends en pliant hanches et genoux, dos droit, jusqu''à ce que les cuisses soient parallèles au sol.'),
  ('Squat barre', 3, 'Remonte en poussant dans les talons.'),
  ('Squat sumo barre', 1, 'Pieds largement écartés, pointes tournées vers l''extérieur, barre sur le haut du dos.'),
  ('Squat sumo barre', 2, 'Descends en poussant les genoux dans l''axe des pieds.'),
  ('Squat sumo barre', 3, 'Remonte en poussant dans les talons et en contractant les fessiers.'),
  ('Développé militaire', 1, 'Départ debout, barre tenue au niveau des épaules.'),
  ('Développé militaire', 2, 'Pousse la barre au-dessus de la tête jusqu''à extension complète des bras.'),
  ('Développé militaire', 3, 'Redescends contrôlé jusqu''aux épaules.'),
  ('Élévations latérales haltères', 1, 'Départ debout, haltères le long du corps, légère flexion des coudes.'),
  ('Élévations latérales haltères', 2, 'Lève les bras sur les côtés jusqu''à hauteur des épaules.'),
  ('Élévations latérales haltères', 3, 'Redescends contrôlé sans balancer le corps.'),
  ('Oiseau haltères', 1, 'Penche le buste vers l''avant, haltères tenus bras tendus sous les épaules.'),
  ('Oiseau haltères', 2, 'Lève les bras sur les côtés en reculant les coudes, buste fixe.'),
  ('Oiseau haltères', 3, 'Redescends contrôlé jusqu''à la position de départ.'),
  ('Barre au front', 1, 'Allonge-toi sur le banc, barre tenue bras tendus au-dessus de la poitrine.'),
  ('Barre au front', 2, 'Plie les coudes pour descendre la barre vers le front, coudes fixes.'),
  ('Barre au front', 3, 'Tends les bras pour remonter sans bouger les coudes.'),
  ('Extension triceps poulie', 1, 'Face à la poulie haute, saisis la barre, coudes collés au corps.'),
  ('Extension triceps poulie', 2, 'Tends les bras vers le bas en gardant les coudes fixes.'),
  ('Extension triceps poulie', 3, 'Reviens contrôlé jusqu''à flexion complète des coudes.'),
  ('Rowing haltère', 1, 'Un genou et une main posés sur un banc, dos droit, haltère tenu dans l''autre main.'),
  ('Rowing haltère', 2, 'Tire l''haltère vers la hanche en reculant le coude.'),
  ('Rowing haltère', 3, 'Redescends contrôlé jusqu''à extension complète du bras.'),
  ('Rowing unilatéral haltère', 1, 'Penche le buste en avant, un appui possible sur une chaise, haltère dans une main.'),
  ('Rowing unilatéral haltère', 2, 'Tire l''haltère vers la hanche en reculant le coude, dos droit.'),
  ('Rowing unilatéral haltère', 3, 'Redescends contrôlé jusqu''à extension complète.'),
  ('Tirage bûcheron haltère', 1, 'Départ debout, penché en avant, haltère tenu à deux mains devant les tibias.'),
  ('Tirage bûcheron haltère', 2, 'Tire l''haltère en diagonale vers l''épaule opposée en pivotant légèrement le buste.'),
  ('Tirage bûcheron haltère', 3, 'Reviens contrôlé à la position de départ.'),
  ('Curl biceps haltères', 1, 'Départ debout, haltères tenus en supination le long du corps.'),
  ('Curl biceps haltères', 2, 'Plie les coudes pour remonter les haltères vers les épaules.'),
  ('Curl biceps haltères', 3, 'Redescends contrôlé jusqu''à extension complète.'),
  ('Curl marteau alterné haltères', 1, 'Départ debout, haltères tenus en prise neutre le long du corps.'),
  ('Curl marteau alterné haltères', 2, 'Plie un coude pour remonter l''haltère sans tourner le poignet, puis alterne.'),
  ('Curl marteau alterné haltères', 3, 'Redescends contrôlé avant de répéter avec l''autre bras.'),
  ('Développé couché haltères', 1, 'Allonge-toi sur le banc ou au sol, haltères tenus au-dessus de la poitrine.'),
  ('Développé couché haltères', 2, 'Descends les haltères vers la poitrine en contrôlant la descente.'),
  ('Développé couché haltères', 3, 'Repousse jusqu''à extension complète des bras.'),
  ('Développé couché incliné haltères', 1, 'Allonge-toi sur un banc incliné, haltères tenus au-dessus de la poitrine haute.'),
  ('Développé couché incliné haltères', 2, 'Descends les haltères vers le haut de la poitrine.'),
  ('Développé couché incliné haltères', 3, 'Repousse jusqu''à extension complète des bras.'),
  ('Écarté incliné haltères', 1, 'Allonge-toi sur un banc incliné, haltères tenus au-dessus de la poitrine, bras légèrement fléchis.'),
  ('Écarté incliné haltères', 2, 'Ouvre les bras sur les côtés jusqu''à sentir l''étirement pectoral.'),
  ('Écarté incliné haltères', 3, 'Ramène les haltères au-dessus de la poitrine en contractant les pectoraux.'),
  ('Fentes bulgares haltères', 1, 'Place le dessus du pied arrière sur une chaise ou un support, haltères tenus le long du corps.'),
  ('Fentes bulgares haltères', 2, 'Descends en pliant le genou avant jusqu''à ce que la cuisse soit proche de l''horizontale.'),
  ('Fentes bulgares haltères', 3, 'Remonte en poussant sur la jambe avant.'),
  ('Fentes haltères', 1, 'Départ debout, haltères tenus le long du corps, fais un grand pas en avant.'),
  ('Fentes haltères', 2, 'Descends jusqu''à ce que le genou arrière frôle le sol.'),
  ('Fentes haltères', 3, 'Repousse sur la jambe avant pour revenir en position de départ.'),
  ('Hip thrust haltère', 1, 'Assis au sol, haut du dos calé contre un banc, haltère posé sur les hanches.'),
  ('Hip thrust haltère', 2, 'Pousse dans les talons pour lever le bassin jusqu''à extension complète des hanches.'),
  ('Hip thrust haltère', 3, 'Redescends contrôlé sans reposer complètement le bassin.'),
  ('Pont fessier unilatéral haltère', 1, 'Allonge-toi sur le dos, un pied au sol genou plié, l''autre jambe tendue en l''air, haltère sur les hanches.'),
  ('Pont fessier unilatéral haltère', 2, 'Pousse dans le talon au sol pour lever le bassin.'),
  ('Pont fessier unilatéral haltère', 3, 'Redescends contrôlé puis répète avant de changer de jambe.'),
  ('Soulevé de terre jambes tendues haltères', 1, 'Départ debout, haltères tenus devant les cuisses, jambes presque tendues.'),
  ('Soulevé de terre jambes tendues haltères', 2, 'Pousse les hanches en arrière en descendant les haltères le long des jambes, dos droit.'),
  ('Soulevé de terre jambes tendues haltères', 3, 'Reviens en position debout en poussant les hanches vers l''avant.'),
  ('Soulevé de terre roumain haltères', 1, 'Départ debout, haltères tenus devant les cuisses, genoux légèrement fléchis.'),
  ('Soulevé de terre roumain haltères', 2, 'Pousse les hanches en arrière en descendant les haltères le long des jambes, dos droit.'),
  ('Soulevé de terre roumain haltères', 3, 'Reviens en position debout en poussant les hanches vers l''avant.'),
  ('Squat gobelet', 1, 'Tiens un haltère à deux mains contre la poitrine, pieds largeur d''épaules.'),
  ('Squat gobelet', 2, 'Descends en pliant hanches et genoux, dos droit, coudes passant à l''intérieur des genoux.'),
  ('Squat gobelet', 3, 'Remonte en poussant dans les talons.'),
  ('Squat haltères', 1, 'Tiens un haltère dans chaque main le long du corps, pieds largeur d''épaules.'),
  ('Squat haltères', 2, 'Descends en pliant hanches et genoux, dos droit.'),
  ('Squat haltères', 3, 'Remonte en poussant dans les talons.'),
  ('Squat sumo haltères', 1, 'Pieds largement écartés, pointes tournées vers l''extérieur, haltère tenu à deux mains entre les jambes.'),
  ('Squat sumo haltères', 2, 'Descends en poussant les genoux dans l''axe des pieds.'),
  ('Squat sumo haltères', 3, 'Remonte en poussant dans les talons et en contractant les fessiers.'),
  ('Step-up haltères', 1, 'Tiens un haltère dans chaque main, place un pied sur un banc ou une marche.'),
  ('Step-up haltères', 2, 'Pousse dans le pied surélevé pour monter entièrement sur le support.'),
  ('Step-up haltères', 3, 'Redescends contrôlé puis répète avant de changer de jambe.'),
  ('Développé Arnold haltères', 1, 'Assis ou debout, haltères tenus devant les épaules, paumes tournées vers toi.'),
  ('Développé Arnold haltères', 2, 'Pousse les haltères vers le haut en tournant les poignets pour finir paumes vers l''avant.'),
  ('Développé Arnold haltères', 3, 'Redescends contrôlé en inversant la rotation jusqu''à la position de départ.'),
  ('Développé épaules haltères', 1, 'Assis ou debout, haltères tenus au niveau des épaules.'),
  ('Développé épaules haltères', 2, 'Pousse les haltères au-dessus de la tête jusqu''à extension complète des bras.'),
  ('Développé épaules haltères', 3, 'Redescends contrôlé jusqu''aux épaules.'),
  ('Élévations latérales haltères assis', 1, 'Assis sur un banc, haltères tenus le long du corps, légère flexion des coudes.'),
  ('Élévations latérales haltères assis', 2, 'Lève les bras sur les côtés jusqu''à hauteur des épaules.'),
  ('Élévations latérales haltères assis', 3, 'Redescends contrôlé sans balancer le buste.'),
  ('Extension triceps haltère', 1, 'Assis ou debout, haltère tenu à deux mains au-dessus de la tête, bras tendus.'),
  ('Extension triceps haltère', 2, 'Plie les coudes pour descendre l''haltère derrière la tête.'),
  ('Extension triceps haltère', 3, 'Tends les bras pour remonter sans bouger les coudes.'),
  ('Extension triceps nuque haltère', 1, 'Assis, un haltère tenu à deux mains derrière la nuque, coudes pointés vers le haut.'),
  ('Extension triceps nuque haltère', 2, 'Tends les bras pour lever l''haltère au-dessus de la tête.'),
  ('Extension triceps nuque haltère', 3, 'Redescends contrôlé jusqu''à la position de départ derrière la nuque.')
) as v(name, step_number, text)
join public.exercises e on e.name = v.name;
```

- [ ] **Step 2: Apply the migration (manual — needs Supabase dashboard access)**

Apply in the Supabase SQL Editor in 2 numbered pieces (this migration only enables RLS once, so a single confirmation dialog is expected on piece 1):
1. The `create table` + `enable row level security` + `create policy` statements.
2. The `insert into ... select ... from (values ...) ... join` statement (213 step rows across 71 exercises).

Confirm no error banner appears after each piece before pasting the next.

- [ ] **Step 3: Verify via the REST API**

```bash
curl -s -o /dev/null -w "%{http_code}\n" "$EXPO_PUBLIC_SUPABASE_URL/rest/v1/exercise_instructions?select=id&limit=1" \
  -H "apikey: $EXPO_PUBLIC_SUPABASE_ANON_KEY" -H "Authorization: Bearer $EXPO_PUBLIC_SUPABASE_ANON_KEY"
# Expected: 200

curl -s "$EXPO_PUBLIC_SUPABASE_URL/rest/v1/exercise_instructions?select=id" \
  -H "apikey: $EXPO_PUBLIC_SUPABASE_ANON_KEY" -H "Authorization: Bearer $EXPO_PUBLIC_SUPABASE_ANON_KEY" | grep -o '"id"' | wc -l
# Expected: 213

curl -s "$EXPO_PUBLIC_SUPABASE_URL/rest/v1/exercises?select=id&not.id=in.(select+exercise_id+from+exercise_instructions)&limit=5" \
  -H "apikey: $EXPO_PUBLIC_SUPABASE_ANON_KEY" -H "Authorization: Bearer $EXPO_PUBLIC_SUPABASE_ANON_KEY" || true
# (Optional sanity check attempt — PostgREST may reject the subquery filter syntax; if so, skip it,
#  the 213-row count above already confirms all 71 exercises x 3 steps were inserted via the join.)
```

- [ ] **Step 4: Commit**

```bash
git add supabase/migrations/0007_exercise_instructions.sql
git commit -m "Add exercise_instructions schema and content"
```

---

### Task 2: Data layer — join instructions into fetchProgramDetails

**Files:**
- Modify: `src/lib/workoutProgramData.ts`
- Test: `src/__tests__/workoutProgramData.test.ts`

**Interfaces:**
- Consumes: `exercise_instructions` table from Task 1 (columns `exercise_id`, `step_number`, `text`).
- Produces: `ProgramExercise` type gains `instructions: string[]` (ordered by `step_number`). `fetchProgramDetails`'s query and mapping are updated accordingly; its signature `(userId, templateId)` is unchanged. Task 3's `workout.tsx` reads `exercise.instructions` for each rendered exercise.

- [ ] **Step 1: Write the failing test**

In `src/__tests__/workoutProgramData.test.ts`, replace the existing `describe('fetchProgramDetails', ...)` block (the last block in the file) with:

```ts
describe('fetchProgramDetails', () => {
  it('assembles the template name and generated days, with instructions sorted by step_number', async () => {
    const templateSingle = jest.fn().mockResolvedValue({ data: { name: 'Full Body' }, error: null });
    const templateEq = jest.fn().mockReturnValue({ single: templateSingle });
    const templateSelect = jest.fn().mockReturnValue({ eq: templateEq });

    const rowsOrder2 = jest.fn().mockResolvedValue({
      data: [
        {
          day_number: 1,
          day_name: 'Full Body',
          exercises: {
            name: 'Squat',
            muscle_group: 'legs',
            default_sets: 4,
            default_reps_min: 8,
            default_reps_max: 10,
            exercise_instructions: [
              { step_number: 2, text: 'Descends en pliant les genoux.' },
              { step_number: 1, text: 'Pieds largeur d\'épaules.' },
            ],
          },
        },
        {
          day_number: 1,
          day_name: 'Full Body',
          exercises: {
            name: 'Rowing',
            muscle_group: 'back',
            default_sets: 3,
            default_reps_min: 10,
            default_reps_max: 12,
            exercise_instructions: [{ step_number: 1, text: 'Tire vers le ventre.' }],
          },
        },
      ],
      error: null,
    });
    const rowsOrder1 = jest.fn().mockReturnValue({ order: rowsOrder2 });
    const rowsEq = jest.fn().mockReturnValue({ order: rowsOrder1 });
    const rowsSelect = jest.fn().mockReturnValue({ eq: rowsEq });

    (supabase.from as jest.Mock)
      .mockReturnValueOnce({ select: templateSelect })
      .mockReturnValueOnce({ select: rowsSelect });

    const result = await fetchProgramDetails('user-1', 'template-1');

    expect(result).toEqual({
      templateId: 'template-1',
      templateName: 'Full Body',
      days: [
        {
          dayNumber: 1,
          name: 'Full Body',
          exercises: [
            {
              name: 'Squat',
              muscleGroup: 'legs',
              sets: 4,
              repsMin: 8,
              repsMax: 10,
              instructions: ['Pieds largeur d\'épaules.', 'Descends en pliant les genoux.'],
            },
            {
              name: 'Rowing',
              muscleGroup: 'back',
              sets: 3,
              repsMin: 10,
              repsMax: 12,
              instructions: ['Tire vers le ventre.'],
            },
          ],
        },
      ],
    });
  });

  it('throws if the template lookup fails', async () => {
    const templateSingle = jest.fn().mockResolvedValue({ data: null, error: new Error('boom') });
    const templateEq = jest.fn().mockReturnValue({ single: templateSingle });
    const templateSelect = jest.fn().mockReturnValue({ eq: templateEq });
    (supabase.from as jest.Mock).mockReturnValue({ select: templateSelect });

    await expect(fetchProgramDetails('user-1', 'template-1')).rejects.toThrow('boom');
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npx jest workoutProgramData.test.ts`
Expected: FAIL — the first `fetchProgramDetails` test fails because the current implementation doesn't select `exercise_instructions` or populate `instructions` on the mapped exercise (actual result will be missing the `instructions` field, so `toEqual` fails).

- [ ] **Step 3: Update the implementation**

In `src/lib/workoutProgramData.ts`, change the `ProgramExercise` type:

```ts
export type ProgramExercise = {
  name: string;
  muscleGroup: string;
  sets: number;
  repsMin: number;
  repsMax: number;
  instructions: string[];
};
```

Then replace the `fetchProgramDetails` function with:

```ts
export async function fetchProgramDetails(userId: string, templateId: string): Promise<WorkoutProgram> {
  const { data: template, error: templateError } = await supabase
    .from('workout_templates')
    .select('name')
    .eq('id', templateId)
    .single();

  if (templateError) throw templateError;

  const { data: rows, error: rowsError } = await supabase
    .from('user_program_exercises')
    .select(
      'day_number, day_name, exercises(name, muscle_group, default_sets, default_reps_min, default_reps_max, exercise_instructions(step_number, text))'
    )
    .eq('user_id', userId)
    .order('day_number')
    .order('order_index');

  if (rowsError) throw rowsError;

  const dayMap = new Map<number, ProgramDay>();
  for (const row of (rows ?? []) as any[]) {
    if (!dayMap.has(row.day_number)) {
      dayMap.set(row.day_number, { dayNumber: row.day_number, name: row.day_name, exercises: [] });
    }
    const instructions = (row.exercises.exercise_instructions ?? [])
      .slice()
      .sort((a: any, b: any) => a.step_number - b.step_number)
      .map((i: any) => i.text);
    dayMap.get(row.day_number)!.exercises.push({
      name: row.exercises.name,
      muscleGroup: row.exercises.muscle_group,
      sets: row.exercises.default_sets,
      repsMin: row.exercises.default_reps_min,
      repsMax: row.exercises.default_reps_max,
      instructions,
    });
  }

  return {
    templateId,
    templateName: template.name,
    days: Array.from(dayMap.values()).sort((a, b) => a.dayNumber - b.dayNumber),
  };
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npx jest workoutProgramData.test.ts`
Expected: PASS (all tests, including the 2 `fetchProgramDetails` tests and every pre-existing test in the file)

- [ ] **Step 5: Commit**

```bash
git add src/lib/workoutProgramData.ts src/__tests__/workoutProgramData.test.ts
git commit -m "Join exercise instructions into fetchProgramDetails"
```

---

### Task 3: Tap-to-expand instructions in the workout screen

**Files:**
- Modify: `src/app/workout.tsx`

**Interfaces:**
- Consumes: `ProgramExercise.instructions: string[]` from Task 2.
- Produces: nothing consumed by a later task (final task in this plan).

- [ ] **Step 1: Add the `Pressable` import and expanded-state**

In `src/app/workout.tsx`, change the react-native import line:

```ts
import { View, Text, Button, ActivityIndicator, ScrollView, StyleSheet, Pressable } from 'react-native';
```

Add a new piece of state right after the existing `useState` declarations (after the `error` state line):

```ts
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  const toggleExercise = (key: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  };
```

- [ ] **Step 2: Make each exercise row tappable and render instructions when expanded**

Replace the exercise-rendering block inside the JSX (currently `{day.exercises.map((exercise, index) => ( <Text key={index} style={styles.exerciseLine}> ... </Text> ))}`) with:

```tsx
              {day.exercises.map((exercise, index) => {
                const key = `${day.dayNumber}-${index}`;
                const isExpanded = expanded.has(key);
                return (
                  <Pressable key={index} onPress={() => toggleExercise(key)} style={styles.exerciseRow}>
                    <Text style={styles.exerciseLine}>
                      {exercise.name} — {exercise.sets} x {exercise.repsMin}-{exercise.repsMax} ({exercise.muscleGroup})
                    </Text>
                    {isExpanded && (
                      <View style={styles.instructionsBlock}>
                        {exercise.instructions.map((step, stepIndex) => (
                          <Text key={stepIndex} style={styles.instructionLine}>
                            {stepIndex + 1}. {step}
                          </Text>
                        ))}
                      </View>
                    )}
                  </Pressable>
                );
              })}
```

- [ ] **Step 3: Add the new styles**

In the `StyleSheet.create({...})` block at the bottom of the file, add two new entries alongside the existing ones:

```ts
  exerciseRow: { marginBottom: 4 },
  instructionsBlock: { marginTop: 4, marginLeft: 12 },
  instructionLine: { marginBottom: 2, color: '#444' },
```

- [ ] **Step 4: Run the full test suite**

Run: `npx jest`
Expected: PASS (no dedicated test exists for this screen, consistent with every other screen in the project — this confirms the change didn't break any `*Data.ts`/`*.ts` test)

- [ ] **Step 5: Manually verify in the running app**

Start the app (`npx expo start --web`), open the Workout tab, and confirm:
- Tapping an exercise row reveals a numbered list of instructions beneath it.
- Tapping it again collapses the list.
- Tapping a different exercise expands that one independently (collapsing state is per-exercise, not global).

- [ ] **Step 6: Commit**

```bash
git add src/app/workout.tsx
git commit -m "Add tap-to-expand exercise instructions on the workout screen"
```

---
