/**
 * FitFork design tokens — visual style "FitFork".
 *
 * Single source of truth for the app's look. Screens and components must not
 * hardcode colors, sizes, durations or font weights — import from here.
 * See `.claude/skills/fitfork-design/SKILL.md` for the rules behind these values.
 */
export const lightColors = {
  // Surfaces — warm cream base, pure white for raised content.
  bgBase: '#F6F3EC',
  bgSurface: '#FFFFFF',
  bgSunken: '#EBE6DA',

  // Text — textSecondary is AA on both bgBase (5.3:1) and bgSurface (5.9:1).
  // textTertiary fails AA on purpose: decorative/redundant text only.
  textPrimary: '#332F2B',
  textSecondary: '#6B6459',
  textTertiary: '#9C9487',
  /** White. Only legible on accentTeal / accentTealDeep — never on accentOrange. */
  textOnAccent: '#FFFFFF',
  /**
   * Ink, for text and icons sitting on an accentOrange fill (6.3:1). The brand
   * orange is too light to carry white text (2.1:1), and darkening it far
   * enough to fix that turns it brown — so the orange keeps its exact brand
   * value and the text on top goes dark instead. Primary buttons use this.
   */
  textOnWarm: '#332F2B',

  // Brand accent — orange. accentOrange is a FILL color: it pairs with
  // textOnWarm, never with white. For orange text or icons at body size on a
  // cream/white background, use accentOrangeDeep (4.6:1).
  accentOrange: '#F5A03C',
  /**
   * Pressed state for an accentOrange fill. Darkened just enough to read as
   * pushed (1.3:1 against the resting fill) while textOnWarm on top still
   * clears AA (4.9:1) — accentOrangeDeep would be too dark to keep ink legible.
   */
  accentOrangePressed: '#E8830C',
  accentOrangeDeep: '#A45D08',
  accentOrangeSoft: '#FDEEDA',

  // Secondary accent — teal. Unlike orange this one is dark enough to carry
  // white text (4.6:1), so accentTeal is the fill that pairs with
  // textOnAccent. accentTealDeep is teal as text/icons on a background (4.5:1).
  // Teal is scarcer than orange: it marks nutrition and secondary confirmation,
  // never the screen's one primary action.
  accentTeal: '#0B8477',
  accentTealDeep: '#0A7D71',
  accentTealSoft: '#DFF1EE',

  /**
   * Illustration-only teal — the logo, flat exercise figures, chart bars. It is
   * deliberately brighter than accentTeal, which was darkened specifically so
   * white text clears 4.5:1 on top of it. Never put text on this, and never use
   * it as a UI fill.
   */
  illustrationTeal: '#0D9C8C',

  // Lines. divider = inside a surface, border = around one.
  divider: '#EFE9DC',
  border: '#E4DCCB',
  borderStrong: '#D2C7B1',

  // Status — retuned so each one clears AA on the new cream base too.
  error: '#C2321B',
  errorSoft: '#FBE7E2',
  success: '#15803D',
  successSoft: '#E4F1E8',
  warning: '#9A5B08',
  warningSoft: '#FBEFDC',

  // Domain vocabulary — macros and training intensity. Every value is AA on
  // bgBase and hue-separated enough to stay readable in charts and legends.
  macroProtein: '#C2410C',
  macroCarbs: '#0F766E',
  macroFat: '#4338CA',
  effort: '#C2410C',
  rest: '#0369A1',

  overlay: 'rgba(51, 47, 43, 0.45)',
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
 * never pair these with `fontWeight`.
 */
export const fontFamily = {
  displaySemiBold: 'Nunito_700Bold',
  displayBold: 'Nunito_800ExtraBold',
  bodyRegular: 'PlusJakartaSans_400Regular',
  bodyMedium: 'PlusJakartaSans_500Medium',
  bodySemiBold: 'PlusJakartaSans_600SemiBold',
  bodyBold: 'PlusJakartaSans_700Bold',
} as const;

/**
 * Type scale. Spread a whole entry into a style — `...typography.title` — rather
 * than picking sizes off it, so family, size, leading and tracking stay
 * together. Nunito (rounded, chunky) carries titles, hero text and numbers;
 * Plus Jakarta Sans carries everything the user reads or taps.
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
  /** Big numbers: weight, calories, sets. Nunito's weight gives them presence. */
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

/**
 * Corners run rounder than Soft Neutral did — the FitFork direction is chunky
 * and friendly, so `lg` (cards) went 16 → 20 and `md` (buttons, inputs) 14 → 16.
 */
export const radius = {
  xs: 8,
  sm: 12,
  md: 16,
  lg: 20,
  xl: 24,
  pill: 20,
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

export const shadow = {
  subtle: {
    shadowColor: '#000000',
    shadowOpacity: 0.03,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 1 },
    elevation: 1,
  },
  card: {
    shadowColor: '#000000',
    shadowOpacity: 0.06,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  raised: {
    shadowColor: '#000000',
    shadowOpacity: 0.1,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 6 },
    elevation: 6,
  },
  /** Orange-tinted glow. Belongs only to the primary button. */
  button: {
    shadowColor: '#F5A03C',
    shadowOpacity: 0.25,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
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
    snappy: { damping: 14, stiffness: 320, mass: 0.8 },
  },
} as const;

/** Interaction states — applied consistently so touch feels the same app-wide. */
export const state = {
  pressedOpacity: 0.92,
  pressedScale: 0.97,
  disabledOpacity: 0.55,
  hitSlop: 8,
  /** Minimum tappable square, per platform accessibility guidance. */
  minTouchSize: 44,
} as const;
