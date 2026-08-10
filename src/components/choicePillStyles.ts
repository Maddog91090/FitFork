import { StyleSheet } from 'react-native';
import { radius, shadow, spacing, state, typography, type ThemeColors } from '../theme/tokens';
import type { ButtonDomain } from './ui/Button';

const DOMAIN_FILL: Record<ButtonDomain, keyof ThemeColors> = {
  nutrition: 'domainNutrition',
  sport: 'domainSport',
  progress: 'domainProgress',
  neutral: 'domainNeutral',
};

export function createPillStyles(colors: ThemeColors, domain: ButtonDomain = 'progress') {
  const accent = colors[DOMAIN_FILL[domain]];
  return StyleSheet.create({
    row: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginBottom: spacing.md },
    pill: {
      borderRadius: radius.pill,
      paddingVertical: spacing.sm + 2,
      paddingHorizontal: spacing.md + 2,
      minHeight: state.minTouchSize,
      justifyContent: 'center',
      backgroundColor: colors.bgSurface,
      ...shadow.card,
    },
    pillSelected: {
      backgroundColor: accent,
      shadowColor: accent,
      shadowOpacity: 0.25,
    },
    label: { ...typography.subheading, color: colors.textPrimary },
    labelSelected: { ...typography.subheading, color: colors.textOnAccent },
  });
}
