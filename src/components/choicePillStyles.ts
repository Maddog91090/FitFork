import { StyleSheet } from 'react-native';
import { radius, shadow, spacing, state, typography, type ThemeColors } from '../theme/tokens';

export function createPillStyles(colors: ThemeColors) {
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
      backgroundColor: colors.accentOrange,
      shadowColor: colors.accentOrange,
      shadowOpacity: 0.25,
    },
    label: { ...typography.subheading, color: colors.textPrimary },
    labelSelected: { ...typography.subheading, color: colors.textOnWarm },
  });
}
