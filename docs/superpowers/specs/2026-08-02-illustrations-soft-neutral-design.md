# Illustrations on Soft Neutral — Design

## Overview

Two earlier specs left the illustration work blocked on an unresolved
palette question. `2026-07-22-brand-visual-identity-design.md` fixed the
shared direction (minimalist base, targeted 3D relief, red/white/navy) but
produced no illustrations. `2026-07-31-onboarding-hero-illustration-design.md`
specified the onboarding hero **on an Athletic Dark background** (`#0E0E12`,
lime accent) and resolved the tension by having the illustration float as a
brand element on a dark screen.

That premise no longer holds. The app shipped Soft Neutral: the onboarding
wizard runs on `colors.bgBase` (`#F7F5F2`), and there is no dark chrome left
anywhere in `src/`. This spec supersedes the palette and screen-integration
sections of the hero spec, and extends the work to the two empty states that
currently use emoji placeholders.

## Scope

**In scope**: the ground each illustration sits on, the three subjects
(onboarding hero, empty meal plan, empty grocery list), their technical
specs, and how they get into the app.

**Out of scope**: recipe and exercise content imagery, UI icons, and the
weight-log empty state — that screen renders a bare `emptyText` string
rather than the shared `EmptyState` component, so giving it an illustration
means restructuring the screen first.

## The palette question, resolved

Illustrations use the brand palette — red `#DC2626`, white, navy — on the
**light** ground they actually sit on. The dark-background reasoning in the
hero spec is void: there is no dark screen to float against.

Because the ground differs by placement, so does the generated background:

- **Onboarding hero** sits directly on the screen → warm off-white
  `#F7F5F2` (`colors.bgBase`).
- **Empty states** sit inside a `Card`, which is white → pure white
  `#FFFFFF` (`colors.bgSurface`).

Generating on the exact destination color avoids a visible plate edge and
keeps the assets usable without an alpha channel. Running them through
background removal afterwards is still worth doing: a transparent PNG
survives a later palette change, and is required if dark mode ever lands.

## Subjects

**Onboarding hero** — unchanged from the hero spec: an athletic character
mid-stride holding a fork like a relay baton, with a motion trail shaped as
the logo's red running-track oval with white lane lines. The character
carries the 3D relief; the trail stays flat. Wide banner, character in the
right third.

**Empty meal plan** (`src/app/(tabs)/plan.tsx`) — an empty white plate at a
three-quarter angle, its rim styled as the red running track, next to a flat
weekly planner card with seven blank cells. The plate carries the relief;
the card stays flat.

**Empty grocery list** (`src/app/(tabs)/grocery-list.tsx`) — an empty
shopping basket in relief, over a flat red track oval used as a ground ring,
with an apple and a bread roll kept flat beside it.

Each empty state reads as "this container is waiting to be filled" rather
than "nothing here", which is what the copy already promises.

## Technical Specs

| Asset | Ratio | Generated size | Ground |
| --- | --- | --- | --- |
| `onboarding-hero.png` | 3:2 | 2528×1696 | `#F7F5F2` |
| `empty-plan.png` | 1:1 | 2048×2048 | `#FFFFFF` |
| `empty-grocery.png` | 1:1 | 2048×2048 | `#FFFFFF` |

Destination: `assets/images/illustrations/`. Loaded with `expo-image` and
downscaled in-app; no `@2x`/`@3x` variants needed at these resolutions.

## Production

Generated with Higgsfield / Nano Banana Pro at 2k, same pipeline as the logo.
Candidate jobs from 2026-08-02:

- Onboarding hero: `cdd68ed5-a33f-4cf4-a1d2-416cbb257a2f`,
  `cf727c7b-30f6-4766-bd34-b86899bcbe13`, and
  `01fa78ea-f7ed-4521-86e6-2211de11e54c` (this last one anchored on the
  existing character `abead9f6-b2a5-4358-867f-9668cff57c3c` from the
  2026-08-01 exercise-pose explorations, for character continuity).
- Empty meal plan: `ccd5a0a5-d697-4ffc-ae11-72c18e2d3e5a`,
  `73fb6639-1a08-4f73-8254-99709e221cd0`.
- Empty grocery list: `23af5c34-01dc-4219-98a0-5904e420452c`,
  `a1acbc64-2408-4e47-96ae-d43f3322bbbe`.

## Screen Integration

**Onboarding**: banner at the top of `src/app/onboarding.tsx`, above the
step counter and title, identical on all four wizard steps. Full bleed to
the screen edges, height capped so the form stays above the fold on a small
phone.

**Empty states**: `EmptyState` currently takes an `icon: React.ReactNode`
and both call sites pass an emoji `<Text>`. Widening it to accept an
illustration is a one-prop change — the component already centers and pads
whatever it is handed. The emoji stay as the fallback for any empty state
that has no illustration of its own.

## Known blocker

This repo's session container cannot reach `upload.higgsfield.ai` or the
Higgsfield CDN — the environment's network policy answers 403 to CONNECT.
Generation works (it runs server-side), but the resulting files cannot be
downloaded into the repo from an agent session. Until that changes, the
approved images have to be saved from the Higgsfield gallery and committed
to `assets/images/illustrations/` by hand; the code wiring above only
lands once the files exist, since Metro fails on a missing `require`.

## Testing / Validation

Static visual assets: validation is the user approving a candidate per slot,
then, once wired in, confirming on a device or simulator that the hero
renders full-bleed without a visible background seam across all four
onboarding steps, and that each empty-state illustration sits cleanly on the
white card at its rendered size.
