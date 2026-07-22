# Brand Visual Identity (Logo, App Icon, Splash Screen) — Design

## Overview

The app currently ships with default Expo template assets (`react-logo.png`,
`expo-badge.png`, generic `icon.png`/adaptive-icon set) — it has no real
brand identity yet. This project defines FitPro's first logo mark and
produces the assets that depend on it: app icon (iOS/Android/favicon) and
splash screen. It also sets the visual direction for future onboarding /
empty-state illustrations, without producing those illustrations yet.

This is a visual-asset deliverable. The logo concept was explored and
finalized through iterative generation with Higgsfield (Recraft V4.1 for
early icon-style concepts, Nano Banana Pro for the final photoreal-to-icon
refinement chain), not built here from scratch in code.

## Scope

**In scope**: the final logo mark description and reference image, the app
icon treatment (background color, platform variants needed), the splash
screen composition, and the style direction for future onboarding /
empty-state illustrations.

**Out of scope**: actually regenerating/exporting every platform-specific
icon file (`assets/images/android-icon-*.png`, `assets/expo.icon`,
`favicon.png`) and wiring them into `app.json` — that's implementation work
for the plan phase. Also out of scope: producing the onboarding/empty-state
illustrations themselves (direction only, per-screen execution later).

## Logo Mark

A plate viewed from directly above, where the outer rim is styled as a red
oval athletics running track with white lane lines — a single mark reading
as both "meal" (plate) and "fitness" (track). Inside the plate:

- A fork (left) and a knife (right), flanking the plate like a table
  setting, redrawn with accurate proportions (real tine/blade/handle
  shapes) and realistic metallic 3D relief (shading, highlights, soft
  shadows) rather than flat silhouettes.
- Small sport-themed objects (stopwatch, dumbbell, running shoe) placed
  inside the plate's empty center, each rendered with the same 3D relief
  treatment and given natural material colors (not monochrome).

Overall style: **minimalist base, targeted 3D relief** — the plate and
track rim stay clean and flat/minimal (simplified lane-line detail, lots
of negative space), while the cutlery and sport objects carry the relief
and color, giving them visual weight as the focal detail. Not photographic,
not fully flat/vector either — a deliberate middle ground reached by
starting from a photoreal render and pulling it back toward an icon.

Approved final reference: `assets/2026-07-22-fitpro-logo-reference.png`
(this spec's folder; Higgsfield job `4aa86341-59cb-4db4-98e8-13ea2233cb96`,
generated via Nano Banana Pro, 2048×2048).

**Color palette**: red (track rim, `#DC2626`-family), white (plate
surface), navy/dark neutral accents (from the fork/knife metallic shading).

## App Icon & Platform Assets

The logo mark above, centered, on a **white / light-neutral background**
(chosen over navy-dark or the app's current blue `#208AEF` — the light
background was picked specifically because it lets the red track and
metallic cutlery read clearly without competing with a colored background).

Needed variants (implementation phase):
- Square master (1024×1024 minimum) as the source of truth
- iOS icon (`assets/expo.icon`)
- Android adaptive icon: foreground (logo), background (solid white/light),
  monochrome (single-color silhouette version for themed icons)
- Web favicon (`assets/images/favicon.png`)

## Splash Screen

Logo centered, with the **"FitPro" wordmark below it**, on the same white /
light-neutral background as the app icon. This replaces the current
`expo-splash-screen` config in `app.json` (currently `backgroundColor:
"#208AEF"`, `image: splash-icon.png`).

## Onboarding / Empty-State Illustrations (direction only)

Future onboarding and empty-state illustrations (no recipe yet, no weight
history yet, etc.) should follow the **same visual family as the logo**:
minimalist base with targeted 3D relief on key focal objects, same
red/white/navy palette. Each illustration is produced individually when
that screen is worked on — this design doc only fixes the shared direction,
not the individual illustrations.

**Known open tension**: the existing onboarding UI design
(`2026-07-20-onboarding-visual-design.md`, "Athletic Dark" — dark
`#0E0E12` background, lime `#C6FF3D` accent) uses a different palette than
this new brand identity (light background, red/white/navy). Reconciling
the two — or deciding the onboarding *screen chrome* can stay dark while
*illustrations placed within it* use the brand palette — is a decision for
whoever next touches onboarding visuals, not resolved here.

## Testing / Validation

Not applicable in the usual sense (static visual asset, not executable
code). Validation is: the user reviews and approves the reference image
(done — `final_color_v1.png` approved). Once platform assets are produced
in the implementation phase, validation is visually confirming the icon
renders correctly at small sizes (home screen, notification) and the
splash screen displays correctly on app launch.
