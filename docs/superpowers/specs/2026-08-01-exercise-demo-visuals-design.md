# Exercise Demonstration Visuals — Design

## Overview

The home workout program (`src/lib/homeWorkoutProgram.ts`) lists exercises as
plain text — a name, sometimes a short parenthetical cue (e.g. "Fentes
statiques (une jambe puis l'autre, sans à-coup)"). `src/app/(tabs)/workout.tsx`
renders these as `<Text>` inside expandable session cards. A user unfamiliar
with an exercise has no way to see what it actually looks like.

This project adds AI-generated demonstration visuals (start pose + end pose)
for each distinct movement in the program, produced with Higgsfield, and
wires them into a tap-to-view detail modal. It was explicitly flagged as a
future sub-project by `2026-07-31-onboarding-hero-illustration-design.md`
("recipe/exercise content images ... separate, later sub-projects") — this is
that project, for the exercise half.

## Scope

**In scope**: a canonical set of ~16 movement visuals (2 images each: start
pose, end pose), a mapping from every exercise string in
`homeWorkoutProgram.ts` to its canonical movement, a tap-to-view detail
modal in the workout screen, and the Higgsfield generation pipeline to
produce the assets.

**Out of scope**: recipe images (separate sub-project, not addressed here).
Per-variant visuals for every one of the ~40 exercise strings in the program
(movements that only differ by tempo/equipment share one visual — see
Canonical Movements below). Video/animated demonstrations — static images
only. Restructuring `homeWorkoutProgram.ts` itself — it stays string-based;
visuals are wired through a separate mapping module.

## Architecture & Data Wiring

A new module, `src/lib/exerciseVisuals.ts`, holds two lookup tables:

- `exerciseNameToMovementKey: Record<string, MovementKey>` — maps every
  exact exercise string currently used in `homeWorkoutProgram.ts` to a
  canonical movement key (e.g. `"Squats sur chaise (assis-debout, lent)"` →
  `"squat"`).
- `movementAssets: Record<MovementKey, { label: string; start: ImageSourcePropType; end: ImageSourcePropType }>`
  — maps each canonical key to its display label and its two local image
  assets (`require('../../assets/images/exercises/squat-start.png')`, etc.),
  following the same local-asset pattern already used for the logo and
  onboarding illustration (no CDN/storage backend exists in this app today).

A helper `getExerciseVisual(exerciseName: string): MovementAsset | undefined`
does the two-step lookup. `homeWorkoutProgram.ts` itself is not modified.

**Completeness check**: a unit test iterates every exercise string that
actually appears in `homeWorkoutProgram.ts` (all levels, all sessions) and
asserts each one has an entry in `exerciseNameToMovementKey` and that the
resulting movement key exists in `movementAssets`. This catches an exercise
silently ending up without a visual if the program text changes later,
without requiring the two files to be manually kept in sync by inspection.

## Canonical Movements (~16)

Movements are grouped by visual similarity of the pose, not by name. Tempo,
rep-scheme, or equipment variants of the same pose share one visual; a
variant that meaningfully changes the pose gets its own.

| Movement key | Covers (example program strings) |
|---|---|
| `squat` | Squats sur chaise, squats complets, squats à vide |
| `squatJump` | Squats sautés |
| `squatBulgarian` | Squats bulgares (pied arrière surélevé) |
| `pushupFloor` | Pompes (sur les genoux si besoin), pompes complètes, pompes déclinées |
| `pushupWall` | Pompes contre un mur |
| `lunge` | Fentes statiques, fentes alternées, fentes arrière |
| `lungeJump` | Fentes sautées (alternées) |
| `plank` | Gainage sur les genoux, gainage planche, gainage planche avec touches d'épaules |
| `sidePlank` | Gainage latéral, gainage latéral dynamique |
| `gluteBridge` | Pont fessier, pont fessier une jambe |
| `jumpingJack` | Jumping jacks doux, jumping jacks |
| `highKnees` | Montées de genoux sur place, genoux hauts (course sur place), sprint sur place genoux hauts |
| `heelToButt` | Talons-fesses |
| `marchInPlace` | Marche rapide sur place, genoux montés |
| `mountainClimber` | Mountain climbers, mountain climbers rapides |
| `burpee` | Burpees, burpees avec saut, burpees (version sans saut) |

This table is the authoritative source for `exerciseNameToMovementKey` — the
exact program strings above are copied verbatim from
`src/lib/homeWorkoutProgram.ts` into the mapping.

## UI Integration

Each exercise line in `src/app/(tabs)/workout.tsx` (inside both circuit and
series session cards) becomes tappable. Tapping opens a modal
(`ExerciseVisualModal`, new component) showing:

- The exercise's display label
- The two images (start pose, end pose) side by side or swipeable
- A close affordance

If `getExerciseVisual` returns `undefined` for a given string (shouldn't
happen given the completeness test, but the component must not crash),
the row simply isn't tappable / opens nothing — no broken-image state.

The session card list itself is visually unchanged until tapped — no
layout shift, no added weight to the default view.

## Production Pipeline (Higgsfield)

Same iterative pipeline used for the logo and onboarding hero illustration,
reusing the established brand style (flat base + targeted 3D relief, red
`#DC2626`-family / white / navy palette):

1. **Lock a demo character**: use Higgsfield's character-sheet workflow to
   generate one consistent character (same proportions, outfit, palette,
   style treatment as the onboarding hero character) to reuse as the
   subject across all 16 movements. User reviews and approves this
   character before any movement generation starts.
2. **Generate per movement**: for each of the 16 canonical movements,
   generate the start-pose and end-pose image using the locked character as
   reference, transparent or neutral background, consistent crop/framing so
   all images feel like one set.
3. **Review**: user reviews each pair; regenerate as needed for pose
   accuracy (this is the part that matters most — an anatomically
   confusing squat image is worse than no image).
4. **Export & wire**: approved images saved as PNGs under
   `assets/images/exercises/<movementKey>-start.png` /
   `-end.png`, referenced via `require(...)` in `movementAssets`.

This is a larger asset batch than prior single-illustration projects (16
movements × 2 poses = 32 images vs. 1), so pipeline steps 1–2 are done
grouped by session type (e.g. all lower-body movements together) to keep
review batches manageable, rather than one giant 32-image review pass.

## Testing / Validation

- Unit test: every exercise string in `homeWorkoutProgram.ts` resolves to a
  valid entry in `movementAssets` (completeness check described above).
- Visual: not automated. User reviews and approves each generated
  image pair before it's wired in (per pipeline step 3).
- Manual verification once wired: open the workout screen in the simulator,
  confirm tapping an exercise from each of the three levels opens the modal
  with correct, correctly-oriented images and no layout issues.
