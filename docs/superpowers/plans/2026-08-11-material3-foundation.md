# FitFork — Phase 4: Material 3 Foundation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Introduce a Material 3 color-role token system (light + dark, WCAG-verified) and rebuild the six shared components the `/impeccable audit` flagged (`Button`, `Card`, `ChoiceGroup`, `TagFilterGroup`, `EmptyState`, `TabIcon`) on top of it, plus the `app.json` and `DESIGN.md` changes that follow — with zero changes to any screen under `src/app/`.

**Architecture:** Additive, not destructive. `tokens.ts` gains a second, parallel color system (`lightMaterialColors`/`darkMaterialColors`/`*TertiaryByDomain`/`useMaterialColors`/`useMaterialTertiary`/`materialTypography`/`materialElevation`) alongside the existing claymorphic one (`lightColors`/`useThemeColors`/`typography`/`shadow`/`clayOverlay`), which stays fully intact because ~20 screens and components outside this phase's scope still read it directly. Each of the six components switches its own internals from the old system to the new one; their public prop APIs do not change, so the screens that already import them keep compiling and rendering exactly as before. `PressableScale.tsx` and `motion.spring.snappy` also stay in place unmodified — they still have real out-of-scope consumers (`BackLink.tsx`, `home.tsx`, `workout.tsx`, `workout-session.tsx`, `generate-plan.tsx`) — only the three consumers being rebuilt here (`Button`, `ChoiceGroup`, `TagFilterGroup`) stop using it, replaced by Material's native ripple.

**Tech Stack:** Expo SDK 57, React Native 0.86, TypeScript, `@expo/vector-icons` 15 (already a dependency), `Pressable`'s `android_ripple` prop (native RN, no new dependency), Jest + `jest-expo` + `@testing-library/react-native`.

## Global Constraints

- `npx tsc --noEmit` and `npx jest` must both be clean before any task is considered done.
- No EAS build is triggered automatically at any point.
- WCAG AA contrast (4.5:1 for text, 3:1 for non-text UI) is verified for every new color role, in both light and dark schemes, via a relative-luminance calculation — never eyeballed. Task 1 embeds a runnable derivation script and a permanent Jest regression test for this.
- Every touchable element keeps a `48dp` minimum size (`state.minTouchSize`, already `48`) and an explicit `accessibilityRole`.
- `useReducedMotion` (`src/lib/useReducedMotion.ts`) must keep working. It has no bearing on `android_ripple` (a native OS-level effect that already respects the system's Remove Animations setting on its own), so components that drop Reanimated entirely for ripple do not need to call this hook at all — only components that still animate with Reanimated do.
- **No file under `src/app/` is created, modified, or deleted in this plan.** Every task's file list is scoped to `src/theme/`, `src/components/`, `src/lib/`, `src/__tests__/`, `app.json`, and `DESIGN.md`.
- `PressableScale.tsx`, `motion.spring.snappy`, and `motion.spring.celebrate` are not deleted or renamed anywhere in this plan.
- `lightColors`, `useThemeColors`, `typography`, `shadow`, `clayOverlay` in `src/theme/tokens.ts` are not deleted, renamed, or altered in value — only added to.

---

### Reference data used across tasks

**Light Material roles** (relabeling existing hex values already in `lightColors` — no new colors invented):

| Role | Hex | Source |
| --- | --- | --- |
| `background` | `#FFFBF5` | `lightColors.bgBase` |
| `onBackground` | `#2E2418` | `lightColors.textPrimary` |
| `surface` | `#FFFFFF` | `lightColors.bgSurface` |
| `onSurface` | `#2E2418` | `lightColors.textPrimary` |
| `surfaceVariant` | `#FFF3E0` | `lightColors.bgSunken` |
| `onSurfaceVariant` | `#6B5A46` | `lightColors.textSecondary` |
| `outline` | `#A67F4C` | `lightColors.borderStrong` |
| `outlineVariant` | `#F0D9B8` | `lightColors.border` |
| `primary` | `#7A5C34` | Cacao Chaud |
| `onPrimary` | `#FFFFFF` | — |
| `primaryContainer` | `#6B4F26` | Cacao Chaud Profond |
| `onPrimaryContainer` | `#FFFFFF` | — |
| `error` | `#DC2626` | `lightColors.error` |
| `onError` | `#FFFFFF` | — |
| `errorContainer` | `#FBEAE7` | `lightColors.errorSoft` |
| `onErrorContainer` | `#DC2626` | `lightColors.error` |

**Light tertiary-by-domain** (relabeling `domainX`/`domainXDeep`):

| Domain | `tertiary` | `onTertiary` | `tertiaryContainer` | `onTertiaryContainer` |
| --- | --- | --- | --- | --- |
| nutrition | `#B25900` | `#FFFFFF` | `#8A5200` | `#FFFFFF` |
| sport | `#187A57` | `#FFFFFF` | `#0E4F38` | `#FFFFFF` |
| progress | `#C2325A` | `#FFFFFF` | `#A31C42` | `#FFFFFF` |
| neutral | `#7A5C34` | `#FFFFFF` | `#6B4F26` | `#FFFFFF` |

**Dark Material roles and dark tertiary-by-domain** — computed in Task 1 by the embedded script from the same source hues (Encre Chaude `#2E2418` for the neutral/ink family, Cacao Chaud `#7A5C34` for primary, the four domain hues for tertiary, `#DC2626` for error), using the tonal-inversion method the spec describes (container ≈20-25% lightness, on-container ≈80-85% lightness, both HSL-lightness rotations of the *same* hue as the light source color — never a different hue). Exact values and their verified contrast ratios:

| Role | Hex | Contrast vs. its pair | Ratio |
| --- | --- | --- | --- |
| `background` | `#17120C` | — | — |
| `onBackground` | `#EEE6DD` | vs `background` | 15.07 |
| `surface` | `#2C2217` | — | — |
| `onSurface` | `#EEE6DD` | vs `surface` | 12.61 |
| `surfaceVariant` | `#433423` | — | — |
| `onSurfaceVariant` | `#D5C4AF` | vs `surfaceVariant` | 7.04 |
| `outline` | `#A88357` | vs `background` | 5.36 |
| `outlineVariant` | `#654F34` | — | — |
| `primary` | `#D4BC9B` | vs `background` | 10.16 |
| `onPrimary` | `#322615` | vs `primary` | — (not a text-on-fill pair in current usage) |
| `primaryContainer` | `#4F3B22` | — | — |
| `onPrimaryContainer` | `#E8DBC9` | vs `primaryContainer` | 7.78 |
| `error` | `#E87272` | vs `background` | 6.28 |
| `onError` | `#3D0A0A` | vs `error` | 5.68 |
| `errorContainer` | `#611010` | — | — |
| `onErrorContainer` | `#F4BDBD` | vs `errorContainer` | 8.09 |

| Domain | `tertiary` | `onTertiary` | `tertiaryContainer` | `onTertiaryContainer` | contrast (onTertiaryContainer/tertiaryContainer) | contrast (tertiary/background) |
| --- | --- | --- | --- | --- | --- | --- |
| nutrition | `#FFB870` | `#472400` | `#703800` | `#FFD9B3` | 7.02 | 10.94 |
| sport | `#88E8C5` | `#0C3C2B` | `#125E43` | `#BFF2E0` | 6.28 | 12.76 |
| progress | `#E28DA5` | `#390F1A` | `#591729` | `#EFC2CF` | 8.41 | 7.61 |
| neutral | `#D4BC9B` | `#322615` | `#4F3B22` | `#E8DBC9` | 7.78 | 10.16 |

Every ratio above clears its required threshold (4.5:1 text-on-fill pairs, 3:1 for `outline`/`primary`/`tertiary` used as non-text accents against `background`).

---

### Task 1: Material color and typography tokens

**Files:**
- Modify: `src/theme/tokens.ts` (append only — no existing export is touched)
- Test: `src/__tests__/materialColors.test.ts` (new)
- Create then delete: `scripts/derive-material-dark.js` (one-off derivation script, not shipped)

**Interfaces:**
- Consumes: nothing from earlier tasks (this is the foundation task).
- Produces (all later tasks depend on these exact names):
  - `export type MaterialColorScheme = { background, onBackground, surface, onSurface, surfaceVariant, onSurfaceVariant, outline, outlineVariant, primary, onPrimary, primaryContainer, onPrimaryContainer, error, onError, errorContainer, onErrorContainer }` (all `string`)
  - `export const lightMaterialColors: MaterialColorScheme`
  - `export const darkMaterialColors: MaterialColorScheme`
  - `export type MaterialDomain = 'nutrition' | 'sport' | 'progress' | 'neutral'`
  - `export type MaterialTertiary = { tertiary: string; onTertiary: string; tertiaryContainer: string; onTertiaryContainer: string }`
  - `export const lightTertiaryByDomain: Record<MaterialDomain, MaterialTertiary>`
  - `export const darkTertiaryByDomain: Record<MaterialDomain, MaterialTertiary>`
  - `export function useMaterialColors(): MaterialColorScheme` (reads `useColorScheme()` from `react-native`; `'dark'` → dark set, anything else → light set)
  - `export function useMaterialTertiary(domain: MaterialDomain = 'progress'): MaterialTertiary` (same scheme switch)
  - `export const materialTypography` — object with keys `displayLarge, displayMedium, titleLarge, headlineLarge, titleMedium, titleSmall, bodyLarge, bodyMedium, labelLarge, labelMedium, labelSmall, overline`, each aliasing an existing `typography.*` entry (no new size/weight values)
  - `export const materialElevation` — single shadow descriptor, neutral (not warm-tinted like `shadow.*`)

- [ ] **Step 1: Write the WCAG derivation script**

Create `scripts/derive-material-dark.js`:

```js
function hexToRgb(hex) {
  const n = parseInt(hex.slice(1), 16);
  return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
}
function rgbToHex(r, g, b) {
  return '#' + [r, g, b].map((v) => Math.round(Math.min(255, Math.max(0, v))).toString(16).padStart(2, '0')).join('').toUpperCase();
}
function rgbToHsl(r, g, b) {
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h, s, l = (max + min) / 2;
  if (max === min) { h = s = 0; }
  else {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break;
      case g: h = (b - r) / d + 2; break;
      default: h = (r - g) / d + 4; break;
    }
    h /= 6;
  }
  return { h, s, l };
}
function hslToRgb(h, s, l) {
  let r, g, b;
  if (s === 0) { r = g = b = l; }
  else {
    const hue2rgb = (p, q, t) => {
      if (t < 0) t += 1;
      if (t > 1) t -= 1;
      if (t < 1 / 6) return p + (q - p) * 6 * t;
      if (t < 1 / 2) return q;
      if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
      return p;
    };
    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;
    r = hue2rgb(p, q, h + 1 / 3);
    g = hue2rgb(p, q, h);
    b = hue2rgb(p, q, h - 1 / 3);
  }
  return { r: r * 255, g: g * 255, b: b * 255 };
}
function setLightness(hex, targetL) {
  const { r, g, b } = hexToRgb(hex);
  const { h, s } = rgbToHsl(r, g, b);
  const { r: nr, g: ng, b: nb } = hslToRgb(h, s, targetL);
  return rgbToHex(nr, ng, nb);
}
function relLuminance({ r, g, b }) {
  const [rs, gs, bs] = [r, g, b].map((c) => {
    c /= 255;
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
}
function contrastRatio(hex1, hex2) {
  const l1 = relLuminance(hexToRgb(hex1));
  const l2 = relLuminance(hexToRgb(hex2));
  const [lighter, darker] = l1 > l2 ? [l1, l2] : [l2, l1];
  return (lighter + 0.05) / (darker + 0.05);
}

const INK = '#2E2418';
const CACAO = '#7A5C34';
const domainHues = { nutrition: '#B25900', sport: '#187A57', progress: '#C2325A', neutral: '#7A5C34' };

const dark = {
  background: setLightness(INK, 0.07),
  onBackground: setLightness(INK, 0.90),
  surface: setLightness(INK, 0.13),
  onSurface: setLightness(INK, 0.90),
  surfaceVariant: setLightness(INK, 0.20),
  onSurfaceVariant: setLightness(INK, 0.76),
  outline: setLightness(INK, 0.50),
  outlineVariant: setLightness(INK, 0.30),
  primary: setLightness(CACAO, 0.72),
  onPrimary: setLightness(CACAO, 0.14),
  primaryContainer: setLightness(CACAO, 0.22),
  onPrimaryContainer: setLightness(CACAO, 0.85),
  error: setLightness('#DC2626', 0.68),
  onError: setLightness('#DC2626', 0.14),
  errorContainer: setLightness('#DC2626', 0.22),
  onErrorContainer: setLightness('#DC2626', 0.85),
};

const darkTertiary = {};
for (const [name, hex] of Object.entries(domainHues)) {
  darkTertiary[name] = {
    tertiary: setLightness(hex, 0.72),
    onTertiary: setLightness(hex, 0.14),
    tertiaryContainer: setLightness(hex, 0.22),
    onTertiaryContainer: setLightness(hex, 0.85),
  };
}

console.log(JSON.stringify({ dark, darkTertiary }, null, 2));
console.log('\n--- Contrast verification (must be >=4.5 for text pairs, >=3 for outline/primary/tertiary vs background) ---');
console.log('onBackground/background:', contrastRatio(dark.onBackground, dark.background).toFixed(2));
console.log('onSurface/surface:', contrastRatio(dark.onSurface, dark.surface).toFixed(2));
console.log('onSurfaceVariant/surfaceVariant:', contrastRatio(dark.onSurfaceVariant, dark.surfaceVariant).toFixed(2));
console.log('outline/background:', contrastRatio(dark.outline, dark.background).toFixed(2));
console.log('primary/background:', contrastRatio(dark.primary, dark.background).toFixed(2));
console.log('onPrimaryContainer/primaryContainer:', contrastRatio(dark.onPrimaryContainer, dark.primaryContainer).toFixed(2));
console.log('onError/error:', contrastRatio(dark.onError, dark.error).toFixed(2));
console.log('onErrorContainer/errorContainer:', contrastRatio(dark.onErrorContainer, dark.errorContainer).toFixed(2));
console.log('error/background:', contrastRatio(dark.error, dark.background).toFixed(2));
for (const [name, v] of Object.entries(darkTertiary)) {
  console.log(
    name,
    'onTertiaryContainer/tertiaryContainer:', contrastRatio(v.onTertiaryContainer, v.tertiaryContainer).toFixed(2),
    '| tertiary/background:', contrastRatio(v.tertiary, dark.background).toFixed(2)
  );
}
```

- [ ] **Step 2: Run the script and verify its output matches the reference table**

Run: `node scripts/derive-material-dark.js`
Expected: the printed `dark`/`darkTertiary` JSON matches the "Reference data" section above exactly, and every printed contrast line reads `4.xx` or higher (text pairs) / `3.xx` or higher (outline/primary/tertiary vs background) — all comfortably above those floors per the reference table (5.36-15.07).

- [ ] **Step 3: Delete the script**

Run: `rm scripts/derive-material-dark.js` (or delete the `scripts/` directory if this created it and nothing else lives there). It is a one-off derivation aid, not shipped code.

- [ ] **Step 4: Append the new tokens to `src/theme/tokens.ts`**

Add this import at the top of the file (the file currently has none — it is intentionally dependency-free per its own doc comment; this is the first and only new dependency, needed only inside the two hooks below):

```ts
import { useColorScheme } from 'react-native';
```

Append at the end of the file, after the existing `state` export:

```ts
/**
 * Material 3 color roles — added alongside `lightColors`/`useThemeColors`
 * rather than replacing them, because ~20 screens outside this phase's scope
 * still read the claymorphic tokens directly. Fixed roles (background,
 * surface, outline, primary, error) never change per screen; `tertiary` is
 * the one swappable role, selected per screen via `useMaterialTertiary`.
 */
export type MaterialColorScheme = {
  background: string;
  onBackground: string;
  surface: string;
  onSurface: string;
  surfaceVariant: string;
  onSurfaceVariant: string;
  outline: string;
  outlineVariant: string;
  primary: string;
  onPrimary: string;
  primaryContainer: string;
  onPrimaryContainer: string;
  error: string;
  onError: string;
  errorContainer: string;
  onErrorContainer: string;
};

export const lightMaterialColors: MaterialColorScheme = {
  background: lightColors.bgBase,
  onBackground: lightColors.textPrimary,
  surface: lightColors.bgSurface,
  onSurface: lightColors.textPrimary,
  surfaceVariant: lightColors.bgSunken,
  onSurfaceVariant: lightColors.textSecondary,
  outline: lightColors.borderStrong,
  outlineVariant: lightColors.border,
  primary: '#7A5C34',
  onPrimary: '#FFFFFF',
  primaryContainer: '#6B4F26',
  onPrimaryContainer: '#FFFFFF',
  error: lightColors.error,
  onError: '#FFFFFF',
  errorContainer: lightColors.errorSoft,
  onErrorContainer: lightColors.error,
};

/**
 * Derived by `scripts/derive-material-dark.js` (deleted after use — see
 * Phase 4 plan Task 1) via Material's tonal-inversion method: each
 * container is a ~20-25%-lightness rotation of the same hue as its light
 * source color, and its on-container pair is a ~80-85%-lightness rotation
 * of that same hue — never a different hue. Every pair clears WCAG AA
 * (4.5:1 text, 3:1 non-text); see the Phase 4 plan's reference table for
 * the exact verified ratios.
 */
export const darkMaterialColors: MaterialColorScheme = {
  background: '#17120C',
  onBackground: '#EEE6DD',
  surface: '#2C2217',
  onSurface: '#EEE6DD',
  surfaceVariant: '#433423',
  onSurfaceVariant: '#D5C4AF',
  outline: '#A88357',
  outlineVariant: '#654F34',
  primary: '#D4BC9B',
  onPrimary: '#322615',
  primaryContainer: '#4F3B22',
  onPrimaryContainer: '#E8DBC9',
  error: '#E87272',
  onError: '#3D0A0A',
  errorContainer: '#611010',
  onErrorContainer: '#F4BDBD',
};

export type MaterialDomain = 'nutrition' | 'sport' | 'progress' | 'neutral';

export type MaterialTertiary = {
  tertiary: string;
  onTertiary: string;
  tertiaryContainer: string;
  onTertiaryContainer: string;
};

/** Same hex values as `domainX`/`domainXDeep` — a role rename, not new colors. */
export const lightTertiaryByDomain: Record<MaterialDomain, MaterialTertiary> = {
  nutrition: { tertiary: '#B25900', onTertiary: '#FFFFFF', tertiaryContainer: '#8A5200', onTertiaryContainer: '#FFFFFF' },
  sport: { tertiary: '#187A57', onTertiary: '#FFFFFF', tertiaryContainer: '#0E4F38', onTertiaryContainer: '#FFFFFF' },
  progress: { tertiary: '#C2325A', onTertiary: '#FFFFFF', tertiaryContainer: '#A31C42', onTertiaryContainer: '#FFFFFF' },
  neutral: { tertiary: '#7A5C34', onTertiary: '#FFFFFF', tertiaryContainer: '#6B4F26', onTertiaryContainer: '#FFFFFF' },
};

export const darkTertiaryByDomain: Record<MaterialDomain, MaterialTertiary> = {
  nutrition: { tertiary: '#FFB870', onTertiary: '#472400', tertiaryContainer: '#703800', onTertiaryContainer: '#FFD9B3' },
  sport: { tertiary: '#88E8C5', onTertiary: '#0C3C2B', tertiaryContainer: '#125E43', onTertiaryContainer: '#BFF2E0' },
  progress: { tertiary: '#E28DA5', onTertiary: '#390F1A', tertiaryContainer: '#591729', onTertiaryContainer: '#EFC2CF' },
  neutral: { tertiary: '#D4BC9B', onTertiary: '#322615', tertiaryContainer: '#4F3B22', onTertiaryContainer: '#E8DBC9' },
};

/** `userInterfaceStyle` is `"automatic"` in app.json as of this phase, so this genuinely switches with the system setting. */
export function useMaterialColors(): MaterialColorScheme {
  const scheme = useColorScheme();
  return scheme === 'dark' ? darkMaterialColors : lightMaterialColors;
}

export function useMaterialTertiary(domain: MaterialDomain = 'progress'): MaterialTertiary {
  const scheme = useColorScheme();
  return scheme === 'dark' ? darkTertiaryByDomain[domain] : lightTertiaryByDomain[domain];
}

/**
 * Material type-scale aliases for the 12 existing `typography.*` roles —
 * same family/size/lineHeight/letterSpacing, only the key names change, so
 * a change to `typography.body` still flows through automatically.
 * `overline` has no canonical Material 3 slot (the label scale only goes to
 * `labelSmall`) and is kept as a documented custom addition, same as
 * Material itself allows.
 */
export const materialTypography = {
  displayLarge: typography.hero,
  displayMedium: typography.display,
  titleLarge: typography.title,
  headlineLarge: typography.metric,
  titleMedium: typography.heading,
  titleSmall: typography.subheading,
  bodyLarge: typography.body,
  bodyMedium: typography.bodyStrong,
  labelLarge: typography.label,
  labelMedium: typography.caption,
  labelSmall: typography.captionStrong,
  overline: typography.overline,
} as const;

/**
 * Single-tier Material elevation for the rebuilt `Card` — neutral black-
 * based, unlike claymorphic `shadow.*`'s warm `#3A2E22` tint, matching how
 * Material's own elevation shadows are neutral rather than brand-tinted.
 */
export const materialElevation = {
  shadowColor: '#000000',
  shadowOpacity: 0.16,
  shadowRadius: 6,
  shadowOffset: { width: 0, height: 2 },
  elevation: 2,
} as const;
```

- [ ] **Step 5: Write the WCAG contrast regression test**

Create `src/__tests__/materialColors.test.ts`:

```ts
import {
  lightMaterialColors,
  darkMaterialColors,
  lightTertiaryByDomain,
  darkTertiaryByDomain,
  type MaterialDomain,
} from '../theme/tokens';

function hexToRgb(hex: string) {
  const n = parseInt(hex.slice(1), 16);
  return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
}
function relLuminance({ r, g, b }: { r: number; g: number; b: number }) {
  const [rs, gs, bs] = [r, g, b].map((c) => {
    c /= 255;
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
}
function contrastRatio(hex1: string, hex2: string) {
  const l1 = relLuminance(hexToRgb(hex1));
  const l2 = relLuminance(hexToRgb(hex2));
  const [lighter, darker] = l1 > l2 ? [l1, l2] : [l2, l1];
  return (lighter + 0.05) / (darker + 0.05);
}

const DOMAINS: MaterialDomain[] = ['nutrition', 'sport', 'progress', 'neutral'];

describe('Material color contrast (WCAG AA)', () => {
  it.each([
    ['light', lightMaterialColors],
    ['dark', darkMaterialColors],
  ] as const)('%s: text pairs clear 4.5:1', (_name, scheme) => {
    expect(contrastRatio(scheme.onBackground, scheme.background)).toBeGreaterThanOrEqual(4.5);
    expect(contrastRatio(scheme.onSurface, scheme.surface)).toBeGreaterThanOrEqual(4.5);
    expect(contrastRatio(scheme.onSurfaceVariant, scheme.surfaceVariant)).toBeGreaterThanOrEqual(4.5);
    expect(contrastRatio(scheme.onPrimaryContainer, scheme.primaryContainer)).toBeGreaterThanOrEqual(4.5);
    expect(contrastRatio(scheme.onErrorContainer, scheme.errorContainer)).toBeGreaterThanOrEqual(4.5);
  });

  it.each([
    ['light', lightMaterialColors],
    ['dark', darkMaterialColors],
  ] as const)('%s: outline and primary clear 3:1 against background', (_name, scheme) => {
    expect(contrastRatio(scheme.outline, scheme.background)).toBeGreaterThanOrEqual(3);
    expect(contrastRatio(scheme.primary, scheme.background)).toBeGreaterThanOrEqual(3);
  });

  it.each(DOMAINS)('light %s: onTertiaryContainer clears 4.5:1 on tertiaryContainer', (domain) => {
    const t = lightTertiaryByDomain[domain];
    expect(contrastRatio(t.onTertiaryContainer, t.tertiaryContainer)).toBeGreaterThanOrEqual(4.5);
  });

  it.each(DOMAINS)('dark %s: onTertiaryContainer clears 4.5:1 on tertiaryContainer', (domain) => {
    const t = darkTertiaryByDomain[domain];
    expect(contrastRatio(t.onTertiaryContainer, t.tertiaryContainer)).toBeGreaterThanOrEqual(4.5);
  });

  it.each(DOMAINS)('dark %s: tertiary clears 3:1 against dark background', (domain) => {
    const t = darkTertiaryByDomain[domain];
    expect(contrastRatio(t.tertiary, darkMaterialColors.background)).toBeGreaterThanOrEqual(3);
  });
});
```

- [ ] **Step 6: Run the tests and typecheck**

Run: `npx jest src/__tests__/materialColors.test.ts`
Expected: all tests pass (12 assertions across the `it.each` blocks).

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 7: Commit**

```bash
git add src/theme/tokens.ts src/__tests__/materialColors.test.ts
git commit -m "feat: add Material 3 color and typography tokens (light + dark)"
```

---

### Task 2: Rebuild `Button` as Material Filled/Outlined with ripple

**Files:**
- Modify: `src/components/ui/Button.tsx`
- Modify: `src/__tests__/Button.test.tsx`

**Interfaces:**
- Consumes: `useMaterialColors`, `useMaterialTertiary`, `MaterialColorScheme`, `MaterialDomain`, `MaterialTertiary`, `materialTypography` (Task 1).
- Produces: `export type ButtonDomain = MaterialDomain` (re-export, so every existing importer of `ButtonDomain` from `./ui/Button` — `EmptyState.tsx`, `ChoiceGroup.tsx`, `TagFilterGroup.tsx`, `choicePillStyles.ts`, and out-of-scope screens — keeps compiling unchanged). `ButtonProps` keeps the exact same shape (`title`, `onPress`, `variant?: 'primary' | 'secondary'`, `domain?`, `disabled?`, `loading?`) and `testID="button-pressable"`.

- [ ] **Step 1: Rewrite the failing/changed tests first**

Replace `src/__tests__/Button.test.tsx` in full:

```tsx
import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { StyleSheet } from 'react-native';
import { lightTertiaryByDomain } from '../theme/tokens';
import { Button } from '../components/ui/Button';

describe('Button', () => {
  it('renders the title', async () => {
    const { getByText } = await render(<Button title="Continuer" onPress={() => {}} />);
    expect(getByText('Continuer')).toBeTruthy();
  });

  it('calls onPress when pressed', async () => {
    const onPress = jest.fn();
    const { getByText } = await render(<Button title="Continuer" onPress={onPress} />);
    fireEvent.press(getByText('Continuer'));
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('does not call onPress when disabled', async () => {
    const onPress = jest.fn();
    const { getByText } = await render(<Button title="Continuer" onPress={onPress} disabled />);
    fireEvent.press(getByText('Continuer'));
    expect(onPress).not.toHaveBeenCalled();
  });

  it('shows a spinner and hides the label when loading', async () => {
    const { queryByText } = await render(<Button title="Continuer" onPress={() => {}} loading />);
    expect(queryByText('Continuer')).toBeNull();
  });

  it('fills a primary button with its domain tertiary color', async () => {
    const { getByTestId } = await render(<Button title="Continuer" onPress={() => {}} domain="sport" />);
    const style = StyleSheet.flatten(getByTestId('button-pressable').props.style);
    expect(style.backgroundColor).toBe(lightTertiaryByDomain.sport.tertiary);
  });

  it('defaults to the progress domain when none is given', async () => {
    const { getByTestId } = await render(<Button title="Continuer" onPress={() => {}} />);
    const style = StyleSheet.flatten(getByTestId('button-pressable').props.style);
    expect(style.backgroundColor).toBe(lightTertiaryByDomain.progress.tertiary);
  });

  it('renders transparent with an outline border for the secondary variant', async () => {
    const { getByTestId } = await render(<Button title="Continuer" onPress={() => {}} variant="secondary" />);
    const style = StyleSheet.flatten(getByTestId('button-pressable').props.style);
    expect(style.backgroundColor).toBe('transparent');
    expect(style.borderWidth).toBe(1);
  });
});
```

- [ ] **Step 2: Run the tests to see them fail**

Run: `npx jest src/__tests__/Button.test.tsx`
Expected: FAIL — `lightTertiaryByDomain` import resolves (Task 1 is done), but `Button` still renders the old claymorphic markup, so `backgroundColor` assertions read the old `domainX` values reinterpreted incorrectly, or the component throws on `AnimatedPressable`. Either way, red.

- [ ] **Step 3: Rewrite `src/components/ui/Button.tsx` in full**

```tsx
import { useMemo } from 'react';
import { Pressable, Text, ActivityIndicator, StyleSheet } from 'react-native';
import {
  materialTypography,
  radius,
  spacing,
  state,
  useMaterialColors,
  useMaterialTertiary,
  type MaterialColorScheme,
  type MaterialDomain,
  type MaterialTertiary,
} from '../../theme/tokens';

type ButtonVariant = 'primary' | 'secondary';
export type ButtonDomain = MaterialDomain;

type ButtonProps = {
  title: string;
  onPress: () => void;
  /** `'primary'` = Filled (fills with the domain's `tertiary`). `'secondary'` = Outlined (transparent, `outline` border). */
  variant?: ButtonVariant;
  /** Which domain's tertiary color fills the button. Ignored for variant="secondary" except for its border/label tint. */
  domain?: ButtonDomain;
  disabled?: boolean;
  loading?: boolean;
};

export function Button({
  title,
  onPress,
  variant = 'primary',
  domain = 'progress',
  disabled = false,
  loading = false,
}: ButtonProps) {
  const colors = useMaterialColors();
  const tertiary = useMaterialTertiary(domain);
  const styles = useMemo(() => createStyles(colors, tertiary, variant), [colors, tertiary, variant]);
  const isDisabled = disabled || loading;

  return (
    <Pressable
      testID="button-pressable"
      onPress={onPress}
      disabled={isDisabled}
      accessibilityRole="button"
      accessibilityState={{ disabled: isDisabled, busy: loading }}
      android_ripple={{
        color: variant === 'primary' ? tertiary.onTertiary + '1F' : tertiary.tertiary + '1F',
      }}
      style={[styles.base, isDisabled && styles.disabledBase]}
    >
      {loading ? (
        <ActivityIndicator color={variant === 'primary' ? tertiary.onTertiary : colors.onSurface} />
      ) : (
        <Text style={[styles.label, isDisabled && styles.labelDisabled]}>{title}</Text>
      )}
    </Pressable>
  );
}

function createStyles(colors: MaterialColorScheme, tertiary: MaterialTertiary, variant: ButtonVariant) {
  return StyleSheet.create({
    base: {
      borderRadius: radius.lg,
      paddingVertical: spacing.md + 2,
      paddingHorizontal: spacing.lg,
      minHeight: state.minTouchSize,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: variant === 'primary' ? tertiary.tertiary : 'transparent',
      borderWidth: variant === 'secondary' ? 1 : 0,
      borderColor: variant === 'secondary' ? colors.outline : 'transparent',
    },
    disabledBase: {
      backgroundColor: variant === 'primary' ? colors.surfaceVariant : 'transparent',
      borderColor: variant === 'secondary' ? colors.outlineVariant : 'transparent',
    },
    label: {
      ...materialTypography.labelLarge,
      color: variant === 'primary' ? tertiary.onTertiary : colors.onSurface,
    },
    labelDisabled: {
      color: colors.onSurfaceVariant,
    },
  });
}
```

Note what this drops versus the old file: `react-native-reanimated` (`Animated`, `useSharedValue`, `useAnimatedStyle`, `withSpring`, `interpolateColor`), `expo-linear-gradient`, `clayOverlay`, `shadow`, `useReducedMotion` — none are needed once feedback comes from the native ripple instead of a driven spring value.

- [ ] **Step 4: Run the tests to see them pass**

Run: `npx jest src/__tests__/Button.test.tsx`
Expected: PASS (7 tests).

- [ ] **Step 5: Typecheck**

Run: `npx tsc --noEmit`
Expected: no errors — confirms `EmptyState.tsx`, `ChoiceGroup.tsx`, `TagFilterGroup.tsx`, `choicePillStyles.ts`, and every out-of-scope screen importing `ButtonDomain` or `<Button>` still typecheck against the new file.

- [ ] **Step 6: Commit**

```bash
git add src/components/ui/Button.tsx src/__tests__/Button.test.tsx
git commit -m "feat: rebuild Button as Material Filled/Outlined with ripple"
```

---

### Task 3: Rebuild `Card` as a Material elevated card

**Files:**
- Modify: `src/components/ui/Card.tsx`
- Modify: `src/__tests__/Card.test.tsx`

**Interfaces:**
- Consumes: `useMaterialColors`, `MaterialColorScheme`, `materialElevation` (Task 1).
- Produces: `CardProps` unchanged (`{ children, style? }`), so `EmptyState.tsx` (wraps `Card` internally, Task 6) and every out-of-scope screen using `<Card>` keep compiling.

- [ ] **Step 1: Rewrite the test**

Replace `src/__tests__/Card.test.tsx` in full:

```tsx
import React from 'react';
import { render } from '@testing-library/react-native';
import { Text } from 'react-native';
import { Card } from '../components/ui/Card';

describe('Card', () => {
  it('renders its children', async () => {
    const { getByText } = await render(
      <Card>
        <Text>Contenu</Text>
      </Card>
    );
    expect(getByText('Contenu')).toBeTruthy();
  });
});
```

- [ ] **Step 2: Run the test to see the old assertion is gone and the remaining one still passes against the old component**

Run: `npx jest src/__tests__/Card.test.tsx`
Expected: PASS (the "renders its children" behavior doesn't change) — this task's real verification is Step 4 confirming the rewritten component still passes it and Step 5's typecheck.

- [ ] **Step 3: Rewrite `src/components/ui/Card.tsx` in full**

```tsx
import { useMemo } from 'react';
import { View, StyleSheet, type ViewStyle, type StyleProp } from 'react-native';
import { materialElevation, radius, spacing, useMaterialColors, type MaterialColorScheme } from '../../theme/tokens';

type CardProps = {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
};

export function Card({ children, style }: CardProps) {
  const colors = useMaterialColors();
  const styles = useMemo(() => createStyles(colors), [colors]);
  return <View style={[styles.card, style]}>{children}</View>;
}

function createStyles(colors: MaterialColorScheme) {
  return StyleSheet.create({
    card: {
      backgroundColor: colors.surface,
      borderRadius: radius.lg,
      padding: spacing.md,
      ...materialElevation,
    },
  });
}
```

- [ ] **Step 4: Run the test again**

Run: `npx jest src/__tests__/Card.test.tsx`
Expected: PASS.

- [ ] **Step 5: Typecheck**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 6: Commit**

```bash
git add src/components/ui/Card.tsx src/__tests__/Card.test.tsx
git commit -m "feat: rebuild Card as a Material elevated card"
```

---

### Task 4: Rebuild `choicePillStyles` and `ChoiceGroup` as a Material filter chip

**Files:**
- Modify: `src/components/choicePillStyles.ts`
- Modify: `src/components/ChoiceGroup.tsx`
- Modify: `src/__tests__/ChoiceGroup.test.tsx`

**Interfaces:**
- Consumes: `useMaterialTertiary`, `MaterialTertiary`, `materialTypography` (Task 1); `ButtonDomain` (Task 2, re-exported `MaterialDomain`).
- Produces: `createPillStyles(tertiary: MaterialTertiary)` (signature change — was `createPillStyles(colors: ThemeColors, domain?: ButtonDomain)`; Task 5's `TagFilterGroup` calls the new signature). `ChoiceGroupProps<T>` unchanged (`options`, `value`, `onChange`, `domain?`). `ChoiceOption<T>` unchanged (still exported from this file — `TagFilterGroup.tsx` imports it from here).

- [ ] **Step 1: Rewrite the test**

Replace `src/__tests__/ChoiceGroup.test.tsx` in full:

```tsx
import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { StyleSheet } from 'react-native';
import { lightTertiaryByDomain } from '../theme/tokens';
import { ChoiceGroup } from '../components/ChoiceGroup';

const OPTIONS = [
  { value: 'a', label: 'A' },
  { value: 'b', label: 'B' },
];

describe('ChoiceGroup', () => {
  it('renders every option and calls onChange with the pressed value', async () => {
    const onChange = jest.fn();
    const { getByText } = await render(<ChoiceGroup options={OPTIONS} value="a" onChange={onChange} />);
    fireEvent.press(getByText('B'));
    expect(onChange).toHaveBeenCalledWith('b');
  });

  it('defaults the selected pill to the progress domain color', async () => {
    const { getByTestId } = await render(<ChoiceGroup options={OPTIONS} value="a" onChange={() => {}} />);
    const style = StyleSheet.flatten(getByTestId('choice-pill-a').props.style);
    expect(style.backgroundColor).toBe(lightTertiaryByDomain.progress.tertiary);
  });

  it('uses the given domain color for the selected pill', async () => {
    const { getByTestId } = await render(
      <ChoiceGroup options={OPTIONS} value="a" onChange={() => {}} domain="sport" />
    );
    const style = StyleSheet.flatten(getByTestId('choice-pill-a').props.style);
    expect(style.backgroundColor).toBe(lightTertiaryByDomain.sport.tertiary);
  });
});
```

- [ ] **Step 2: Run the test to see it fail**

Run: `npx jest src/__tests__/ChoiceGroup.test.tsx`
Expected: FAIL — `backgroundColor` assertions compare against `lightTertiaryByDomain`, but the component still fills with the old `domainX` value read through `useThemeColors`.

- [ ] **Step 3: Rewrite `src/components/choicePillStyles.ts` in full**

```ts
import { StyleSheet } from 'react-native';
import { materialTypography, radius, spacing, state, type MaterialTertiary } from '../theme/tokens';

/** Material filter chip: unselected = outlined, tertiary-tinted; selected = filled tertiary. */
export function createPillStyles(tertiary: MaterialTertiary) {
  return StyleSheet.create({
    row: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginBottom: spacing.md },
    pill: {
      borderRadius: radius.pill,
      paddingVertical: spacing.sm + 2,
      paddingHorizontal: spacing.md + 2,
      minHeight: state.minTouchSize,
      justifyContent: 'center',
      backgroundColor: 'transparent',
      borderWidth: 1,
      borderColor: tertiary.tertiary,
    },
    pillSelected: {
      backgroundColor: tertiary.tertiary,
      borderColor: tertiary.tertiary,
    },
    label: { ...materialTypography.labelLarge, color: tertiary.tertiary },
    labelSelected: { ...materialTypography.labelLarge, color: tertiary.onTertiary },
  });
}
```

- [ ] **Step 4: Rewrite `src/components/ChoiceGroup.tsx` in full**

```tsx
import { useMemo } from 'react';
import { View, Text, Pressable } from 'react-native';
import { useMaterialTertiary } from '../theme/tokens';
import { createPillStyles } from './choicePillStyles';
import type { ButtonDomain } from './ui/Button';

export type ChoiceOption<T extends string> = { value: T; label: string };

type ChoiceGroupProps<T extends string> = {
  options: ChoiceOption<T>[];
  value: T | null;
  onChange: (value: T) => void;
  /** Domain color for the selected pill. Defaults to `'progress'` via `useMaterialTertiary`. */
  domain?: ButtonDomain;
};

export function ChoiceGroup<T extends string>({ options, value, onChange, domain }: ChoiceGroupProps<T>) {
  const tertiary = useMaterialTertiary(domain);
  const styles = useMemo(() => createPillStyles(tertiary), [tertiary]);
  return (
    <View style={styles.row}>
      {options.map((option) => {
        const selected = value === option.value;
        return (
          <Pressable
            key={option.value}
            onPress={() => onChange(option.value)}
            accessibilityRole="radio"
            accessibilityState={{ selected }}
            testID={`choice-pill-${option.value}`}
            android_ripple={{ color: selected ? tertiary.onTertiary + '1F' : tertiary.tertiary + '1F' }}
            style={[styles.pill, selected && styles.pillSelected]}
          >
            <Text style={selected ? styles.labelSelected : styles.label}>{option.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}
```

- [ ] **Step 5: Run the test to see it pass**

Run: `npx jest src/__tests__/ChoiceGroup.test.tsx`
Expected: PASS (3 tests).

- [ ] **Step 6: Typecheck**

Run: `npx tsc --noEmit`
Expected: no errors yet for `TagFilterGroup.tsx` since Task 5 hasn't updated it — **if this step reports an error in `TagFilterGroup.tsx` about `createPillStyles`'s new signature, that is expected and will be fixed in Task 5, not this task.** Confirm the only errors (if any) are confined to `TagFilterGroup.tsx`; anything else is a real regression to fix now.

- [ ] **Step 7: Commit**

```bash
git add src/components/choicePillStyles.ts src/components/ChoiceGroup.tsx src/__tests__/ChoiceGroup.test.tsx
git commit -m "feat: rebuild ChoiceGroup and its pill styles as a Material filter chip"
```

---

### Task 5: Rebuild `TagFilterGroup` as a Material filter chip (multi-select)

**Files:**
- Modify: `src/components/TagFilterGroup.tsx`

**Interfaces:**
- Consumes: `createPillStyles(tertiary: MaterialTertiary)` (Task 4's new signature), `useMaterialTertiary` (Task 1), `ChoiceOption<T>` (from `ChoiceGroup.tsx`, unchanged).
- Produces: `TagFilterGroupProps<T>` unchanged (`options`, `value: T[]`, `onChange: (value: T[]) => void`, `domain?`).

There is no dedicated `TagFilterGroup.test.tsx` in the repo today (verified: only indirect coverage). This task does not add one — matching existing coverage, not expanding scope.

- [ ] **Step 1: Rewrite `src/components/TagFilterGroup.tsx` in full**

```tsx
import { useMemo } from 'react';
import { View, Text, Pressable } from 'react-native';
import type { ChoiceOption } from './ChoiceGroup';
import { useMaterialTertiary } from '../theme/tokens';
import { createPillStyles } from './choicePillStyles';
import type { ButtonDomain } from './ui/Button';

type TagFilterGroupProps<T extends string> = {
  options: ChoiceOption<T>[];
  value: T[];
  onChange: (value: T[]) => void;
  /** Domain color for selected pills. Defaults to `'progress'` via `useMaterialTertiary`. */
  domain?: ButtonDomain;
};

export function TagFilterGroup<T extends string>({ options, value, onChange, domain }: TagFilterGroupProps<T>) {
  const tertiary = useMaterialTertiary(domain);
  const styles = useMemo(() => createPillStyles(tertiary), [tertiary]);

  const toggle = (optionValue: T) => {
    if (value.includes(optionValue)) {
      onChange(value.filter((v) => v !== optionValue));
    } else {
      onChange([...value, optionValue]);
    }
  };

  return (
    <View style={styles.row}>
      {options.map((option) => {
        const selected = value.includes(option.value);
        return (
          <Pressable
            key={option.value}
            onPress={() => toggle(option.value)}
            accessibilityRole="checkbox"
            accessibilityState={{ checked: selected }}
            android_ripple={{ color: selected ? tertiary.onTertiary + '1F' : tertiary.tertiary + '1F' }}
            style={[styles.pill, selected && styles.pillSelected]}
          >
            <Text style={selected ? styles.labelSelected : styles.label}>{option.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}
```

- [ ] **Step 2: Typecheck**

Run: `npx tsc --noEmit`
Expected: no errors anywhere (this resolves the `TagFilterGroup.tsx` error, if any, noted at the end of Task 4).

- [ ] **Step 3: Run the full test suite**

Run: `npx jest`
Expected: all suites pass — this component has no dedicated test file, so this step is the only verification; it must not have broken any screen-level test that renders `TagFilterGroup` indirectly (none exist under `src/app/`, but check for stray references first: `grep -rl TagFilterGroup src/__tests__/`).

- [ ] **Step 4: Commit**

```bash
git add src/components/TagFilterGroup.tsx
git commit -m "feat: rebuild TagFilterGroup as a Material filter chip"
```

---

### Task 6: Restyle `EmptyState` onto Material tokens

**Files:**
- Modify: `src/components/ui/EmptyState.tsx`
- Modify: `src/__tests__/EmptyState.test.tsx`

**Interfaces:**
- Consumes: `Card` (Task 3), `Button`/`ButtonDomain` (Task 2), `useMaterialColors`, `MaterialColorScheme`, `materialTypography` (Task 1).
- Produces: `EmptyStateProps` unchanged — `illustration?`, `icon?`, `title`, `message`, `actionLabel?`, `onAction?`, `domain?`.

- [ ] **Step 1: Rewrite the test**

Replace `src/__tests__/EmptyState.test.tsx` in full:

```tsx
import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { Text, StyleSheet } from 'react-native';
import { EmptyState } from '../components/ui/EmptyState';
import { lightTertiaryByDomain } from '../theme/tokens';

describe('EmptyState', () => {
  it('renders title, message and fires the action', async () => {
    const onAction = jest.fn();
    const { getByText } = await render(
      <EmptyState
        icon={<Text>icon</Text>}
        title="Aucun plan pour l'instant"
        message="Génère ton premier plan."
        actionLabel="Générer un plan"
        onAction={onAction}
      />
    );
    expect(getByText("Aucun plan pour l'instant")).toBeTruthy();
    fireEvent.press(getByText('Générer un plan'));
    expect(onAction).toHaveBeenCalledTimes(1);
  });

  it('forwards its domain to the action button', async () => {
    const onAction = jest.fn();
    const { getByTestId } = await render(
      <EmptyState
        title="Aucun plan pour l'instant"
        message="Génère ton premier plan."
        actionLabel="Générer un plan"
        onAction={onAction}
        domain="nutrition"
      />
    );
    const style = StyleSheet.flatten(getByTestId('button-pressable').props.style);
    expect(style.backgroundColor).toBe(lightTertiaryByDomain.nutrition.tertiary);
  });
});
```

- [ ] **Step 2: Run the test to see it fail**

Run: `npx jest src/__tests__/EmptyState.test.tsx`
Expected: FAIL on the domain-forwarding assertion (still reads the old `domainNutrition` value's identity, not `lightTertiaryByDomain.nutrition.tertiary` — same hex today, but the assertion now imports from the new export, so this only passes once `Button` itself resolves through the new path, which it already does after Task 2; if this test in fact passes immediately, note it in the task report as a pre-existing pass rather than treating it as a failure to chase).

- [ ] **Step 3: Rewrite `src/components/ui/EmptyState.tsx` in full**

```tsx
import { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Image, type ImageProps } from 'expo-image';
import { Card } from './Card';
import { Button, type ButtonDomain } from './Button';
import { materialTypography, spacing, useMaterialColors, type MaterialColorScheme } from '../../theme/tokens';

type EmptyStateProps = {
  /** Brand illustration for this slot. Generated on the light surface color, so it sits on the card seamlessly. */
  illustration?: ImageProps['source'];
  /** Fallback for empty states that have no illustration of their own yet. */
  icon?: React.ReactNode;
  title: string;
  message: string;
  /** Omit both when the screen already offers the action elsewhere. */
  actionLabel?: string;
  onAction?: () => void;
  /** Domain color for the action button. Defaults to `'progress'`, matching `Button`'s own default. */
  domain?: ButtonDomain;
};

export function EmptyState({
  illustration,
  icon,
  title,
  message,
  actionLabel,
  onAction,
  domain,
}: EmptyStateProps) {
  const colors = useMaterialColors();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const hasAction = Boolean(actionLabel && onAction);
  return (
    <Card style={styles.card}>
      {illustration ? (
        <Image source={illustration} style={styles.illustration} contentFit="contain" />
      ) : (
        icon && <View style={styles.icon}>{icon}</View>
      )}
      <Text style={styles.title}>{title}</Text>
      <Text style={[styles.message, hasAction && styles.messageSpaced]}>{message}</Text>
      {actionLabel && onAction && <Button title={actionLabel} onPress={onAction} domain={domain} />}
    </Card>
  );
}

function createStyles(colors: MaterialColorScheme) {
  return StyleSheet.create({
    card: {
      alignItems: 'center',
      paddingVertical: spacing.xl,
    },
    illustration: {
      width: 160,
      height: 160,
      marginBottom: spacing.sm,
    },
    icon: {
      marginBottom: spacing.md,
    },
    title: {
      ...materialTypography.titleLarge,
      color: colors.onSurface,
      marginBottom: spacing.xs,
      textAlign: 'center',
    },
    message: {
      ...materialTypography.bodyLarge,
      color: colors.onSurfaceVariant,
      textAlign: 'center',
    },
    messageSpaced: {
      marginBottom: spacing.lg,
    },
  });
}
```

- [ ] **Step 4: Run the test to see it pass**

Run: `npx jest src/__tests__/EmptyState.test.tsx`
Expected: PASS (2 tests).

- [ ] **Step 5: Typecheck**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 6: Commit**

```bash
git add src/components/ui/EmptyState.tsx src/__tests__/EmptyState.test.tsx
git commit -m "feat: restyle EmptyState onto Material tokens"
```

---

### Task 7: Rebuild `TabIcon` on `MaterialIcons`

**Files:**
- Modify: `src/components/icons/TabIcon.tsx`
- Modify: `src/__tests__/TabIcon.test.tsx`

**Interfaces:**
- Consumes: `useMaterialColors`, `MaterialColorScheme` (Task 1); `MaterialIcons` from `@expo/vector-icons` (already a dependency, `^15.0.2`).
- Produces: `TabIconName` and `TabIconProps` unchanged (`name`, `focused`, `size?`) — `src/app/(tabs)/_layout.tsx` calls `<TabIcon name="home" focused={focused} />` today with no `size` and no explicit tint prop; this component now computes its own tint from `focused` internally, so `_layout.tsx` (a screen file, out of scope) needs no changes for the new icons to render correctly-tinted.

Icon name mapping — each verified present in the installed `@expo/vector-icons` MaterialIcons glyph map (`node_modules/@expo/vector-icons/build/vendor/react-native-vector-icons/glyphmaps/MaterialIcons.json`):

| `TabIconName` | `MaterialIcons` glyph |
| --- | --- |
| `home` | `home` |
| `plan` | `event` |
| `recipes` | `restaurant-menu` |
| `workout` | `fitness-center` |
| `grocery` | `shopping-cart` |
| `weight` | `monitor-weight` |

- [ ] **Step 1: Rewrite the test**

Replace `src/__tests__/TabIcon.test.tsx` in full:

```tsx
import React from 'react';
import { render } from '@testing-library/react-native';
import { TabIcon, type TabIconName } from '../components/icons/TabIcon';
import { lightMaterialColors } from '../theme/tokens';

const NAMES: TabIconName[] = ['home', 'plan', 'recipes', 'workout', 'grocery', 'weight'];

describe('TabIcon', () => {
  it.each(NAMES)('renders an icon for %s', async (name) => {
    const { getByTestId } = await render(<TabIcon name={name} focused={false} />);
    expect(getByTestId('tab-icon-image')).toBeTruthy();
  });

  it('tints with the primary color when focused', async () => {
    const { getByTestId } = await render(<TabIcon name="home" focused />);
    expect(getByTestId('tab-icon-image').props.color).toBe(lightMaterialColors.primary);
  });

  it('tints with onSurfaceVariant when not focused', async () => {
    const { getByTestId } = await render(<TabIcon name="home" focused={false} />);
    expect(getByTestId('tab-icon-image').props.color).toBe(lightMaterialColors.onSurfaceVariant);
  });
});
```

- [ ] **Step 2: Run the test to see it fail**

Run: `npx jest src/__tests__/TabIcon.test.tsx`
Expected: FAIL — the current component renders an `expo-image` `Image` with an `opacity` style, not a `color` prop.

- [ ] **Step 3: Rewrite `src/components/icons/TabIcon.tsx` in full**

```tsx
import { MaterialIcons } from '@expo/vector-icons';
import { useMaterialColors } from '../../theme/tokens';

export type TabIconName = 'home' | 'plan' | 'recipes' | 'workout' | 'grocery' | 'weight';

const TAB_ICON_NAMES: Record<TabIconName, React.ComponentProps<typeof MaterialIcons>['name']> = {
  home: 'home',
  plan: 'event',
  recipes: 'restaurant-menu',
  workout: 'fitness-center',
  grocery: 'shopping-cart',
  weight: 'monitor-weight',
};

type TabIconProps = {
  name: TabIconName;
  focused: boolean;
  size?: number;
};

/**
 * A Material tab bar icon. Tints itself from `focused` directly (rather than
 * relying on the parent `Tabs`'s `tabBarActiveTintColor`/`tabBarInactiveTintColor`
 * cascading down) so this component alone determines its own color — no
 * change to `src/app/(tabs)/_layout.tsx` is needed for this to render correctly.
 */
export function TabIcon({ name, focused, size = 24 }: TabIconProps) {
  const colors = useMaterialColors();
  return (
    <MaterialIcons
      testID="tab-icon-image"
      name={TAB_ICON_NAMES[name]}
      size={size}
      color={focused ? colors.primary : colors.onSurfaceVariant}
    />
  );
}
```

- [ ] **Step 4: Run the test to see it pass**

Run: `npx jest src/__tests__/TabIcon.test.tsx`
Expected: PASS (8 tests: 6 from `it.each` + 2 tint tests).

- [ ] **Step 5: Typecheck**

Run: `npx tsc --noEmit`
Expected: no errors. This also confirms the six glyph names satisfy `MaterialIcons`'s own generated `name` union type — if any one of them is spelled wrong, this step fails with a clear TS literal-type error, not a silent broken icon.

- [ ] **Step 6: Commit**

```bash
git add src/components/icons/TabIcon.tsx src/__tests__/TabIcon.test.tsx
git commit -m "feat: rebuild TabIcon on MaterialIcons"
```

---

### Task 8: `app.json` changes

**Files:**
- Modify: `app.json`

**Interfaces:**
- Consumes: `darkMaterialColors.background` value from Task 1 (`#17120C`) — hardcoded here since `app.json` is static JSON and cannot import from TypeScript; if Task 1's derived value ever changes, this literal must be updated to match by hand (call this out in the PR description this plan's execution ends in).

- [ ] **Step 1: Confirm `expo-splash-screen`'s plugin schema supports a `dark` block**

Run: `grep -A4 "dark" node_modules/expo-splash-screen/plugin/src/types.ts`
Expected: shows `dark?: { image?: string; backgroundColor?: string }` on the top-level `Props` type — confirms the key below is valid for the installed `expo-splash-screen` version (`~57.0.4`) before it's used.

- [ ] **Step 2: Edit `app.json`**

Change:
```json
    "orientation": "portrait",
    "icon": "./assets/images/icon.png",
    "scheme": "mealworkoutplanner",
    "userInterfaceStyle": "light",
```
to:
```json
    "icon": "./assets/images/icon.png",
    "scheme": "mealworkoutplanner",
    "userInterfaceStyle": "automatic",
```
(the `orientation` key is removed entirely — its absence unlocks both orientations; this is the "defensive only" unlock the Phase 4 spec calls for, real landscape layout work is Phase 6).

Change the `expo-splash-screen` plugin block from:
```json
      [
        "expo-splash-screen",
        {
          "backgroundColor": "#FFFBF5",
          "image": "./assets/images/splash-icon.png",
          "imageWidth": 320
        }
      ],
```
to:
```json
      [
        "expo-splash-screen",
        {
          "backgroundColor": "#FFFBF5",
          "image": "./assets/images/splash-icon.png",
          "imageWidth": 320,
          "dark": {
            "backgroundColor": "#17120C"
          }
        }
      ],
```
(same mascot splash image in both schemes — only the background swaps to `darkMaterialColors.background` from Task 1; the mascot's own asset stays as the app's permanent identity per the Phase 4 spec's "Hors périmètre" section, so no new dark-specific splash image is generated here).

- [ ] **Step 3: Verify the full file is still valid JSON and Expo can read it**

Run: `node -e "JSON.parse(require('fs').readFileSync('app.json', 'utf8'))"`
Expected: no output (successful parse, exits 0).

Run: `npx expo config --type public 2>&1 | head -50` (or on Windows, without `head`: `npx expo config --type public`)
Expected: prints the resolved config with `"userInterfaceStyle": "automatic"`, no `"orientation"` key, and the splash plugin's `dark.backgroundColor` reflected — confirms Expo's own config resolution accepts the new shape, not just that the JSON parses.

- [ ] **Step 4: Commit**

```bash
git add app.json
git commit -m "feat: app.json — automatic color scheme, unlock orientation, dark splash background"
```

---

### Task 9: Replace `DESIGN.md`

**Files:**
- Modify: `DESIGN.md` (full replacement)

**Interfaces:**
- Consumes: every token value from Task 1 and every component decision from Tasks 2-7, for accuracy.

- [ ] **Step 1: Replace `DESIGN.md` in full**

```markdown
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
  tertiary-nutrition-light: "#B25900"
  tertiary-sport-light: "#187A57"
  tertiary-progress-light: "#C2325A"
  tertiary-neutral-light: "#7A5C34"
  tertiary-nutrition-dark: "#FFB870"
  tertiary-sport-dark: "#88E8C5"
  tertiary-progress-dark: "#E28DA5"
  tertiary-neutral-dark: "#D4BC9B"
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
    textColor: "{colors.on-primary-light}"
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
    textColor: "{colors.on-primary-light}"
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

The app supports both light and dark color schemes, following the system setting (`userInterfaceStyle: "automatic"`). Both schemes carry the same four domain accents, each independently tuned per scheme via Material's tonal-inversion method so neither scheme reads as an afterthought.

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
- **`error`/`onError`/`errorContainer`/`onErrorContainer`**: unchanged in hue from before this system, `#DC2626`-based; dark values follow the same tonal-inversion method as everything else.

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
- **Don't** reach for the legacy claymorphic tokens (`lightColors`, `useThemeColors`, `typography`, `shadow`, `clayOverlay`) in new or touched code — they exist only for the screens not yet migrated to Material (Phase 5).
- **Don't** mix two domains' `tertiary` as accents on one screen without a specific reason.
- **Don't** use `fontWeight` anywhere, or pair `fontFamily` with `fontWeight`.
- **Don't** add a custom spring/scale press animation to a new component — the native ripple is the interaction feedback, full stop.
- **Don't** add elevation/shadow to anything but `Card` without a specific reason — flat is the default.
```

- [ ] **Step 2: Confirm the frontmatter is valid YAML**

Run: `node -e "console.log(require('yaml') ? 'yaml pkg available' : 'n/a')" 2>/dev/null; node -e "
const fs = require('fs');
const content = fs.readFileSync('DESIGN.md', 'utf8');
const match = content.match(/^---\n([\s\S]*?)\n---/);
if (!match) { console.error('No frontmatter block found'); process.exit(1); }
console.log('Frontmatter block found, length:', match[1].length);
"`
Expected: prints the frontmatter block's character length with no error. (This project has no `yaml` package installed — the check above only confirms the `---`-delimited block exists and is non-empty; a human or the final review reads it for correctness, matching how `DESIGN.md` was authored originally by `/impeccable document`.)

- [ ] **Step 3: Commit**

```bash
git add DESIGN.md
git commit -m "docs: replace DESIGN.md with the Material 3 system"
```

---

### Task 10: Final verification pass

**Files:** none modified — verification only.

**Interfaces:** none (this task confirms everything Tasks 1-9 produced holds together).

- [ ] **Step 1: Full typecheck**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 2: Full test suite**

Run: `npx jest`
Expected: every suite passes, including the untouched suites for out-of-scope screens (they still import the old `Button`/`Card`/`ChoiceGroup`/etc. by the same names and same public prop shapes, so they should be unaffected).

- [ ] **Step 3: Confirm no rebuilt component still imports the old claymorphic tokens**

Run: `grep -n "useThemeColors\|clayOverlay\|from '../../theme/tokens'" src/components/ui/Button.tsx src/components/ui/Card.tsx src/components/ui/EmptyState.tsx src/components/ChoiceGroup.tsx src/components/TagFilterGroup.tsx src/components/choicePillStyles.ts src/components/icons/TabIcon.tsx`
Expected: only `MaterialColorScheme`/`MaterialDomain`/`MaterialTertiary`/`useMaterialColors`/`useMaterialTertiary`/`materialTypography`/`materialElevation`/`radius`/`spacing`/`state` imports appear — no `useThemeColors`, `clayOverlay`, or `ThemeColors` in any of these seven files.

Also run: `grep -rl "expo-linear-gradient" src/` — expected: only `src/theme/tokens.ts` (a doc-comment mention on the still-present `clayOverlay` export, not an import). After Tasks 2 and 3 drop it from `Button.tsx`/`Card.tsx`, no file in `src/` imports `expo-linear-gradient` anymore. This plan does not remove the now-unused npm dependency or the still-exported `clayOverlay` token — both are still load-bearing for any future work on the un-migrated screens before Phase 5 lands, and `clayOverlay` is technically still importable even if nothing in `src/` currently calls it. Note this observation in the PR description as a follow-up candidate, not something to act on now.

- [ ] **Step 4: Confirm `PressableScale` and `motion.spring.snappy` still exist and still have their out-of-scope consumers**

Run: `grep -rl "PressableScale" src/`
Expected: `src/components/ui/PressableScale.tsx` (the file itself, unchanged) plus `src/components/ui/BackLink.tsx`, `src/app/(tabs)/home.tsx`, `src/app/(tabs)/workout.tsx`, `src/app/workout-session.tsx`, `src/app/generate-plan.tsx` — the same five files from before this plan, none of which this plan touched. `ChoiceGroup.tsx` and `TagFilterGroup.tsx` (Tasks 4-5) and `Button.tsx` (Task 2) must NOT appear in this list anymore.

- [ ] **Step 5: Confirm no `src/app/` file was modified**

Run: `git diff --stat 747a552..HEAD -- src/app/` (replace `747a552` with this plan's actual starting commit if different — the spec-correction commit made just before Task 1 began)
Expected: empty output — zero files changed under `src/app/`.

- [ ] **Step 6: Confirm the six rebuilt components' public prop shapes are unchanged**

Run: `grep -n "^type.*Props\|^export type.*Props" src/components/ui/Button.tsx src/components/ui/Card.tsx src/components/ui/EmptyState.tsx src/components/ChoiceGroup.tsx src/components/TagFilterGroup.tsx`
Expected: manually compare each against the "Interfaces: Produces" line in that component's task above — every field name and optionality must match what was there before this plan (this is what keeps every out-of-scope screen compiling without changes).

- [ ] **Step 7: No commit for this task** — it is verification-only. If any check above fails, fix the specific regression it points to, re-run the full suite (Steps 1-2), and only then consider this plan complete.
