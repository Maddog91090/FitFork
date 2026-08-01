export const colors = {
  bgBase: '#F7F5F2',
  bgSurface: '#FFFFFF',
  textPrimary: '#1E1B18',
  textSecondary: '#9A958D',
  accentRed: '#DC2626',
  divider: '#F0ECE3',
  error: '#DC2626',
} as const;

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
