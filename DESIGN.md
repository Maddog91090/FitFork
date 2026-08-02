---
name: FitFork
description: A weekly meal + workout planner that generates a matched plan from your goals, not a logging tool
colors:
  vital-red: "#DC2626"
  warm-fog: "#F7F5F2"
  pure-white: "#FFFFFF"
  warm-ink: "#1E1B18"
  soft-taupe: "#9A958D"
  hairline-warm: "#F0ECE3"
typography:
  label:
    fontFamily: "System (SF Pro on iOS, Roboto on Android)"
    fontSize: "11px"
    fontWeight: 700
    lineHeight: "14px"
    letterSpacing: "0.4px"
  body:
    fontFamily: "System (SF Pro on iOS, Roboto on Android)"
    fontSize: "14px"
    fontWeight: 400
    lineHeight: "20px"
    letterSpacing: "0px"
  caption:
    fontFamily: "System (SF Pro on iOS, Roboto on Android)"
    fontSize: "12px"
    fontWeight: 400
    lineHeight: "16px"
    letterSpacing: "0.1px"
  subtitle:
    fontFamily: "System (SF Pro on iOS, Roboto on Android)"
    fontSize: "16px"
    fontWeight: 400
    lineHeight: "22px"
    letterSpacing: "-0.1px"
  title:
    fontFamily: "System (SF Pro on iOS, Roboto on Android)"
    fontSize: "20px"
    fontWeight: 400
    lineHeight: "26px"
    letterSpacing: "-0.3px"
rounded:
  sm: "12px"
  md: "14px"
  lg: "16px"
  pill: "20px"
spacing:
  xs: "4px"
  sm: "8px"
  md: "12px"
  lg: "16px"
  xl: "24px"
components:
  button-primary:
    backgroundColor: "{colors.vital-red}"
    textColor: "{colors.pure-white}"
    typography: "{typography.body}"
    rounded: "{rounded.md}"
    padding: "14px 16px"
  button-secondary:
    backgroundColor: "{colors.pure-white}"
    textColor: "{colors.warm-ink}"
    typography: "{typography.body}"
    rounded: "{rounded.md}"
    padding: "14px 16px"
  button-disabled:
    backgroundColor: "{colors.pure-white}"
    textColor: "{colors.soft-taupe}"
    typography: "{typography.body}"
    rounded: "{rounded.md}"
    padding: "14px 16px"
  card-solid:
    backgroundColor: "{colors.pure-white}"
    rounded: "{rounded.lg}"
    padding: "12px"
  textfield:
    backgroundColor: "{colors.pure-white}"
    textColor: "{colors.warm-ink}"
    typography: "{typography.body}"
    rounded: "{rounded.sm}"
    padding: "12px"
  choicegroup-pill:
    backgroundColor: "{colors.pure-white}"
    textColor: "{colors.warm-ink}"
    typography: "{typography.body}"
    rounded: "{rounded.pill}"
    padding: "10px 14px"
  choicegroup-pill-selected:
    backgroundColor: "{colors.vital-red}"
    textColor: "{colors.pure-white}"
    typography: "{typography.body}"
    rounded: "{rounded.pill}"
    padding: "10px 14px"
---

# Design System: FitFork

## 1. Overview

**Creative North Star: "Warm Glass"**

FitFork's visual system sits at the tension between two things: the warmth of a coach who's rooting for you, and the restraint of Apple-grade native materials. It borrows its material vocabulary from Apple Fitness and Apple Health — soft ambient shadows at rest, real native glass (Liquid Glass via `expo-glass-effect`) for floating chrome, spring-based motion that responds to touch instead of playing a fixed animation — but it never lets that craft read as cold or clinical. The palette is warm off-whites and a single vital red, not slate grays and blue gradients; type never shouts a calorie count at you.

The system explicitly rejects the loud gamification of free fitness apps — streak badges, aggressive notification chrome, flashy stat walls — and the opposite failure mode of a dense manual-logging tool where every screen is a table to fill in. This app plans for the user; the interface should feel like it's handing you a finished week, not asking you to build one.

**Key Characteristics:**
- One committed accent (vital red) against warm neutrals — never a full palette of competing colors.
- Real native materials (glass, springs) reserved for chrome and moments that earn them, not decoration everywhere.
- Numbers (calories, macros, weight) are present but never the loudest thing on any screen.
- Every interactive surface responds on press-down, not on release — the interface feels alive under the finger.

## 2. Colors

The palette is warm-neutral-and-one-accent: a single vital red carries every call-to-action and selected state; everything else is a tight warm-off-white-to-ink neutral ramp.

### Primary
- **Vital Red** (`#DC2626`): the one committed accent. Primary button fill, selected `ChoiceGroup` pill fill, focused `TextField` border, error state. Used sparingly — it marks "this is the action" or "this is selected," never decoration.

### Neutral
- **Warm Fog** (`#F7F5F2`): the base screen background. A warm, barely-there off-white — not a flat white, not a saturated cream.
- **Pure White** (`#FFFFFF`): every elevated surface — cards, buttons, text fields, unselected pills — sits on Pure White against the Warm Fog base, which is what gives cards their lift without needing a heavy shadow.
- **Warm Ink** (`#1E1B18`): primary text. A warm near-black, not a true `#000000` — softer against Warm Fog and Pure White.
- **Soft Taupe** (`#9A958D`): secondary text, placeholders, disabled-state labels.
- **Hairline Warm** (`#F0ECE3`): the one divider/border color used at rest (tab bar top border). Barely visible by design — a hairline, not a rule.

### Named Rules
**The One Accent Rule.** Vital Red is the only saturated color in the system. If a second saturated color feels tempting for a new state (success, warning), reach for weight, motion, or an icon before reaching for a second hue.

## 3. Typography

**Body/Label Font:** System (SF Pro on iOS, Roboto on Android) — no custom font is loaded; the system font already ships correct optical sizing and legibility tuning for each platform.

**Character:** A five-step scale spanning small UI chrome through screen titles, adopted across both the shared component kit and every screen — no screen hand-picks its own font sizes anymore.

### Hierarchy
- **Title** (400, 20px, 26px line-height, -0.3px tracking): screen and section titles — `grocery-list`'s "Liste de courses", `weight-log`'s "Suivi de poids", `recipe/[id]`'s recipe name, `onboarding`'s step titles. The one step with negative tracking, since large text reads too loose at zero or positive tracking.
- **Subtitle** (400, 16px, 22px line-height, -0.1px tracking): emphasis text sitting between body and title — `home`'s macro numbers, the login/signup brand wordmark.
- **Body** (400, 14px, 20px line-height, 0 tracking): the default for every readable string — button labels, `TextField` input text, `ChoiceGroup` pill labels, `EmptyState` titles, most screen paragraph/description text.
- **Caption** (400, 12px, 16px line-height, +0.1px tracking): secondary/supporting copy — `EmptyState` message text, list row metadata, error text. Slightly looser leading and a touch of positive tracking, since small text needs both to stay legible.
- **Label** (700, 11px, 14px line-height, +0.4px tracking, uppercase): field labels and small caps chrome — `TextField`'s field label is the canonical example. The smallest, most positively-tracked step in the scale, on purpose: this is the size where negative or zero tracking starts to read as cramped.

### Named Rules
**The Size-Specific Tracking Rule.** No fixed `letterSpacing` value is reused across sizes. Tracking goes negative as text grows past body (Subtitle, Title) and positive as it shrinks below body (Caption, Label) — matching Apple's own optical-sizing discipline rather than applying one tracking value everywhere.

## 4. Elevation

FitFork uses a hybrid: soft ambient shadows for flat surfaces at rest, and real native glass material for floating chrome — never a hard 1px border as a substitute for either.

### Shadow Vocabulary
- **Card** (`shadowColor: #000000, shadowOpacity: 0.06, shadowRadius: 10, shadowOffset: {0, 2}, elevation: 2`): the default resting shadow for every solid surface — cards, buttons, text fields, pills. Deliberately soft; it reads as "this is a surface," not "this is important."
- **Button (primary)** (`shadowColor: #DC2626, shadowOpacity: 0.25, shadowRadius: 14, shadowOffset: {0, 4}, elevation: 3`): the primary button's shadow is tinted with its own fill color rather than black — a colored glow under the one accent color, heavier than the Card shadow because it's the one surface asking to be pressed.

### Glass Material
- **`GlassSurface`**: wraps `expo-glass-effect`'s native `GlassView` (`glassEffectStyle: "regular"`) for floating chrome — currently the tab bar background, and available as `Card`'s opt-in `glass` variant. Falls back to a flat Pure White + Card shadow surface wherever real glass isn't available: `isGlassEffectAPIAvailable()` is false, or the user has reduce-transparency on. The fallback is not a placeholder — it's the deliberate, permanent behavior for every platform without real glass, so nothing ever ships half-transparent-looking.

### Named Rules
**The Earned Glass Rule.** Real glass material is reserved for chrome that genuinely floats over other content (the tab bar) or surfaces that opt in explicitly (`Card variant="glass"`). It is never the default surface treatment — most cards, buttons, and fields are flat Pure White with a Card shadow, exactly as before glass was introduced.

## 5. Components

Every interactive component responds on press-down (not on release) with a critically-damped spring scale to 0.97, and every state transition (focus, selection) animates rather than snapping — both governed by the same two-preset motion scale: `press` (damping 1.0, response 0.15s — near-instant, for the finger) and `settle` (damping 1.0, response 0.3s — for focus/selection transitions). Both respect the OS-level reduced-motion setting: reduced-motion snaps directly to the target value instead of springing.

### Buttons
- **Shape:** `rounded.md` (14px).
- **Primary:** Vital Red fill, Pure White text, Button shadow. The default call-to-action.
- **Secondary:** Pure White fill, Warm Ink text, Card shadow. Used for a de-emphasized action alongside a primary one.
- **Disabled:** Pure White fill, Soft Taupe text, shadow reduced to near-nothing (`shadowOpacity: 0.04`, `elevation: 0`) — visually recedes rather than grays out.
- **Press feedback:** scales to 0.97 on press-down via the `press` spring preset; springs back to 1 on release.

### Chips (`ChoiceGroup` pills)
- **Style:** `rounded.pill` (20px), Pure White fill with Card shadow when unselected.
- **Selected:** Vital Red fill, Pure White text, Card shadow's color/opacity animate toward the Button shadow values — the selected pill picks up the same colored-glow treatment as the primary button.
- **Transition:** selection change cross-fades background/text/shadow color via the `settle` spring, rather than swapping instantly.
- **Press feedback:** same 0.97 press-scale as buttons.

### Cards / Containers
- **Corner Style:** `rounded.lg` (16px).
- **Background:** Pure White (`solid` variant, default) or `GlassSurface` (`glass` variant, opt-in).
- **Shadow Strategy:** Card shadow in `solid` variant; native glass material (or its Card-shadow fallback) in `glass` variant.
- **Internal Padding:** `spacing.md` (12px).

### Inputs / Fields (`TextField`)
- **Style:** Pure White fill, `rounded.sm` (12px), Card shadow, a permanent 2px border that's transparent at rest — never a border that appears out of nowhere on focus and shifts layout.
- **Focus:** the 2px border animates from transparent to Vital Red via the `settle` spring.
- **Label:** the `label` typography step, uppercase, Soft Taupe.

### Navigation (tab bar)
- **Style:** `GlassSurface` background (real glass, or its Pure White + Card-shadow fallback), Hairline Warm top border, Vital Red for the active tab's icon/label, Soft Taupe for inactive. Sits in normal (non-floating) layout flow today — content stops above it rather than scrolling underneath, a deliberate near-term trade-off (see Do's and Don'ts).

## 6. Do's and Don'ts

### Do:
- **Do** use Vital Red (`#DC2626`) as the only saturated color on any screen — it should always mean "this is the action" or "this is selected."
- **Do** start every press interaction on press-down (`onPressIn`), never wait for release to show feedback.
- **Do** animate state changes (focus, selection) with the `settle` spring instead of an instant style swap.
- **Do** fall back to a flat Pure White + Card shadow surface wherever real glass material isn't available — never ship a half-broken translucent look.
- **Do** respect the OS reduced-motion and reduced-transparency settings on every animated or glass surface.

### Don't:
- **Don't** add a second saturated accent color alongside Vital Red — reach for weight, motion, or an icon instead.
- **Don't** use streak badges, aggressive push-style in-app banners, or flashy stat walls — this is the "loud gamification" anti-reference from PRODUCT.md, and it's explicitly rejected.
- **Don't** build dense manual-logging tables in the MyFitnessPal mold — the app plans for the user; screens should read as "here's your week," not "fill this in."
- **Don't** add a border that only appears on focus/selection and shifts layout — `TextField`'s permanent transparent-to-colored border is the fixed pattern for this.
- **Don't** use real glass material as a decorative default on every surface — it's reserved for floating chrome and explicit opt-in (see the Earned Glass Rule).
