/**
 * FitPro design tokens — claymorphic, multi-domain-color, mascot-driven design system.
 *
 * Single source of truth for the app's look. Screens and components must not
 * hardcode colors, sizes, durations or font weights — import from here.
 * See `.claude/skills/fitfork-design/SKILL.md` for the rules behind these values.
 */
import { useColorScheme } from 'react-native';

export const lightColors = {
  // Surfaces — light warm cream base (lighter than Soft Neutral's paper, to
  // let the saturated domain colors read as vivid rather than muddy), pure
  // white raised, soft peach sunken.
  bgBase: '#FFFBF5',
  bgSurface: '#FFFFFF',
  bgSunken: '#FFF3E0',

  // Text — warm ink instead of Soft Neutral's cool gray-black, to match the
  // warmer surfaces. textSecondary is AA-compliant on bgBase/bgSurface/
  // bgSunken (6.0–6.6:1). textTertiary fails AA on purpose: decorative or
  // redundant text only.
  textPrimary: '#2E2418',
  textSecondary: '#6B5A46',
  textTertiary: '#B8A78E',
  textOnAccent: '#FFFFFF',

  // Legacy single-accent keys — kept because 21 screens outside this plan's
  // scope still read them directly. Repointed to the progress-domain color
  // (the closest emotional match to the old "important/celebratory" red) so
  // those screens look coherent with the new palette immediately, rather
  // than staying stuck on Soft Neutral red. A later plan replaces each call
  // site with the correct per-screen domain token and deletes these three
  // keys — see "Follow-up work".
  accentRed: '#C2325A',
  accentRedDeep: '#A31C42',
  accentRedSoft: '#FFE3E9',

  // Domain colors — nutrition/sport/progress each own a hue; there is no
  // single brand accent anymore. `*Deep` is for text/icons at body size and
  // for a button's pressed-state fill; the base tone is for large fills
  // (buttons, big icon backgrounds) and passes AA with white text on top.
  domainNutrition: '#B25900',
  domainNutritionDeep: '#8A5200',
  domainSport: '#187A57',
  domainSportDeep: '#0E4F38',
  domainProgress: '#C2325A',
  domainProgressDeep: '#A31C42',
  domainNeutral: '#7A5C34',
  domainNeutralDeep: '#6B4F26',

  // Lines. divider = inside a surface, border = around one. Warmed to match
  // the new surfaces.
  divider: '#FBEAD3',
  border: '#F0D9B8',
  // Darker than `border` on purpose: this is the one line color that must
  // clear the 3:1 WCAG 1.4.11 threshold for non-text UI components (e.g. a
  // Switch's "off" track) rather than just reading as decorative.
  borderStrong: '#A67F4C',

  // Status — unchanged. Not part of this design system's scope.
  error: '#DC2626',
  errorSoft: '#FBEAE7',
  success: '#15803D',
  successSoft: '#E6F2EA',
  warning: '#B45309',
  warningSoft: '#FBF0E2',

  // Domain vocabulary — macros and training intensity. Unchanged: these are
  // a finer-grained vocabulary than the four screen-level domain colors
  // above (e.g. all three macros can appear together on one nutrition
  // screen), and the design spec never asked to touch them.
  macroProtein: '#C2410C',
  macroCarbs: '#0F766E',
  macroFat: '#4338CA',
  effort: '#DC2626',
  rest: '#0369A1',

  overlay: 'rgba(46, 36, 24, 0.45)',
} as const;

export const colors = lightColors;

export type ThemeColors = { readonly [K in keyof typeof lightColors]: string };

/**
 * The app is light-only by design decision — kept as a hook (rather than
 * inlining `lightColors` at every call site) so screens don't need to change
 * if that decision is ever revisited.
 */
export function useThemeColors(): ThemeColors {
  return lightColors;
}

/**
 * Custom fonts are loaded in `src/app/_layout.tsx`. React Native does not
 * synthesize weights for custom fonts, so weight lives in the family name —
 * never pair these with `fontWeight`. Fredoka carries everything — titles,
 * hero text, numbers, body, labels — there is no second family in this
 * design system.
 */
export const fontFamily = {
  displaySemiBold: 'Fredoka_600SemiBold',
  displayBold: 'Fredoka_700Bold',
  bodyRegular: 'Fredoka_400Regular',
  bodyMedium: 'Fredoka_500Medium',
  bodySemiBold: 'Fredoka_600SemiBold',
  bodyBold: 'Fredoka_700Bold',
} as const;

/**
 * Type scale. Spread a whole entry into a style — `...typography.title` — rather
 * than picking sizes off it, so family, size, leading and tracking stay
 * together. Fredoka carries every entry here — there is no second family to
 * distinguish titles/numbers from body text anymore.
 */
export const typography = {
  hero: {
    fontFamily: fontFamily.displayBold,
    fontSize: 32,
    lineHeight: 38,
    letterSpacing: -0.6,
  },
  display: {
    fontFamily: fontFamily.displayBold,
    fontSize: 26,
    lineHeight: 32,
    letterSpacing: -0.4,
  },
  title: {
    fontFamily: fontFamily.displaySemiBold,
    fontSize: 20,
    lineHeight: 26,
    letterSpacing: -0.2,
  },
  /** Big numbers: weight, calories, sets. Uses the bold display weight (not `title`'s
   *  semibold) so it reads as the heaviest, most prominent number on the screen. */
  metric: {
    fontFamily: fontFamily.displayBold,
    fontSize: 28,
    lineHeight: 32,
    letterSpacing: -0.4,
  },
  heading: {
    fontFamily: fontFamily.bodyBold,
    fontSize: 16,
    lineHeight: 22,
    letterSpacing: -0.1,
  },
  subheading: {
    fontFamily: fontFamily.bodySemiBold,
    fontSize: 14,
    lineHeight: 20,
  },
  body: {
    fontFamily: fontFamily.bodyRegular,
    fontSize: 14,
    lineHeight: 21,
  },
  bodyStrong: {
    fontFamily: fontFamily.bodySemiBold,
    fontSize: 14,
    lineHeight: 21,
  },
  /** Buttons, tabs, chips. */
  label: {
    fontFamily: fontFamily.bodyBold,
    fontSize: 14,
    lineHeight: 18,
    letterSpacing: 0.1,
  },
  caption: {
    fontFamily: fontFamily.bodyMedium,
    fontSize: 12,
    lineHeight: 17,
  },
  captionStrong: {
    fontFamily: fontFamily.bodySemiBold,
    fontSize: 12,
    lineHeight: 17,
  },
  /** Section eyebrows and step counters — always uppercase. */
  overline: {
    fontFamily: fontFamily.bodyBold,
    fontSize: 10,
    lineHeight: 14,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },
} as const;

export const radius = {
  xs: 10,
  sm: 16,
  md: 20,
  lg: 26,
  xl: 32,
  pill: 28,
  full: 999,
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
  xxxl: 48,
} as const;

export const layout = {
  screenPaddingX: spacing.lg,
  sectionGap: spacing.xl,
  /** Keeps text readable when the app runs on web or a tablet. */
  maxContentWidth: 560,
} as const;

/**
 * Spread into a screen's outer content style — `{ padding: spacing.lg, ...centeredContent }`
 * — to cap it at `layout.maxContentWidth` and center it. A no-op on phone-width
 * native screens (they never reach the cap); on web/tablet it stops inputs and
 * cards from stretching edge to edge of the window.
 */
export const centeredContent = {
  width: '100%',
  maxWidth: layout.maxContentWidth,
  alignSelf: 'center',
} as const;

/**
 * Claymorphic elevation. Every shadow is warm-tinted (never pure black) to
 * read as depth in a puffy material rather than a hard drop shadow. There is
 * no per-domain shadow tier here — `Button.tsx` overrides `shadowColor` at
 * the call site for BOTH variants (primary gets the domain's deep color,
 * secondary gets `colors.textPrimary` — see `Button.tsx`); everything else
 * uses these as-is.
 */
export const shadow = {
  subtle: {
    shadowColor: '#3A2E22',
    shadowOpacity: 0.06,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },
  card: {
    shadowColor: '#3A2E22',
    shadowOpacity: 0.12,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 8 },
    elevation: 4,
  },
  raised: {
    shadowColor: '#3A2E22',
    shadowOpacity: 0.18,
    shadowRadius: 26,
    shadowOffset: { width: 0, height: 12 },
    elevation: 8,
  },
} as const;

/**
 * The "puffy" inner-highlight illusion. React Native has no CSS-style inset
 * shadow, so the claymorphic volume cue is faked with a low-opacity diagonal
 * sheen laid on top of a surface: lighter top-left (catching light), fading
 * through transparent, to a faint warm dark bottom-right (falling into
 * shadow). Consumers render this as an `expo-linear-gradient` `LinearGradient`
 * sized to `StyleSheet.absoluteFill` **with its own `borderRadius`
 * matching the surface** — a view always clips its own background/gradient
 * fill to its own border radius, so no `overflow: 'hidden'` is needed on the
 * parent (which would otherwise also clip the parent's drop shadow).
 */
export const clayOverlay = {
  colors: ['rgba(255,255,255,0.45)', 'rgba(255,255,255,0)', 'rgba(58,46,34,0.10)'],
  locations: [0, 0.55, 1],
  start: { x: 0, y: 0 },
  end: { x: 1, y: 1 },
} as const;

/**
 * Motion. Curves are plain cubic-bezier control points so this file stays
 * dependency-free (and importable from tests); build the Reanimated value at
 * the call site with `Easing.bezier(...motion.curve.standard)`.
 */
export const motion = {
  duration: {
    instant: 90,
    fast: 160,
    base: 240,
    slow: 360,
    /** One full cycle of the mascot's idle breathing loop (see Mascot.tsx). */
    idle: 2400,
  },
  curve: {
    /** Default for anything already on screen moving or resizing. */
    standard: [0.2, 0, 0, 1],
    /** Things arriving: fast out of the gate, settling softly. */
    entrance: [0.05, 0.7, 0.1, 1],
    /** Things leaving: they should not linger. */
    exit: [0.3, 0, 0.8, 0.15],
  },
  spring: {
    gentle: { damping: 18, stiffness: 180, mass: 1 },
    /** Base of the "chips and cells" press pattern — visibly bouncy, the
     *  default feel for everyday taps and button presses in this direction. */
    snappy: { damping: 8, stiffness: 260, mass: 0.9 },
    /** Reward moments only: the mascot's celebration pose bouncing in.
     *  Pronounced overshoot — do not use for routine taps, it would read as
     *  exhausting rather than delightful. */
    celebrate: { damping: 5, stiffness: 220, mass: 1 },
  },
} as const;

/** Interaction states — applied consistently so touch feels the same app-wide. */
export const state = {
  /** Visible claymorphic squish under the finger — deliberately pronounced. */
  pressedScale: 0.9,
  disabledOpacity: 0.55,
  hitSlop: 8,
  /** Minimum tappable square. 48dp is Android's Material guidance (this app's
   *  platform, per PRODUCT.md) — taller than iOS's 44pt floor. */
  minTouchSize: 48,
} as const;

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
  onErrorContainer: lightColors.textPrimary,
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

/**
 * `userInterfaceStyle` is `"light"` in `app.json` for now (deliberately, until
 * a later phase migrates the remaining screens off the old claymorphic
 * tokens), so this hook's dark branch is built and tested but not yet
 * reachable on-device.
 */
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

/**
 * Adds ~12% alpha to a hex color for Material ripple tints — `'1F'` is `0x1F`
 * (31/255 ≈ 12%) appended as the alpha channel. Shared by `Button`,
 * `ChoiceGroup`, and `TagFilterGroup`'s `android_ripple` colors so the
 * "12% ripple alpha" convention lives in one place.
 */
export function withRippleAlpha(hex: string): string {
  return hex + '1F';
}
