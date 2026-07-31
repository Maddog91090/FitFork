# Onboarding Hero Illustration — Design

## Overview

The onboarding flow (`src/app/onboarding.tsx`, "Athletic Dark" visual design
per `2026-07-20-onboarding-visual-design.md`) currently has no illustration —
just the wizard form on a dark background. Separately, the brand visual
identity work (`2026-07-22-brand-visual-identity-design.md`) established a
logo mark and a shared visual family (minimalist base + targeted 3D relief,
red/white/navy palette) for future onboarding/empty-state illustrations, but
left the dark-vs-brand-palette tension unresolved and produced no
illustrations yet.

This project produces one hero illustration for the onboarding flow, and
resolves that palette tension: the illustration uses the brand palette
(red/white/navy) even though it sits on the Athletic Dark background,
prioritizing brand consistency over blending into the existing screen
chrome.

This is a visual-asset deliverable, generated with Higgsfield, following the
same iterative pipeline used for the logo. It does not cover empty-state
illustrations, content images (recipes/exercises), or UI icons — those are
separate, later sub-projects.

## Scope

**In scope**: one hero illustration for the onboarding flow — its subject,
composition, style treatment, palette, technical specs, and how it's placed
in `src/app/onboarding.tsx`.

**Out of scope**: empty-state illustrations (no plan yet, no weight log
yet), recipe/exercise content images, UI icons — separate sub-projects, not
addressed here. Per-step illustration variants (this is a single image
reused identically across all 4 onboarding steps). Actually generating and
wiring the final asset into the app — that's implementation-phase work.

## Subject & Composition

A single athletic character mid-stride/in effort, holding a fork, with a
motion trail behind them that reprises the logo's plate-as-running-track
motif (red oval, white lane lines) — the same "meal = fitness" visual pun as
the logo mark, restaged as an in-motion scene rather than the logo's static
overhead view.

This was chosen over two alternatives considered: a static symmetrical pose
(dumbbell in one hand, fork/plate in the other — simpler to read at small
banner size but less dynamic and less tied to the logo) and a "refueling"
scene with the character and a separate food tray as two distinct focal
points (easier to compose but less iconic, doesn't reuse the logo's pun).
The motion-trail concept was picked for the strongest visual tie back to the
already-approved logo mark, at the cost of being a more complex composition
to get right.

## Style Treatment

The brand style splits elements into a flat/minimal base and targeted 3D
relief on focal details (see logo: flat plate + track rim, relief-rendered
cutlery/sport objects). For this illustration, the split is:

- **Character**: the focal detail, rendered in 3D relief (volume, shading,
  realistic outfit colors) — the character carries the illustration's visual
  weight, unlike the logo where cutlery/objects carried it.
- **Motion trail / track motif**: stays flat and minimal, consistent with
  how the plate and track rim are treated in the logo.

## Palette

Brand palette: red (`#DC2626`-family, track/trail), white (highlights), navy
(shadows/outlines) — applied as-is, not adapted to the onboarding screen's
Athletic Dark tokens (`#0E0E12` background, `#C6FF3D` lime accent). The
illustration is meant to read as a distinct brand element floating on the
dark screen, the same way the app icon and splash screen read as
light-background brand elements rather than matching each screen's own
palette.

## Screen Integration

Placed as a banner at the top of `src/app/onboarding.tsx`, above the title
and step-counter, on all 4 wizard steps (Profil, Activité, Entraînement,
Récap) — one static image, not swapped per step. Exported as a
transparent-background PNG so it sits directly on the `bg/base` (`#0E0E12`)
color without its own background block.

## Technical Specs

- Format: PNG, transparent background
- Orientation: landscape/wide (~3:2), matching a top banner placement
- Resolution: export at approximately 1600×1067 (high enough to downscale
  cleanly for @2x/@3x mobile display)

## Production

Same pipeline as the logo (`2026-07-22-brand-visual-identity-design.md`):
initial concepts generated with Recraft V4.1, then refined with Nano Banana
Pro for character proportions, relief rendering, and consistency of the
motion-trail/track motif, iterating until visually approved.

## Testing / Validation

Not applicable in the usual sense (static visual asset, not executable
code). Validation is: the user reviews and approves the generated
illustration, then — once placed in `src/app/onboarding.tsx` in the
implementation phase — visually confirming it renders correctly (transparent
background, correct sizing/cropping) across the 4 onboarding steps on a
device or simulator.
