---
name: FitFork
description: A claymorphic, mascot-driven home fitness and nutrition app — puffy volume, four domain colors, one rounded typeface, a broccoli coach.
colors:
  amber-grille: "#B25900"
  amber-grille-deep: "#8A5200"
  vert-foret: "#187A57"
  vert-foret-deep: "#0E4F38"
  rouge-baie: "#C2325A"
  rouge-baie-deep: "#A31C42"
  cacao-chaud: "#7A5C34"
  cacao-chaud-deep: "#6B4F26"
  creme-chaude: "#FFFBF5"
  blanc-surface: "#FFFFFF"
  peche-creuse: "#FFF3E0"
  encre-chaude: "#2E2418"
  encre-attenuee: "#6B5A46"
  encre-discrete: "#B8A78E"
  blanc-sur-accent: "#FFFFFF"
  trait-interieur: "#FBEAD3"
  trait-exterieur: "#F0D9B8"
  trait-renforce: "#A67F4C"
  erreur: "#DC2626"
  erreur-douce: "#FBEAE7"
  succes: "#15803D"
  succes-douce: "#E6F2EA"
  attention: "#B45309"
  attention-douce: "#FBF0E2"
  macro-proteine: "#C2410C"
  macro-glucides: "#0F766E"
  macro-lipides: "#4338CA"
  effort: "#DC2626"
  repos: "#0369A1"
typography:
  hero:
    fontFamily: "Fredoka_700Bold"
    fontSize: "32px"
    lineHeight: "38px"
    letterSpacing: "-0.6px"
  display:
    fontFamily: "Fredoka_700Bold"
    fontSize: "26px"
    lineHeight: "32px"
    letterSpacing: "-0.4px"
  title:
    fontFamily: "Fredoka_600SemiBold"
    fontSize: "20px"
    lineHeight: "26px"
    letterSpacing: "-0.2px"
  metric:
    fontFamily: "Fredoka_700Bold"
    fontSize: "28px"
    lineHeight: "32px"
    letterSpacing: "-0.4px"
  heading:
    fontFamily: "Fredoka_700Bold"
    fontSize: "16px"
    lineHeight: "22px"
    letterSpacing: "-0.1px"
  subheading:
    fontFamily: "Fredoka_600SemiBold"
    fontSize: "14px"
    lineHeight: "20px"
  body:
    fontFamily: "Fredoka_400Regular"
    fontSize: "14px"
    lineHeight: "21px"
  bodyStrong:
    fontFamily: "Fredoka_600SemiBold"
    fontSize: "14px"
    lineHeight: "21px"
  label:
    fontFamily: "Fredoka_700Bold"
    fontSize: "14px"
    lineHeight: "18px"
    letterSpacing: "0.1px"
  caption:
    fontFamily: "Fredoka_500Medium"
    fontSize: "12px"
    lineHeight: "17px"
  captionStrong:
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
  button-primary:
    backgroundColor: "{colors.rouge-baie}"
    textColor: "{colors.blanc-sur-accent}"
    typography: "{typography.label}"
    rounded: "{rounded.lg}"
    padding: "14px 16px"
  button-primary-active:
    backgroundColor: "{colors.rouge-baie-deep}"
    textColor: "{colors.blanc-sur-accent}"
    typography: "{typography.label}"
    rounded: "{rounded.lg}"
    padding: "14px 16px"
  button-secondary:
    backgroundColor: "{colors.blanc-surface}"
    textColor: "{colors.encre-chaude}"
    typography: "{typography.label}"
    rounded: "{rounded.lg}"
    padding: "14px 16px"
  card:
    backgroundColor: "{colors.blanc-surface}"
    rounded: "{rounded.lg}"
    padding: "12px"
  text-field:
    backgroundColor: "{colors.blanc-surface}"
    textColor: "{colors.encre-chaude}"
    typography: "{typography.body}"
    rounded: "{rounded.sm}"
    padding: "12px"
  choice-pill-selected:
    backgroundColor: "{colors.rouge-baie}"
    textColor: "{colors.blanc-sur-accent}"
    typography: "{typography.subheading}"
    rounded: "{rounded.pill}"
    padding: "10px 14px"
  choice-pill:
    backgroundColor: "{colors.blanc-surface}"
    textColor: "{colors.encre-chaude}"
    typography: "{typography.subheading}"
    rounded: "{rounded.pill}"
    padding: "10px 14px"
---

# Design System: FitFork

## Overview

**Creative North Star: "Le Brocoli Vivant" (The Living Broccoli)**

FitFork's entire visual identity radiates from its mascot: a stylized cartoon broccoli character with big Pixar-style eyes and coral-orange sneakers, who lives permanently in the app and reacts to what the user does. Every other decision in this system exists to give that character a world it belongs in — puffy, warm-lit, hand-shaped surfaces instead of flat panels; four saturated domain colors instead of one cold brand accent; a single rounded typeface (Fredoka) that reads as friendly rather than clinical; and a deliberately bouncy, springy press feel on every tappable surface, because a claymorphic world should feel physically squishable, not just visually soft.

The interaction philosophy is **ludique et rebondissant** — playful and bouncy. The bounce is not a subtle acknowledgment of a tap; it is a visible, springy overshoot on release, present on buttons, chips, and cells alike. This is a deliberate reversal of the flat, restrained "no bounce on a button" convention common to generic productivity apps — energy here comes from volume and motion, not from a loud palette or aggressive gradients.

This system explicitly rejects **generic flat SaaS**: thin-bordered flat cards, blue-violet gradients, and the interchangeable "professional tool" look that could belong to any B2B dashboard. FitFork is a home-workout and home-cooking companion, not an enterprise tool — it should never look like one.

**Key Characteristics:**
- One mascot, three poses (`idle`, `celebrating`, `encouraging`), permanently present rather than a decorative one-off
- Four domain colors (nutrition, sport, progress, neutral) — no single brand accent
- Puffy claymorphic volume: generous radii, two-tier warm shadows, a diagonal light-catching sheen on every raised surface
- One rounded typeface (Fredoka) carrying everything from hero text to button labels
- Deliberately bouncy, springy motion as the default interaction feel, not an occasional flourish
- Light-only by tested decision, not by omission

## Colors

No single brand accent. Four **domain colors**, each owning one functional area of the app, plus a warm cream-and-cocoa neutral base — the palette reads as a kitchen table, not a dashboard.

### Nutrition
- **Ambre Grillé** (`#B25900` / `{colors.amber-grille}`): meals, recipes, macros, the meal-plan generation flow. Named for the toasted, oven-warm color of roasted food — it's meant to feel appetizing, not clinical-diet-app orange.
- **Ambre Grillé Profond** (`#8A5200` / `{colors.amber-grille-deep}`): body-size text/icons on a nutrition screen, and a nutrition-domain button's pressed-state fill.

### Sport
- **Vert Forêt** (`#187A57` / `{colors.vert-foret}`): workouts, exercises, training screens. A deep, natural forest green rather than a neon "fitness app" green — sober and energetic at once.
- **Vert Forêt Profond** (`#0E4F38` / `{colors.vert-foret-deep}`): body-size text/icons, pressed-state fill, on sport screens.

### Progress
- **Rouge Baie** (`#C2325A` / `{colors.rouge-baie}`): streaks, milestones, weight and progress tracking. A warm berry-red, the direct descendant of the app's original single accent color — the one domain that carries a bit of that history.
- **Rouge Baie Profond** (`#A31C42` / `{colors.rouge-baie-deep}`): body-size text/icons, pressed-state fill, on progress screens. Also the current default domain for any `Button` that hasn't been given an explicit `domain` yet.

### Neutral
- **Cacao Chaud** (`#7A5C34` / `{colors.cacao-chaud}`): anything that isn't domain-specific — settings, generic confirmations, the weight-tracking tab (deliberately paired with the tab bar's own neutral icon rather than the Progress domain).
- **Cacao Chaud Profond** (`#6B4F26` / `{colors.cacao-chaud-deep}`): body-size text/icons, pressed-state fill, on neutral screens.

### Neutral surfaces
- **Crème Chaude** (`#FFFBF5` / `{colors.creme-chaude}`): the base screen background — warmer and lighter than a typical off-white, so the four saturated domain colors read as vivid rather than muddy against it.
- **Blanc Surface** (`#FFFFFF` / `{colors.blanc-surface}`): cards, inputs, anything raised off the base.
- **Pêche Creuse** (`#FFF3E0` / `{colors.peche-creuse}`): recessed or pressed-secondary areas — a soft peach, not gray.
- **Encre Chaude** (`#2E2418` / `{colors.encre-chaude}`): primary text — warm near-black, never cool gray-black.
- **Encre Atténuée** (`#6B5A46` / `{colors.encre-attenuee}`): secondary text, labels, captions. AA-compliant (6.0–6.6:1) on all three surface tones.
- **Encre Discrète** (`#B8A78E` / `{colors.encre-discrete}`): decorative or redundant text only — fails AA **on purpose**. Never use for a label, value, placeholder, or error.
- **Blanc sur Accent** (`#FFFFFF` / `{colors.blanc-sur-accent}`): text/icons sitting on top of a domain-color fill.

### Lines
- **Trait Intérieur** (`#FBEAD3` / `{colors.trait-interieur}`): a divider inside a surface.
- **Trait Extérieur** (`#F0D9B8` / `{colors.trait-exterieur}`): a border around a surface.
- **Trait Renforcé** (`#A67F4C` / `{colors.trait-renforce}`): the one line color required to clear the 3:1 WCAG 1.4.11 threshold for non-text UI components (e.g. a Switch's "off" track) — darker than Trait Extérieur on purpose.

### Status
- **Erreur** (`#DC2626`) / **Erreur Douce** (`#FBEAE7`), **Succès** (`#15803D`) / **Succès Douce** (`#E6F2EA`), **Attention** (`#B45309`) / **Attention Douce** (`#FBF0E2`): unchanged from before the claymorphic system, and not part of its scope.

### Domain vocabulary (finer-grained than the four screen domains)
- **Macro Protéine** (`#C2410C`), **Macro Glucides** (`#0F766E`), **Macro Lipides** (`#4338CA`): a recipe's protein/carbs/fat always keep these three hues, wherever they appear (cards, charts, legends) — never remapped per screen, unlike the four domain colors above which are chosen per-screen.
- **Effort** (`#DC2626`), **Repos** (`#0369A1`): training-intensity vocabulary. Currently unused in any shipped screen — no effort/intensity data exists yet in the exercise/session data model.

### Named Rules
**The One Domain Rule.** A screen that's fundamentally about nutrition uses Ambre Grillé for its accents; a sport screen uses Vert Forêt. Don't mix two domain colors as accents on the same screen without a specific reason — this is the old "the accent is scarce" rule, now applied per-domain instead of per-app.

**The Domain Vocabulary Never Remaps Rule.** Macro Protéine/Glucides/Lipides and Effort/Repos are fixed hues independent of screen domain — a recipe's protein number is always Macro Protéine—colored, even on a Vert Forêt sport screen.

**The Legacy Red Rule.** `accentRed`/`accentRedDeep`/`accentRedSoft` still exist in code as a transitional shim (their values equal Rouge Baie/Rouge Baie Profond, plus a bespoke soft rose) for the handful of screens not yet migrated to explicit domain tokens. Never reach for them in new or touched code — use the domain tokens directly. They are being retired screen-by-screen, not a second, permanent color system.

## Typography

**Display & Body Font:** Fredoka (with system-sans fallback) — one rounded, friendly sans family carrying everything: hero text, screen titles, big numbers, running body copy, and button labels. There is no second family and no serif/sans distinction.

**Character:** Rounded, warm, approachable — the opposite of a clinical health-tracker's neutral grotesk. Weight lives entirely in which Fredoka cut is loaded (`Fredoka_400Regular` / `_500Medium` / `_600SemiBold` / `_700Bold`), never in a separate `fontWeight` property — React Native does not synthesize weights for custom fonts, so mixing `fontFamily` and `fontWeight` silently does nothing.

### Hierarchy
- **hero** (700, 32px/38px, −0.6px): the one thing a screen is fundamentally about — a user's name, a headline moment.
- **display** (700, 26px/32px, −0.4px): screen titles.
- **title** (600, 20px/26px, −0.2px): card titles, section headings that carry weight.
- **metric** (700, 28px/32px, −0.4px): a single big number standing alone (calories, weight). Not for a 3–4-up row of numbers on a phone — it wraps; use `title` there instead.
- **heading** / **subheading** (700/16px and 600/14px): headings inside content.
- **body** / **bodyStrong** (400/14px and 600/14px, 21px line height): running text.
- **label** (700, 14px/18px, +0.1px): buttons, tabs, chips.
- **caption** / **captionStrong** (500/12px and 600/12px): metadata, secondary rows.
- **overline** (700, 10px/14px, +1.2px, uppercase): eyebrows, field labels, step counters. Sets its own uppercase transform — never re-declare it at the call site.

No italic face is loaded; if you want emphasis, change the step or the color, not the style.

### Named Rules
**The One Family Rule.** Fredoka carries every text role in the app. Never introduce a second typeface, and never spread `typography.*` partially — spread the whole role object (`{...typography.title, color: ...}`) so family, size, leading, and tracking always travel together.

## Layout

Screens pad horizontally by `spacing.lg` (16px) and separate sections by `spacing.xl` (24px). Content caps at 560px wide and centers itself (`centeredContent`) — a no-op on phone-width screens, but it keeps text and cards from stretching edge-to-edge on the web/tablet build the same codebase also targets. No breakpoint system beyond that single cap; this is a phone-first layout, not a responsive grid.

## Elevation & Depth

Claymorphic, two parts used together — never one without the other:

1. **Shadow tiers**, all warm-tinted (`#3A2E22`, never pure black) so they read as depth in a puffy material rather than a hard flat drop shadow.
2. **The clay sheen** — a diagonal light-catching gradient overlay laid on top of every raised surface, simulating an inset highlight that React Native's shadow system can't produce natively.

### Shadow Vocabulary
- **subtle** (`shadowColor: #3A2E22, opacity 0.06, radius 10, offset 0/2, elevation 1`): the lightest tier.
- **card** (`shadowColor: #3A2E22, opacity 0.12, radius 18, offset 0/8, elevation 4`): the default for Cards and inputs.
- **raised** (`shadowColor: #3A2E22, opacity 0.18, radius 26, offset 0/12, elevation 8`): buttons and anything meant to feel like it's sitting highest.

### Named Rules
**The Puffy Sheen Rule.** Every raised surface (Card, primary Button) gets a diagonal gradient overlay — lighter top-left catching the light, fading to a faint warm dark bottom-right — sized to fill the surface exactly, with its own matching border radius, and `pointerEvents="none"`. The parent surface never gets `overflow: hidden`, because that would also clip the parent's own drop shadow.

**The Soft-by-Design Rule.** Shadows stay low-opacity on purpose. Deepening a shadow to make an element stand out is the wrong lever here — reach for type weight and spacing first.

## Shapes

Radius is generous everywhere in this system — there is no small, tight-cornered surface anywhere on screen. `sm` (16px) is the smallest radius actually in active use (small cells, inputs). `md`/`lg` (20/26px) cover cards and buttons. `xl` (32px) is for the largest surfaces. `pill` (28px) is for chips and filter tags. `full` (999px) is for circles. `xs` (10px) exists in the scale but isn't used anywhere today — reaching for it is a signal to double-check the surface really needs to look that tight in this direction.

## Components

The interaction character across every component is **ludique et rebondissant** (playful and bouncy) — a visible, springy overshoot on release, not a static snap.

### Buttons
- **Shape:** `rounded.lg` (26px), no hard outline ever.
- **Primary:** filled with the screen's domain color (defaults to Rouge Baie if no `domain` is given), white text (`blanc-sur-accent`), the puffy sheen overlay on top, `shadow.raised` tinted with the domain's `*Deep` color.
- **Secondary:** `blanc-surface` fill, `encre-chaude` text, no sheen overlay, shadow tinted with `encre-chaude` instead of a domain color — a secondary button ignores `domain` entirely regardless of screen context.
- **Pressed:** primary darkens to the domain's `*Deep` fill and squishes to `scale: 0.9`; both animate from the *same* continuously-sprung value so the color-darken and the squish are read as genuinely synchronized on every frame, not two effects merely triggered together.
- **Disabled:** `blanc-surface` fill regardless of variant, `encre-attenuee` label, shadow opacity dropped to near-zero.

### Chips / Choice Pills
- **Style:** unselected = `blanc-surface` fill with `card` shadow; selected = the screen's domain color fill, shadow tinted to match, white text.
- **Press:** the springy scale-only pattern (no color animation on press — only the selected/unselected fill state changes color).
- **Used by:** single-select day/filter tabs (`ChoiceGroup`) and multi-select tag filters (`TagFilterGroup`) — same visual pill, different selection semantics.

### Cards / Containers
- **Corner Style:** `rounded.lg` (26px).
- **Background:** `blanc-surface`, with the puffy sheen overlay.
- **Shadow Strategy:** `shadow.card`.
- **Border:** none.
- **Internal Padding:** `spacing.md` (12px).

### Inputs / Fields
- **Style:** `blanc-surface` fill, `rounded.sm` (16px), 1px `trait-exterieur` border, `shadow.card`.
- **Focus:** border thickens to 2px (currently still the legacy Rouge-Baie-equivalent `accentRed` color, not yet domain-aware) — padding compensates by 1px so the box doesn't visibly jump when the border thickens.
- **Label:** `overline` above the field.

### Navigation (bottom tab bar)
- **Style:** claymorphic raster icons — not tintable vector icons — for each of the 6 destinations, drawn in the same puffy style as the mascot itself. Active/inactive state is conveyed by opacity (full opacity active, `state.disabledOpacity` 0.55 inactive), not by a tint-color swap, since these are static images.
- **Labels:** small caption text under each icon, colored by `encre-chaude`/`encre-attenuee` for active/inactive.

### Mascot (Signature Component)
A stylized cartoon broccoli character with big Pixar-style eyes and coral-orange sneakers — the single most defining element of this design system, and the one place in the app where energy and personality are concentrated. Three poses today:
- **idle** — the default, continuous presence. A slow, perpetual breathing scale-pulse (2.4s full cycle) so it reads as alive even when nothing is happening.
- **celebrating** — a triggered reward moment (milestones, session completion). Bounces in with a pronounced-overshoot spring; resets its scale to the pre-bounce start before re-springing, so switching pose mid-mount always produces a visible bounce rather than a no-op.
- **encouraging** — reassurance after a setback (currently: a failed plan generation). Shares `idle`'s calm breathing rather than bouncing — a triumphant entrance would read as discordant on a setback moment. Must never look mocking, sad, or apologetic.

## Do's and Don'ts

### Do:
- **Do** pull every color, size, radius, shadow, duration, and spring config from `src/theme/tokens.ts` — no exceptions, no inline hex or magic numbers.
- **Do** give every primary `Button` and domain-aware pill an explicit `domain` prop matching the screen's content (nutrition/sport/progress/neutral) rather than relying on the `'progress'` default.
- **Do** give every tappable element a visible pressed state, a minimum 44pt touch size, and an `accessibilityRole`.
- **Do** use the springy, bouncy press feel everywhere (`PressableScale` for chips/cells, `Button`'s own animation for buttons) — it's the deliberate default feel, not a bug to tone down.
- **Do** keep the mascot's `encouraging`/`celebrating` poses as the sole reservoir of exclamation marks and hype language; everywhere else, copy stays sober.
- **Do** name colors and describe components by what they mean in this system (Ambre Grillé, Rouge Baie), not by generic Material role names.

### Don't:
- **Don't** reach for `accentRed`/`accentRedDeep`/`accentRedSoft` in new or touched code — they're a transitional shim, use the domain tokens directly.
- **Don't** mix two domain colors as accents on one screen without a specific reason.
- **Don't** use `fontWeight` anywhere, or pair `fontFamily` with `fontWeight` — weight lives in which Fredoka cut is loaded.
- **Don't** let this system drift toward flat generic SaaS — no thin-bordered flat cards, no blue-violet gradients, no interchangeable "professional tool" look.
- **Don't** deepen a shadow to create emphasis — reach for type weight and spacing first; shadows stay soft and low-opacity by design.
- **Don't** place the mascot in an error state, or give the `encouraging` pose any hint of mockery, sadness, or apology — a failure is never read as the app poking fun at the user.
