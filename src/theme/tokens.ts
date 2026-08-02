/**
 * FitPro design tokens — visual style "Soft Neutral".
 *
 * Single source of truth for the app's look. Screens and components must not
 * hardcode colors, sizes, durations or font weights — import from here.
 * See `.claude/skills/fitfork-design/SKILL.md` for the rules behind these values.
 */

export const colors = {
  // Surfaces — warm off-white base, pure white for raised content.
  bgBase: '#F7F5F2',
  bgSurface: '#FFFFFF',
  bgSunken: '#EFEBE5',

  // Text — textSecondary is AA-compliant on bgBase (4.9:1).
  // textTertiary fails AA on purpose: decorative/redundant text only.
  textPrimary: '#1E1B18',
  textSecondary: '#6F6A61',
  textTertiary: '#9A958D',
  textOnAccent: '#FFFFFF',

  // Brand accent. accentRed is for fills and large type only (4.4:1 on bgBase).
  // For red text or icons at body size, use accentRedDeep (6.0:1).
  accentRed: '#DC2626',
  accentRedDeep: '#B91C1C',
  accentRedSoft: '#FBEAE7',

  // Lines. divider = inside a surface, border = around one.
  divider: '#F0ECE3',
  border: '#E8E2D8',
  borderStrong: '#D8D0C3',

  // Status
  error: '#DC2626',
  errorSoft: '#FBEAE7',
  success: '#15803D',
  successSoft: '#E6F2EA',
  warning: '#B45309',
  warningSoft: '#FBF0E2',

  // Domain vocabulary — macros and training intensity. Every value is AA on
  // bgBase and hue-separated enough to stay readable in charts and legends.
  macroProtein: '#C2410C',
  macroCarbs: '#0F766E',
  macroFat: '#4338CA',
  effort: '#DC2626',
  rest: '#0369A1',

  overlay: 'rgba(30, 27, 24, 0.45)',
} as const;

/**
 * Custom fonts are loaded in `src/app/_layout.tsx`. React Native does not
 * synthesize weights for custom fonts, so weight lives in the family name —
 * never pair these with `fontWeight`.
 */
export const fontFamily = {
  displaySemiBold: 'Fraunces_600SemiBold',
  displayBold: 'Fraunces_700Bold',
  bodyRegular: 'PlusJakartaSans_400Regular',
  bodyMedium: 'PlusJakartaSans_500Medium',
  bodySemiBold: 'PlusJakartaSans_600SemiBold',
  bodyBold: 'PlusJakartaSans_700Bold',
} as const;

/**
 * Type scale. Spread a whole entry into a style — `...typography.title` — rather
 * than picking sizes off it, so family, size, leading and tracking stay
 * together. Fraunces (serif) carries titles and numbers; Plus Jakarta Sans
 * carries everything the user reads or taps.
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
  /** Big numbers: weight, calories, sets. Serif gives them presence. */
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
  xs: 8,
  sm: 12,
  md: 14,
  lg: 16,
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
  button: {
    shadowColor: '#DC2626',
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
