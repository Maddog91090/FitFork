---
target: src/app/(tabs)/home.tsx
total_score: 18
max_score: 36
na_heuristics: 10
p0_count: 2
p1_count: 2
timestamp: 2026-08-22T06-54-52Z
slug: src-app-tabs-home-tsx
---
Method: dual-agent (A: general-purpose sub-agent · B: general-purpose sub-agent)

## Design Health Score

| # | Heuristic | Score | Key Issue |
|---|---|---|---|
| 1 | Visibility of System Status | 2/4 | Bare `ActivityIndicator`, no label; notification toggle has no clear success/failure signal |
| 2 | Match Between System and Real World | 3/4 | French copy reads naturally; macro abbreviations (Prot/Lip/Gluc) assume domain literacy |
| 3 | User Control and Freedom | 2/4 | No pull-to-refresh; no undo on sign-out or notification toggle |
| 4 | Consistency and Standards | 2/4 | Two color systems coexist (legacy `lightColors` + `useMaterialColors`/`materialTypography`) — confirmed independently by both assessments |
| 5 | Error Prevention | 2/4 | Sign-out fires immediately, no confirmation |
| 6 | Recognition Rather Than Recall | 2/4 | 10px `overline` section labels; gamification card has zero tap affordance |
| 7 | Flexibility and Efficiency of Use | 1/4 | No workout/sport entry point on the home dashboard of a fitness+nutrition app |
| 8 | Aesthetic and Minimalist Design | 2/4 | Clean but generic; greeting oversized relative to functional content |
| 9 | Help Recognize/Diagnose/Recover from Errors | 2/4 | `ErrorNotice` retries but surfaces raw `err.message` |
| 10 | Help and Documentation | n/a | No help affordance anywhere in the app — reasonable to exclude |
| **Total** | | **18/36** | **Acceptable (50%), at the low edge** |

## Design Specificity Verdict

**LLM assessment**: This screen could be dropped into almost any consumer app with a Card, a greeting, and a settings toggle — nothing reads as "Dualo." No mascot, no honey/plum domain-color washes, no brand warmth. The one surviving personality touch is an emoji (🔥) standing in for iconography. The greeting renders the user's raw email as if it were their name.

**Deterministic scan**: `detect.mjs` confirmed to genuinely support RN/TSX (not just HTML/CSS) — clean run, 0 findings, nothing for the automated side to contradict. Manual code-read (part of Assessment B) independently found the same twin-color-system issue as Assessment A, plus concrete magic numbers Assessment A didn't call out at that granularity: `paddingVertical: spacing.sm + 1`, `mealTypeLabel` fixed `width: 80`, `MacroIcon size={16}` hardcoded, `opacity: 0.85` un-tokenized.

**Visual overlays**: Not applicable — native React Native screen, no browsable URL to inject into. Correctly skipped, not a failed step.

## Overall Impression

Engineering-clean (tokens used correctly, no inline hex, baseline accessibility present) but visually interchangeable — the expected "generic Material 3 migration, not yet caught up to the new Dualo identity" state given where the project is. The biggest gap: this is the screen the user sees every day, and Dualo appears nowhere on it.

## What's Working

- Resilient loading: gamification stats fetch outside the main `Promise.all` so a stats failure can't blank the whole screen.
- The macro row uses `MacroIcon` + hue-coded values for at-a-glance differentiation — the one place domain color actually works.
- Accessibility baseline enforced structurally via `Button` (48dp touch target, `accessibilityRole`), not left to each screen.
- Zero false positives from the detector — clean scan, nothing to discount.

## Priority Issues

1. **[P0] No brand/mascot presence anywhere on the flagship screen.** Why it matters: this is the daily-use screen; it's currently indistinguishable from a boilerplate M3 template. Fix: mascot-led greeting reacting to plan/streak state, replacing the current static greeting. Suggested command: `/impeccable adapt`, `/impeccable delight`.
2. **[P0] Sign-out has no confirmation.** Why it matters: irreversible, no undo, sits in a long scroll where a distracted tap is plausible. Fix: confirmation dialog before sign-out. Suggested command: `/impeccable harden`.
3. **[P1] No workout entry point on home.** Why it matters: all quick actions are nutrition-only; the app is positioned as fitness *and* nutrition, but half the product is invisible from its own dashboard. Fix: add a sport-domain CTA. Suggested command: `/impeccable layout`, `/impeccable clarify`.
4. **[P1] Inverted visual hierarchy.** Why it matters: least-useful content (oversized greeting + raw email) gets the most visual weight; least-useful content out-weighs macro targets and streak. Fix: demote greeting, promote macros/streak. Suggested command: `/impeccable typeset`, `/impeccable bolder`.
5. **[P2] Overloaded, undifferentiated flat layout.** Why it matters: 6+ equal-weight sections, >4 simultaneous tap targets, 7/8 cognitive-load checklist failures (High band). Fix: move notifications/sign-out behind a profile entry point. Suggested command: `/impeccable distill`, `/impeccable quieter`.

## Persona Red Flags

**Jordan (First-Timer)**: the empty-meals card has no CTA inside it; the greeting rendering the raw email reads like a bug on first launch; macro abbreviations have no explainer.

**Sam (Accessibility-Dependent)**: 10px section labels used for all four headers; the gamification `Pressable` has no `accessibilityLabel`, so a screen reader announces "🔥 3", "Série", "Niv. 2" as disconnected fragments, including the emoji vocalized literally; the meal row also lacks a combined `accessibilityLabel`.

**Casey (Distracted Mobile User)**: the sign-out button uses identical `variant="secondary"` styling to benign actions like "Voir mon plan," making it visually indistinguishable during a fast scroll; the notification toggle's silent failure fallback gives no clear success/failure signal.

## Minor Observations

- No `accessibilityLabel` on `MacroIcon` instances.
- `centeredContent`'s 560px web/tablet cap is dead weight — PRODUCT.md states Android-only.
- No `RefreshControl`; freshness depends entirely on tab refocus.
- Magic numbers found in manual read: `spacing.sm + 1`, `mealTypeLabel` `width: 80`, `MacroIcon size={16}`, `opacity: 0.85`.

## Questions to Consider

- What if the mascot reacted to today's plan state (encouraging when empty, celebratory when a streak is active) instead of a static "Bonjour"?
- What if sign-out lived entirely in a Profile screen, letting home end on the meals list or a streak moment instead of an exit door?
- What if "start a workout" and "today's meals" were the only two things visible above the fold, with progression/notifications/sign-out behind one "More" entry?
