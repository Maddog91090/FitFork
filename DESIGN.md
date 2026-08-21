---
name: FitFork
description: A Material 3 fitness and nutrition app — four domain accent colors carried through Material's role system, light and dark schemes, native ripple feedback.
colors:
  background-light: "#FFFBF5"
  on-background-light: "#2E2418"
  surface-light: "#FFFFFF"
  on-surface-light: "#2E2418"
  surface-variant-light: "#FFF3E0"
  on-surface-variant-light: "#6B5A46"
  outline-light: "#A67F4C"
  outline-variant-light: "#F0D9B8"
  primary-light: "#7A5C34"
  on-primary-light: "#FFFFFF"
  primary-container-light: "#6B4F26"
  on-primary-container-light: "#FFFFFF"
  on-error-light: "#FFFFFF"
  error-container-light: "#FBEAE7"
  on-error-container-light: "#2E2418"
  background-dark: "#17120C"
  on-background-dark: "#EEE6DD"
  surface-dark: "#2C2217"
  on-surface-dark: "#EEE6DD"
  surface-variant-dark: "#433423"
  on-surface-variant-dark: "#D5C4AF"
  outline-dark: "#A88357"
  outline-variant-dark: "#654F34"
  primary-dark: "#D4BC9B"
  on-primary-dark: "#322615"
  primary-container-dark: "#4F3B22"
  on-primary-container-dark: "#E8DBC9"
  on-error-dark: "#3D0A0A"
  error-container-dark: "#611010"
  on-error-container-dark: "#F4BDBD"
  tertiary-nutrition-light: "#B25900"
  tertiary-sport-light: "#187A57"
  tertiary-progress-light: "#C2325A"
  tertiary-neutral-light: "#7A5C34"
  on-tertiary-nutrition-light: "#FFFFFF"
  on-tertiary-sport-light: "#FFFFFF"
  on-tertiary-progress-light: "#FFFFFF"
  on-tertiary-neutral-light: "#FFFFFF"
  tertiary-nutrition-dark: "#FFB870"
  tertiary-sport-dark: "#88E8C5"
  tertiary-progress-dark: "#E28DA5"
  tertiary-neutral-dark: "#D4BC9B"
  on-tertiary-nutrition-dark: "#472400"
  on-tertiary-sport-dark: "#0C3C2B"
  on-tertiary-progress-dark: "#390F1A"
  on-tertiary-neutral-dark: "#322615"
  error: "#DC2626"
  error-soft: "#FBEAE7"
  success: "#15803D"
  success-soft: "#E6F2EA"
  warning: "#B45309"
  warning-soft: "#FBF0E2"
  macro-protein: "#C2410C"
  macro-carbs: "#0F766E"
  macro-fat: "#4338CA"
typography:
  displayLarge:
    fontFamily: "Fredoka_700Bold"
    fontSize: "32px"
    lineHeight: "38px"
    letterSpacing: "-0.6px"
  displayMedium:
    fontFamily: "Fredoka_700Bold"
    fontSize: "26px"
    lineHeight: "32px"
    letterSpacing: "-0.4px"
  titleLarge:
    fontFamily: "Fredoka_600SemiBold"
    fontSize: "20px"
    lineHeight: "26px"
    letterSpacing: "-0.2px"
  headlineLarge:
    fontFamily: "Fredoka_700Bold"
    fontSize: "28px"
    lineHeight: "32px"
    letterSpacing: "-0.4px"
  titleMedium:
    fontFamily: "Fredoka_700Bold"
    fontSize: "16px"
    lineHeight: "22px"
    letterSpacing: "-0.1px"
  titleSmall:
    fontFamily: "Fredoka_600SemiBold"
    fontSize: "14px"
    lineHeight: "20px"
  bodyLarge:
    fontFamily: "Fredoka_400Regular"
    fontSize: "14px"
    lineHeight: "21px"
  bodyMedium:
    fontFamily: "Fredoka_600SemiBold"
    fontSize: "14px"
    lineHeight: "21px"
  labelLarge:
    fontFamily: "Fredoka_700Bold"
    fontSize: "14px"
    lineHeight: "18px"
    letterSpacing: "0.1px"
  labelMedium:
    fontFamily: "Fredoka_500Medium"
    fontSize: "12px"
    lineHeight: "17px"
  labelSmall:
    fontFamily: "Fredoka_600SemiBold"
    fontSize: "12px"
    lineHeight: "17px"
  overline:
    fontFamily: "Fredoka_700Bold"
    fontSize: "10px"
    lineHeight: "14px"
    letterSpacing: "1.2px"
rounded:
  xs: "10px"
  sm: "16px"
  md: "20px"
  lg: "26px"
  xl: "32px"
  pill: "28px"
  full: "999px"
spacing:
  xs: "4px"
  sm: "8px"
  md: "12px"
  lg: "16px"
  xl: "24px"
  xxl: "32px"
  xxxl: "48px"
components:
  button-filled:
    backgroundColor: "{colors.tertiary-progress-light}"
    textColor: "{colors.on-tertiary-progress-light}"
    typography: "{typography.labelLarge}"
    rounded: "{rounded.lg}"
    padding: "14px 16px"
  button-outlined:
    backgroundColor: "transparent"
    borderColor: "{colors.outline-light}"
    textColor: "{colors.on-surface-light}"
    typography: "{typography.labelLarge}"
    rounded: "{rounded.lg}"
    padding: "14px 16px"
  card:
    backgroundColor: "{colors.surface-light}"
    rounded: "{rounded.lg}"
    padding: "12px"
  text-field:
    backgroundColor: "{colors.surface-light}"
    textColor: "{colors.on-surface-light}"
    typography: "{typography.bodyLarge}"
    rounded: "{rounded.sm}"
    padding: "12px"
  filter-chip-selected:
    backgroundColor: "{colors.tertiary-progress-light}"
    textColor: "{colors.on-tertiary-progress-light}"
    typography: "{typography.labelLarge}"
    rounded: "{rounded.pill}"
    padding: "10px 14px"
  filter-chip:
    backgroundColor: "transparent"
    borderColor: "{colors.tertiary-progress-light}"
    textColor: "{colors.tertiary-progress-light}"
    typography: "{typography.labelLarge}"
    rounded: "{rounded.pill}"
    padding: "10px 14px"
---

# Design System: FitFork

*Stitch generation reference — refreshed 2026-08-21, ground-truthed against `src/theme/tokens.ts`, `app.json`, `PRODUCT.md`, and the current screens under `src/app`. `.claude/skills/fitfork-design/SKILL.md` still describes the earlier claymorphic system and is stale against this file — it's a historical record, not current guidance.*

## 1. Visual Theme & Atmosphere

FitFork is a **warm, native-Material home-fitness coach app** — not a cold SaaS dashboard, and not a candy-colored lifestyle app either. The mood is "a friendly coach's notebook, built on solid platform furniture": a cream-and-cocoa neutral base (never gray, never Zinc/Slate — warmth is the point) carries one rounded, friendly display face (Fredoka) and Material 3's own components, shapes, and native ripple feedback, so nothing fights the platform. Personality comes from **content and color, not chrome** — real food photography, real at-home workout photography, and one accent hue per screen selected by *what the content is* (nutrition, sport, progress, or neutral), never applied as decoration.

- **Density:** Daily App Balanced (5/10) — comfortable card and list rhythm for a phone screen; not gallery-airy, not cockpit-dense.
- **Variance:** Balanced (4/10) — screens are single-column, content-led layouts (a native mobile app, not a marketing site chasing hero drama). What asymmetry exists is functional — a domain photo above a title, a chip row breaking the grid — never decorative.
- **Motion:** Restrained (3/10) — feedback is the platform's own ripple, not custom spring choreography (§9). This is a deliberate, confirmed reversal of an earlier bouncier direction — don't reintroduce spring/scale press animation.

**Key characteristics:**
- Four domain colors (nutrition, sport, progress, neutral), expressed through Material's `tertiary`/`onTertiary`/`tertiaryContainer` role triplet — the one role that changes per screen.
- Full light + dark support, WCAG AA-verified in both schemes for every role. `userInterfaceStyle: "automatic"` in `app.json`.
- Standard Material components — Filled/Outlined buttons, elevated Cards, filter chips — native `android_ripple` press feedback throughout.
- One rounded typeface (Fredoka) themed through Material's type scale.
- Real, non-generic photography for every recipe, workout session, and exercise (§4) — never a stock-photo or illustration substitute.
- A fully-built three-pose mascot (broccoli character) exists but today lives only as the app icon/splash — it is **not** placed inside any generated screen (§10).

## 2. Colors

Material's role system: a handful of **fixed roles** (background, surface, outline, primary, error) that never change per screen, plus one **swappable role** (`tertiary`) selected per screen by domain. Every role has an independently-tuned light and dark value — dark values are not simply the light values dimmed; they follow Material's tonal-inversion method (below).

### Fixed roles

- **`background`/`onBackground`**: the screen's base fill and text/icons directly on it. Light: `#FFFBF5`/`#2E2418`. Dark: `#17120C`/`#EEE6DD`.
- **`surface`/`onSurface`**: cards, inputs, anything raised off the background. Light: `#FFFFFF`/`#2E2418`. Dark: `#2C2217`/`#EEE6DD`.
- **`surfaceVariant`/`onSurfaceVariant`**: recessed or secondary areas. Light: `#FFF3E0`/`#6B5A46`. Dark: `#433423`/`#D5C4AF`.
- **`outline`/`outlineVariant`**: borders and dividers — `outline` is the stronger one, clears 3:1 for non-text UI (e.g. an Outlined button's border). Light: `#A67F4C`/`#F0D9B8`. Dark: `#A88357`/`#654F34`.
- **`primary`/`onPrimary`**: structural chrome — active tab tint, focus rings. Derived from Cacao Chaud (`#7A5C34`), sharing its hue with the neutral domain's `tertiary` on purpose. Light: `#7A5C34`/`#FFFFFF`. Dark: `#D4BC9B`/`#322615` (Material's dark-scheme convention: `primary` becomes a *light* tone used as text/icon tint, not a filled surface).
- **`error`/`onError`/`errorContainer`/`onErrorContainer`**: `#DC2626`-based; dark values follow the same tonal-inversion method as everything else. Light-mode `onErrorContainer` is the app's ink color (`#2E2418`), not the error hue itself — the error hue fails 4.5:1 against the light `errorContainer` fill (`#FBEAE7`).

### Swappable role: `tertiary` (selected per screen by domain)

| Domain | `tertiary` (light) | `tertiary` (dark) | Used for |
| --- | --- | --- | --- |
| nutrition | `#B25900` (Ambre Grillé) | `#FFB870` | Meals, recipes, macros, grocery list, calorie/barcode logging |
| sport | `#187A57` (Vert Forêt) | `#88E8C5` | Workouts, exercises, training sessions |
| progress | `#C2325A` (Rouge Baie) | `#E28DA5` | Streaks, milestones, weight/progress tracking |
| neutral | `#7A5C34` (Cacao Chaud) | `#D4BC9B` | Home, settings, auth, anything not domain-specific |

A component reads `tertiary`/`onTertiary`/`tertiaryContainer` for whichever domain its screen belongs to — a Button on a nutrition screen fills with nutrition's `tertiary`, a filter chip on a sport screen selects with sport's `tertiary`. **This is the single most important rule for generating a new screen: pick the domain from the content, then use that domain's `tertiary` for every accent on the screen.**

### Dark scheme derivation

Material inverts intensity between light and dark: in light mode a domain color fills a large surface with white text on top; in dark mode a dark-desaturated version of the hue fills the surface, and the original saturated hue becomes the text/icon color on top instead (avoids large saturated fills "vibrating" against a dark background). Every pair clears WCAG AA (4.5:1 text-on-fill, 3:1 non-text).

### Status and domain vocabulary (unchanged, not part of this system's scope)

**Erreur** (`#DC2626`) / **Erreur Douce** (`#FBEAE7`), **Succès** (`#15803D`) / **Succès Douce** (`#E6F2EA`), **Attention** (`#B45309`) / **Attention Douce** (`#FBF0E2`); **Macro Protéine** (`#C2410C`), **Macro Glucides** (`#0F766E`), **Macro Lipides** (`#4338CA`).

### Named rules

**The One Domain Rule.** A screen fundamentally about nutrition uses nutrition's `tertiary` for its accents; a sport screen uses sport's. Don't mix two domains' `tertiary` as accents on the same screen without a specific reason — this is the app's one-accent-per-screen discipline, just domain-selected rather than fixed.

**The Fixed-Role Rule.** `background`/`surface`/`outline`/`primary`/`error` never change per screen or per domain — only `tertiary` (and its `onTertiary`/`tertiaryContainer` pair) is domain-aware.

**No neutral-gray substitution.** Never draw the neutral base from a cool gray/Zinc/Slate ramp — `background`/`surface`/`surfaceVariant` are warm cream/cocoa tones, and that warmth is load-bearing to the brand, not an incidental choice to normalize away.

## 3. Typography

**Display & Body Font:** Fredoka — one rounded, friendly sans family, themed through Material's type scale rather than swapped for Roboto.

**Weight:** lives entirely in which Fredoka cut is loaded (`Fredoka_400Regular` / `_500Medium` / `_600SemiBold` / `_700Bold`), never in a separate `fontWeight` property.

### Hierarchy (Material role names)

- **displayLarge** (700, 32px/38px, −0.6px): the one thing a screen is fundamentally about.
- **displayMedium** (700, 26px/32px, −0.4px): screen titles.
- **titleLarge** (600, 20px/26px, −0.2px): card titles, weighty section headings.
- **headlineLarge** (700, 28px/32px, −0.4px): a single big standalone number (calories, weight).
- **titleMedium** / **titleSmall** (700/16px and 600/14px): headings inside content.
- **bodyLarge** / **bodyMedium** (400/14px and 600/14px, 21px line height): running text. Cap prose at ~40-50 characters per line on a phone-width column — this is a narrow mobile screen, not a 65ch web column.
- **labelLarge** (700, 14px/18px, +0.1px): buttons, tabs, chips.
- **labelMedium** / **labelSmall** (500/12px and 600/12px): metadata, secondary rows.
- **overline** (700, 10px/14px, +1.2px, uppercase): eyebrows, field labels, step counters.

### Named rule

**The One Family Rule.** Fredoka carries every text role. Spread the whole role object (`materialTypography.titleLarge`, etc.) so family, size, leading, and tracking travel together — never assemble a text style from individual size/weight picks.

**Banned:** Inter, system-default sans (San Francisco / Roboto swapped in place of Fredoka), any serif face — this is a rounded-sans-only system, no exceptions for "editorial" moments.

## 4. Photography & Imagery

Real, specific, non-generic photography is a core brand asset — this is what actually differentiates FitFork's screens from a generic template, more than any color or shape choice. **Never fall back to stock photography, Unsplash-style imagery, broken image links, or illustration as a substitute for these.**

- **Recipes** (nutrition domain): one photorealistic 3/4-angle dish photo per recipe, shown under the title/macros. House style: casual, unpretentious home-cook plating — no ring molds, no architectural garnish, no sauce-dot drizzle art. Warm natural window light, shallow depth of field, plain wood-table background, no hands/people/text/logos. A home cook should look at it and believe they could make it themselves — never "restaurant kitchen."
- **Workout sessions** (sport domain): one photo per session showing a normal, relatable person (not a fitness-model physique) performing the session's signature move in a plain home living room — mat or rug over a wood floor, natural window light, no gym equipment, no mirrors, no branding. Reads as "you could do this in your own living room."
- **Exercises** (sport domain): two photos per exercise, side by side — start position and end position — same achievable-home-workout house style as sessions.
- **Barcode/camera screens**: full-bleed live camera view (`CameraView`) with a thin scan-frame overlay and one line of instruction text — not a photo, a live capture surface. Keep chrome minimal: a back affordance and the frame only.

## 5. Screens & Key Moments

There is no marketing "hero section" in this app — every screen is a working screen a returning user opens daily. The closest equivalents, and how to treat them:

- **Home** (neutral domain): the day's summary — today's plan, workout, and progress at a glance. Leads with the day's most useful number or next action, not a headline.
- **Onboarding**: a multi-step wizard capturing profile and goals before targets can be computed. Each step is single-purpose, one question or choice group per screen, progress communicated structurally (a step indicator), never by a filler "swipe to continue" cue.
- **Generate-plan**: the app's confirmed differentiator — one action that computes targets and generates a full week's meal plan and workout program at once. This screen should read as consequential (a real generation happening) without resorting to a generic spinner; prefer a skeleton or a short, specific status line over a bare circular loader.
- **Barcode scan → log product** (nutrition domain): scan is full-bleed camera; the following log-product screen is a standard form (fields, a meal-type chip row, a save action) — don't over-design the confirmation step just because the scan step was novel.

**No filler UI text** ("Fais glisser pour continuer", scroll arrows, bouncing chevrons) anywhere. **No fabricated content** — no Lorem Ipsum, no placeholder names ("Jean Dupont", "Acme"), no fake testimonials or press. Real recipe/exercise data already exists in `src/lib/mealPlanData.ts` and `src/lib/exercises.ts`; generate from or alongside that, don't invent parallel placeholder data.

## 6. Layout

- Screens pad horizontally by `spacing.lg` (16px), separate sections by `spacing.xl` (24px).
- Content caps at 560px and centers (`centeredContent`) — this app also runs on web/tablet via Expo, so this stops inputs and cards from stretching edge-to-edge on a wide viewport. Below that cap (phone width) it's a no-op.
- Single-column by default. A 3-up equal-card row is not this app's pattern — recipe/session lists are single-column cards with a photo, workout circuits use numbered exercise rows, the meal-plan grid is the one deliberate 2D grid (day × meal-type) and stays that way rather than being flattened.
- `app.json` sets no explicit `orientation` key (Expo's system-following default applies) — no adaptive tablet/landscape layout exists yet; don't design a screen that depends on landscape space.
- Safe-area insets (`useSafeAreaInsets`) are handled explicitly on full-bleed screens (e.g. the camera scan screen) rather than relying on a wrapping nav chrome.

## 7. Elevation

Single-tier, neutral Material elevation. `materialElevation`: `shadowColor: #000000, shadowOpacity: 0.16, shadowRadius: 6, shadowOffset: {0, 2}, elevation: 2`. Used by `Card` only; buttons and filter chips are flat (no shadow), matching Material's own default elevation for filled buttons and chips.

**The Flat-by-Default Rule.** Only `Card` carries elevation. Buttons, chips, and tab icons are flat — ripple, fill, and border carry the interaction feedback instead of a shadow. Never add a colored/tinted shadow, a glow, or a second elevation tier.

## 8. Shapes

Radius scale: `xs` (10px, unused today), `sm` (16px, inputs), `md`/`lg` (20/26px, cards and buttons), `xl` (32px, largest surfaces), `pill` (28px, chips), `full` (999px, circles). Generous but not exaggerated — this is Material's own shape language, not the earlier claymorphic system's more extreme rounding.

## 9. Motion & Interaction

- **Press feedback is the platform's own ripple** (`android_ripple`) — not a custom spring, scale, or opacity animation. This is a deliberate, confirmed choice: an earlier "bouncy claymorphic" spring-press system (`PressableScale`) was fully removed when the app migrated to Material.
- Ripple already respects the system's Remove Animations / Reduce Motion setting on its own — no separate `useReducedMotion` handling is needed for press feedback, unlike screen-level transitions (onboarding step transitions do check `useReducedMotion` explicitly).
- No perpetual micro-loops, no idle breathing/pulse animation anywhere in the functional UI (the mascot's idle breathing loop, if it's ever wired in, is the one deliberate exception — see §10).
- No parallax, no scroll-triggered choreography — this is a native list/card UI, not a scrolling marketing page.
- If a loading state is needed, prefer a skeleton matching the layout's real dimensions over a generic spinner.

## 10. Components

### Buttons
- **Filled** (`variant="primary"`, default): fills with the screen domain's `tertiary`, `onTertiary` text, native ripple in `onTertiary` at ~12% opacity. No shadow, no gradient overlay.
- **Outlined** (`variant="secondary"`): transparent fill, 1px `outline` border, `onSurface` text, ripple in the domain's `tertiary` at ~12% opacity.
- **Disabled:** `surfaceVariant` fill (Filled) or transparent (Outlined), `onSurfaceVariant` label, border becomes `outlineVariant`.
- **Press:** the platform's own ripple — no custom animation.

### Filter chips
- **Style:** unselected = transparent fill, 1px border in the domain's `tertiary`, `tertiary`-colored label; selected = filled `tertiary`, `onTertiary` label.
- **Press:** native ripple, same domain-tinted approach as buttons.
- **Used by:** single-select (radio semantics) and multi-select (checkbox semantics) — same visual chip, different selection semantics, both need the matching `accessibilityRole`.

### Cards
- **Corner:** `rounded.lg` (26px). **Background:** `surface`. **Elevation:** `materialElevation` (single neutral tier). **Border:** none. **Padding:** `spacing.md` (12px).

### Inputs
- Label above the input, helper text optional, error text below in `error`/`errorContainer`. Focused inputs thicken their border; compensate padding so the box doesn't visibly jump.

### Empty states
- Structure: optional `illustration` (a brand illustration on the surface color) or `icon` fallback, `title` (`titleLarge`/`onSurface`), `message` (`bodyLarge`/`onSurfaceVariant`), optional `actionLabel`/`onAction`, all tinted by the screen's `domain`. Name the benefit of acting, not the emptiness itself.

### Camera / scan screens
- Full-bleed `CameraView` behind a thin overlay: back affordance top-left, a scan-frame outline, one line of instruction text. Permission-not-granted state is a normal centered screen (title, message, one filled button) — not a custom illustration.

### Navigation (bottom tab bar)
- **Destinations today: 5** — Accueil, Plan, Recettes, Entraînement, Courses. (Journal and Progression are pushed screens, not tabs.)
- **Style:** `MaterialIcons`, tinted per-icon from its own `focused` prop — `primary` when active, `onSurfaceVariant` when inactive. A genuine tint swap, not an opacity trick.

## 11. Mascot

A three-pose broccoli character (`idle`, `celebrating`, `encouraging` — Pixar-style shading, big expressive eyes, coral-orange sneakers) is fully built (`src/components/ui/Mascot.tsx`, `assets/images/mascot/`) and used as the app icon, splash screen, and Android adaptive icon. **It is not currently placed inside any functional screen** — no screen imports or renders `Mascot`. When generating a new screen, do not add the mascot unless the brief explicitly asks for it; if it does, keep it to the celebration/encouragement use case it was built for (a milestone, a completed session, a setback), never as decorative filler on a routine screen.

## 12. Copy & Tone (French)

The app tutoies the user and speaks like a coach who respects their time: "Choisis les repas à générer", "Ton profil", "Session expirée, reconnecte-toi."

- Second person singular, always. Never "vous".
- Short, concrete, no exclamation marks, no hype ("Boom !", "Incroyable !"), no guilt ("Tu as encore raté...") — for all functional copy (labels, errors, buttons, informational content).
- Energy and exclamation marks are reserved for the mascot's own lines, if and when it's placed on a screen — not for body copy.
- Errors say what happened and what to do next, in that order, and stay factual.
- Empty states name the benefit of acting, not the emptiness itself.
- Labels are nouns ("Poids", "Objectif"), buttons are verbs ("Générer le plan").
- Banned regardless of language: "Elevate", "Seamless", "Unleash", "Next-Gen" and their French equivalents ("Boostez", "Sans effort", "Révolutionnez") — this is sober functional copy, not ad copy.

## 13. Anti-Patterns (Banned)

- No neutral-gray/Zinc/Slate base — the neutral base is warm cream/cocoa, always.
- No custom spring/scale/opacity press animation on any new component — native ripple only (§9).
- No `fontWeight` anywhere, and never `fontFamily` paired with `fontWeight`.
- No mixing two domains' `tertiary` as accents on one screen without a specific reason.
- No pure black (`#000000`) — the darkest surface in the system is `#17120C`.
- No stock photography, Unsplash-style filler, or broken image links — use the established recipe/workout/exercise photography house styles (§4), or a real Material icon, never a placeholder.
- No fabricated testimonials, benchmarks, press mentions, or placeholder names ("Jean Dupont", "Acme").
- No filler UI text ("Fais glisser pour continuer", scroll arrows, bouncing chevrons).
- No generic circular spinner where a skeleton matching the real layout is possible.
- No emojis as UI iconography in new screens — use `MaterialIcons`.
- No adding the mascot to a routine screen (§11).
- No 3-up equal-card marketing-style row — this app's lists are single-column cards or the one deliberate day×meal-type grid (§6).
- No AI copywriting clichés, in English or French (§12).

## 14. Do's and Don'ts (engineering discipline)

### Do
- Pull every color, size, radius, spacing, and typography value from `src/theme/tokens.ts`'s Material exports (`useMaterialColors`, `useMaterialTertiary`, `materialTypography`, `materialElevation`) — no inline hex or magic numbers.
- Give every domain-aware component an explicit `domain` prop matching the screen's content rather than relying on a default.
- Give every tappable element `android_ripple`, a minimum 48dp touch size, and an explicit `accessibilityRole`.
- Verify any new color role's contrast against `src/__tests__/materialColors.test.ts`'s pattern.

### Don't
- Don't reach for the legacy claymorphic tokens (`lightColors`, `useThemeColors`, `typography`, `shadow`, `clayOverlay`) — the Material migration is complete; nothing in `src/app` imports them. `PressableScale` no longer exists as a file.
- Don't mix two domains' `tertiary` as accents on one screen without a specific reason.
- Don't use `fontWeight` anywhere, or pair `fontFamily` with `fontWeight`.
- Don't add a custom spring/scale press animation to a new component — the native ripple is the interaction feedback, full stop.
- Don't add elevation/shadow to anything but `Card` without a specific reason — flat is the default.
