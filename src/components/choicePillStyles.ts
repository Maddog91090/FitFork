import { StyleSheet } from 'react-native';
import { materialTypography, radius, spacing, state, type MaterialTertiary } from '../theme/tokens';

/** Material filter chip: unselected = outlined, tertiary-tinted; selected = filled tertiary. */
export function createPillStyles(tertiary: MaterialTertiary) {
  return StyleSheet.create({
    row: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginBottom: spacing.md },
    pill: {
      borderRadius: radius.pill,
      overflow: 'hidden',
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
    pressed: {
      opacity: 0.85,
    },
    label: { ...materialTypography.labelLarge, color: tertiary.tertiary },
    labelSelected: { ...materialTypography.labelLarge, color: tertiary.onTertiary },
  });
}
