import { useMemo } from 'react';
import { View, StyleSheet } from 'react-native';
import { useThemeColors, type ThemeColors } from '../../theme/tokens';

const STROKE = 2;
const MARKER = 8;
/** Marker radius plus its surface ring, so the last point is never clipped. */
const PADDING = MARKER / 2 + 2;

type SparklineProps = {
  /** Chronological, oldest first. Fewer than two points renders nothing. */
  values: number[];
  width: number;
  height?: number;
  accessibilityLabel?: string;
};

/**
 * A single-series trend line, drawn with rotated views rather than a charting
 * dependency — at ten points that is cheaper than pulling in SVG.
 *
 * The line is secondary ink and the current point is primary: emphasis without
 * spending the brand red, which belongs to the screen's one primary action.
 * The history list underneath is the accessible table view of the same data.
 */
export function Sparkline({ values, width, height = 64, accessibilityLabel }: SparklineProps) {
  const colors = useThemeColors();
  const styles = useMemo(() => createStyles(colors), [colors]);

  if (values.length < 2 || width <= 0) {
    return null;
  }

  const min = Math.min(...values);
  const max = Math.max(...values);
  const span = max - min;
  const plotHeight = height - PADDING * 2;

  const points = values.map((value, index) => ({
    x: (index / (values.length - 1)) * width,
    // A flat series sits on the middle rather than collapsing onto an edge.
    y: PADDING + (span === 0 ? plotHeight / 2 : (1 - (value - min) / span) * plotHeight),
  }));

  const last = points[points.length - 1];

  return (
    <View
      style={[styles.container, { width, height }]}
      accessible
      accessibilityRole="image"
      accessibilityLabel={accessibilityLabel}
    >
      {points.slice(0, -1).map((from, index) => {
        const to = points[index + 1];
        const dx = to.x - from.x;
        const dy = to.y - from.y;
        return (
          <View
            key={index}
            style={[
              styles.segment,
              {
                left: from.x,
                top: from.y - STROKE / 2,
                width: Math.hypot(dx, dy),
                transform: [{ rotate: `${Math.atan2(dy, dx)}rad` }],
              },
            ]}
          />
        );
      })}
      <View style={[styles.marker, { left: last.x - MARKER / 2, top: last.y - MARKER / 2 }]} />
    </View>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    container: {
      position: 'relative',
    },
    segment: {
      position: 'absolute',
      height: STROKE,
      backgroundColor: colors.textSecondary,
      transformOrigin: 'left center',
    },
    marker: {
      position: 'absolute',
      width: MARKER,
      height: MARKER,
      borderRadius: MARKER / 2,
      backgroundColor: colors.textPrimary,
      // Surface ring so the point stays legible where the line runs under it.
      borderWidth: 2,
      borderColor: colors.bgSurface,
    },
  });
}
