import { useMemo } from 'react';
import { View, Text, StyleSheet, type ImageSourcePropType, type StyleProp, type ViewStyle } from 'react-native';
import { Image } from 'expo-image';
import { radius, spacing, typography, useThemeColors, type ThemeColors } from '../../theme/tokens';

type ExercisePhotoPairProps = {
  imageStart: ImageSourcePropType;
  imageEnd: ImageSourcePropType;
  /** Shows "Position de départ" / "Position finale" captions under each photo. Defaults to `true`. */
  showLabels?: boolean;
  style?: StyleProp<ViewStyle>;
};

export function ExercisePhotoPair({ imageStart, imageEnd, showLabels = true, style }: ExercisePhotoPairProps) {
  const colors = useThemeColors();
  const styles = useMemo(() => createStyles(colors), [colors]);

  return (
    <View style={[styles.photoRow, style]}>
      <View style={styles.photoColumn}>
        <View style={styles.photoFrame}>
          <Image
            testID="exercise-photo-start"
            source={imageStart}
            style={styles.photo}
            contentFit="cover"
            accessibilityLabel="Position de départ"
            accessibilityIgnoresInvertColors
          />
        </View>
        {showLabels && <Text style={styles.photoLabel}>Position de départ</Text>}
      </View>
      <View style={styles.photoColumn}>
        <View style={styles.photoFrame}>
          <Image
            testID="exercise-photo-end"
            source={imageEnd}
            style={styles.photo}
            contentFit="cover"
            accessibilityLabel="Position finale"
            accessibilityIgnoresInvertColors
          />
        </View>
        {showLabels && <Text style={styles.photoLabel}>Position finale</Text>}
      </View>
    </View>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    photoRow: { flexDirection: 'row', gap: spacing.sm },
    photoColumn: { flex: 1 },
    photoFrame: {
      width: '100%',
      aspectRatio: 4 / 3,
      borderRadius: radius.md,
      backgroundColor: colors.bgSunken,
      overflow: 'hidden',
    },
    photo: { width: '100%', height: '100%' },
    photoLabel: {
      ...typography.caption,
      color: colors.textSecondary,
      textAlign: 'center',
      marginTop: spacing.xs,
    },
  });
}
