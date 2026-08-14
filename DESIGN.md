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

## Overview

FitFork is a Material 3 fitness and nutrition app. Its identity comes from four domain accent colors — nutrition, sport, progress, neutral — carried through Material's role system rather than a single fixed brand color, layered onto Material's standard components: filled/outlined buttons, elevated cards, filter chips, native ripple feedback on every touchable.

The interaction philosophy is native-first: press feedback is the platform's own ripple (`android_ripple`), not a custom spring or scale animation. Shape and elevation follow Material's conventions directly — generous but not exaggerated corner radii, a single neutral elevation tier for raised surfaces, no colored shadows, no decorative overlays.

The color system is built for both light and dark schemes — every screen and component genuinely switches via `useColorScheme()`, and both schemes carry the same four domain accents, each independently tuned per scheme via Material's tonal-inversion method so neither scheme reads as an afterthought. `userInterfaceStyle` is `"automatic"` in `app.json` — the dark scheme is reachable end-to-end on-device.

**Key Characteristics:**
- Four domain colors (nutrition, sport, progress, neutral), expressed through Material's `tertiary`/`onTertiary`/`tertiaryContainer` role triplet — the one role that changes per screen
- Full light + dark support, WCAG AA-verified in both schemes for every role
- Standard Material components: Filled/Outlined buttons, elevated Cards, filter chips — native `android_ripple` press feedback throughout
- One rounded typeface (Fredoka) themed through Material's type scale, per `android.md`'s explicit allowance for a themed brand face
- The mascot survives as the app's icon and splash screen identity only — it is not part of the functional UI's visual system

## Colors

Material's role system: a handful of **fixed roles** (background, surface, outline, primary, error) that never change per screen, plus one **swappable role** (`tertiary`) selected per screen by domain. Every role has an independently-tuned light and dark value — dark values are not simply the light values dimmed, they follow Material's tonal-inversion method (see below).

### Fixed roles

- **`background`/`onBackground`**: the screen's base fill and the text/icons directly on it. Light: `#FFFBF5`/`#2E2418`. Dark: `#17120C`/`#EEE6DD`.
- **`surface`/`onSurface`**: cards, inputs, anything raised off the background. Light: `#FFFFFF`/`#2E2418`. Dark: `#2C2217`/`#EEE6DD`.
- **`surfaceVariant`/`onSurfaceVariant`**: recessed or secondary areas. Light: `#FFF3E0`/`#6B5A46`. Dark: `#433423`/`#D5C4AF`.
- **`outline`/`outlineVariant`**: borders and dividers — `outline` is the stronger one, required to clear 3:1 for non-text UI (e.g. an Outlined button's border). Light: `#A67F4C`/`#F0D9B8`. Dark: `#A88357`/`#654F34`.
- **`primary`/`onPrimary`**: structural chrome — active tab tint, focus rings. Derived from Cacao Chaud (`#7A5C34`), sharing its source hue with the neutral domain's `tertiary` on purpose — chrome and content harmonize on a neutral-domain screen instead of clashing. Light: `#7A5C34`/`#FFFFFF`. Dark: `#D4BC9B`/`#322615` (Material's dark scheme convention: `primary` becomes a *light* tone used as text/icon tint, not a filled surface).
- **`error`/`onError`/`errorContainer`/`onErrorContainer`**: unchanged in hue from before this system, `#DC2626`-based; dark values follow the same tonal-inversion method as everything else. One value did change from the plan's original design during implementation: light-mode `onErrorContainer` is `lightColors.textPrimary` (`#2E2418`), not `lightColors.error` as originally planned — the error hue itself failed 4.5:1 against the light `errorContainer` fill (`#FBEAE7`), so it was repointed to the app's ink color, which clears it.

### Swappable role: `tertiary` (selected per screen by domain)

| Domain | `tertiary` (light) | `tertiary` (dark) |
| --- | --- | --- |
| nutrition | `#B25900` (Ambre Grillé) | `#FFB870` |
| sport | `#187A57` (Vert Forêt) | `#88E8C5` |
| progress | `#C2325A` (Rouge Baie) | `#E28DA5` |
| neutral | `#7A5C34` (Cacao Chaud) | `#D4BC9B` |

A component reads `tertiary`/`onTertiary`/`tertiaryContainer` for whichever domain its screen belongs to — a `Button` on a nutrition screen fills with nutrition's `tertiary`, a filter chip on a sport screen selects with sport's `tertiary`, and so on. This is the same "one domain per screen" idea the previous claymorphic system used, carried into Material's role naming.

### Dark scheme derivation

Material inverts intensity between light and dark: in light mode a domain color fills a large surface with white text on top; in dark mode a dark-desaturated version of the same hue fills the surface, and the original saturated hue becomes the text/icon color on top instead (avoids large saturated fills "vibrating" against a dark background). Concretely: each dark `tertiaryContainer` is a ~20-25%-lightness version of the same hue as its light source color, and `onTertiaryContainer` is a ~80-85%-lightness version of that same hue — never a different hue, just a different point on the same hue's lightness ramp. Every pair clears WCAG AA (4.5:1 text-on-fill, 3:1 non-text) — verified by a permanent Jest test (`src/__tests__/materialColors.test.ts`), not eyeballed.

### Status and domain vocabulary (unchanged, not part of this system's scope)

**Erreur** (`#DC2626`) / **Erreur Douce** (`#FBEAE7`), **Succès** (`#15803D`) / **Succès Douce** (`#E6F2EA`), **Attention** (`#B45309`) / **Attention Douce** (`#FBF0E2`); **Macro Protéine** (`#C2410C`), **Macro Glucides** (`#0F766E`), **Macro Lipides** (`#4338CA`); **Effort** (`#DC2626`), **Repos** (`#0369A1`).

### Named Rules

**The One Domain Rule.** A screen fundamentally about nutrition uses nutrition's `tertiary` for its accents; a sport screen uses sport's. Don't mix two domains' `tertiary` as accents on the same screen without a specific reason.

**The Fixed-Role Rule.** `background`/`surface`/`outline`/`primary`/`error` never change per screen or per domain — only `tertiary` (and its `onTertiary`/`tertiaryContainer` pair) is domain-aware.

## Typography

**Display & Body Font:** Fredoka — one rounded, friendly sans family, themed through Material's type scale rather than swapped for Roboto (`android.md` explicitly allows theming a brand face through the type scale; changing font is not required for platform conformance).

**Character:** Weight lives entirely in which Fredoka cut is loaded (`Fredoka_400Regular` / `_500Medium` / `_600SemiBold` / `_700Bold`), never in a separate `fontWeight` — React Native does not synthesize weights for custom fonts.

### Hierarchy (Material role names)

- **displayLarge** (700, 32px/38px, −0.6px): the one thing a screen is fundamentally about.
- **displayMedium** (700, 26px/32px, −0.4px): screen titles.
- **titleLarge** (600, 20px/26px, −0.2px): card titles, weighty section headings.
- **headlineLarge** (700, 28px/32px, −0.4px): a single big standalone number (calories, weight).
- **titleMedium** / **titleSmall** (700/16px and 600/14px): headings inside content.
- **bodyLarge** / **bodyMedium** (400/14px and 600/14px, 21px line height): running text.
- **labelLarge** (700, 14px/18px, +0.1px): buttons, tabs, chips.
- **labelMedium** / **labelSmall** (500/12px and 600/12px): metadata, secondary rows.
- **overline** (700, 10px/14px, +1.2px, uppercase): eyebrows, field labels, step counters — a custom addition beyond Material's canonical 15 type roles, same as Material itself allows.

### Named Rules

**The One Family Rule.** Fredoka carries every text role. Never spread `materialTypography.*` partially — spread the whole role object so family, size, leading, and tracking travel together.

## Layout

Unchanged from before: screens pad horizontally by `spacing.lg` (16px), separate sections by `spacing.xl` (24px), content caps at 560px and centers (`centeredContent`). `orientation` is unlocked in `app.json` as of this phase (defensive only — no adaptive tablet/landscape layout work has happened yet; that is Phase 6).

## Elevation

Single-tier, neutral Material elevation — not the claymorphic three-tier warm-tinted system. `materialElevation`: `shadowColor: #000000, shadowOpacity: 0.16, shadowRadius: 6, shadowOffset: {0, 2}, elevation: 2`. Used by `Card` only; `Button` and filter chips are flat (no shadow), matching Material's own default elevation for filled buttons and chips.

### Named Rules

**The Flat-by-Default Rule.** Only `Card` carries elevation. Buttons, chips, and tab icons are flat — ripple, fill, and border carry the interaction feedback instead of a shadow.

## Shapes

Unchanged radius scale: `xs` (10px, unused), `sm` (16px, inputs), `md`/`lg` (20/26px, cards and buttons), `xl` (32px, largest surfaces), `pill` (28px, chips), `full` (999px, circles).

## Components

### Buttons
- **Filled** (`variant="primary"`, default): fills with the screen domain's `tertiary`, `onTertiary` text, native ripple in `onTertiary` at ~12% opacity. No shadow, no gradient overlay.
- **Outlined** (`variant="secondary"`): transparent fill, 1px `outline` border, `onSurface` text, ripple in the domain's `tertiary` at ~12% opacity.
- **Disabled:** `surfaceVariant` fill (Filled) or transparent (Outlined), `onSurfaceVariant` label, border becomes `outlineVariant`.
- **Press:** the platform's own ripple — no custom animation, no `useReducedMotion` dependency (ripple already respects the system's Remove Animations setting on its own).

### Filter Chips
- **Style:** unselected = transparent fill, 1px border in the domain's `tertiary`, `tertiary`-colored label; selected = filled `tertiary`, `onTertiary` label.
- **Press:** native ripple, same domain-tinted approach as buttons.
- **Used by:** single-select (`ChoiceGroup`, `accessibilityRole="radio"`) and multi-select (`TagFilterGroup`, `accessibilityRole="checkbox"`) — same visual chip, different selection semantics.

### Cards
- **Corner:** `rounded.lg` (26px).
- **Background:** `surface`.
- **Elevation:** `materialElevation` (single neutral tier).
- **Border:** none.
- **Padding:** `spacing.md` (12px).

### Empty States
- Same structure as before (`illustration`/`icon`/`title`/`message`/`actionLabel`/`onAction`/`domain`) wrapped in a `Card`; `title` uses `titleLarge`/`onSurface`, `message` uses `bodyLarge`/`onSurfaceVariant`.

### Navigation (bottom tab bar)
- **Style:** `MaterialIcons` from `@expo/vector-icons`, tinted per-icon from its own `focused` prop — `primary` when active, `onSurfaceVariant` when inactive. No opacity trick; a genuine tint swap, same mechanism Material's own tab bars use.
- Still 6 destinations as of this phase — the restructuring to 5 is Phase 5 scope, not a Phase 4 change.

### Mascot
Present only as the app's icon, splash screen, and Android adaptive icon — not part of the functional UI's component system as of this phase. Its removal from screens (header placements, empty states, celebration/encouragement moments) is Phase 5 scope; the `Mascot.tsx` component itself is untouched by this phase and still renders in every screen that hasn't migrated yet.

## Do's and Don'ts

### Do:
- **Do** pull every color, size, radius, spacing, and typography value from `src/theme/tokens.ts`'s Material exports (`useMaterialColors`, `useMaterialTertiary`, `materialTypography`, `materialElevation`) — no inline hex or magic numbers in new/touched code.
- **Do** give every domain-aware component an explicit `domain` prop matching the screen's content rather than relying on the `'progress'` default.
- **Do** give every tappable element `android_ripple`, a minimum 48dp touch size, and an explicit `accessibilityRole`.
- **Do** verify any new color role's contrast against `src/__tests__/materialColors.test.ts`'s pattern — extend that file rather than eyeballing a new pair.

### Don't:
- **Don't** reach for the legacy claymorphic tokens (`lightColors`, `useThemeColors`, `typography`, `shadow`, `clayOverlay`) in new code — the Material migration is complete; no screen imports them anymore, and they exist in `tokens.ts` only as dead exports pending removal. `PressableScale` is gone entirely (the component file was deleted once its last consumer migrated).
- **Don't** mix two domains' `tertiary` as accents on one screen without a specific reason.
- **Don't** use `fontWeight` anywhere, or pair `fontFamily` with `fontWeight`.
- **Don't** add a custom spring/scale press animation to a new component — the native ripple is the interaction feedback, full stop.
- **Don't** add elevation/shadow to anything but `Card` without a specific reason — flat is the default.
