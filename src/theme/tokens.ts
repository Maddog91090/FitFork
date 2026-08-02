const light = {
  bgBase: '#F7F5F2',
  bgSurface: '#FFFFFF',
  textPrimary: '#1E1B18',
  textSecondary: '#6E6860',
  accentRed: '#DC2626',
  // A muted tonal wash of accentRed -- still "the one accent", just at low opacity, for
  // selected-state backgrounds (e.g. the tablet nav rail's active item) where a solid fill
  // would fight with red text/icons sitting on top of it.
  accentRedTint: 'rgba(220, 38, 38, 0.12)',
  divider: '#F0ECE3',
  error: '#DC2626',
  onAccent: '#FFFFFF',
  // Android/Material 3 only: a tonal neutral surface (M3 "surface variant") for filled
  // text fields, filled cards, and unselected chips -- distinct from bgSurface (pure white),
  // which stays the iOS default. Not used on iOS.
  surfaceVariant: '#EFEAE2',
  // Android/Material 3 only: border color for outlined buttons/fields.
  outline: '#D8D2C7',
} as const;

const dark = {
  bgBase: '#17140F',
  bgSurface: '#221E18',
  textPrimary: '#F5F1EA',
  textSecondary: '#B3AA9C',
  // Apple's own dark-mode systemRed: reads well as both a filled-button background
  // (white label) and standalone accent/error text against a near-black surface --
  // #DC2626 (the light-theme red) is too dark to pass text contrast on dark backgrounds.
  accentRed: '#FF453A',
  accentRedTint: 'rgba(255, 69, 58, 0.18)',
  divider: '#332E26',
  error: '#FF453A',
  onAccent: '#FFFFFF',
  surfaceVariant: '#2A2520',
  outline: '#4A443B',
} as const;

export const palettes = { light, dark } as const;
export type ThemeColors = { [K in keyof typeof light]: string };

// Static export kept for the rare non-component/non-hook usage; components should
// prefer useColors() so they react to the OS appearance setting.
export const colors = light;

export const radius = {
  sm: 12,
  md: 14,
  lg: 16,
  pill: 20,
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
} as const;

export const shadow = {
  card: {
    shadowColor: '#000000',
    shadowOpacity: 0.06,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  button: {
    shadowColor: '#DC2626',
    shadowOpacity: 0.25,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
} as const;
