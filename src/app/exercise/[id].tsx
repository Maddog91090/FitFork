import { useMemo } from 'react';
import { View, Text, Image, ScrollView, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams } from 'expo-router';
import { getExercise } from '../../lib/exercises';
import { BackLink } from '../../components/ui/BackLink';
import {
  centeredContent,
  materialTypography,
  radius,
  spacing,
  useMaterialColors,
  useMaterialTertiary,
  type MaterialColorScheme,
  type MaterialTertiary,
} from '../../theme/tokens';

export default function ExerciseDetailScreen() {
  const colors = useMaterialColors();
  const sport = useMaterialTertiary('sport');
  const styles = useMemo(() => createStyles(colors, sport), [colors, sport]);
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const exercise = id ? getExercise(id) : undefined;

  if (!exercise) {
    return (
      <View style={[styles.centered, { paddingTop: insets.top }]}>
        <BackLink />
        <Text style={styles.error}>Exercice introuvable.</Text>
      </View>
    );
  }

  return (
    <ScrollView style={[styles.screen, { paddingTop: insets.top }]} contentContainerStyle={styles.container}>
      <BackLink />
      <Text style={styles.title}>{exercise.name}</Text>

      <View style={styles.photoRow}>
        <View style={styles.photoColumn}>
          <View style={styles.photoFrame}>
            <Image source={exercise.imageStart} style={styles.photo} />
          </View>
          <Text style={styles.photoLabel}>Position de départ</Text>
        </View>
        <View style={styles.photoColumn}>
          <View style={styles.photoFrame}>
            <Image source={exercise.imageEnd} style={styles.photo} />
          </View>
          <Text style={styles.photoLabel}>Position finale</Text>
        </View>
      </View>

      <Text style={styles.sectionTitle}>Comment faire</Text>
      {exercise.instructions.map((step, index) => (
        <View key={index} style={styles.stepRow}>
          <View style={styles.stepBadge}>
            <Text style={styles.stepBadgeText}>{index + 1}</Text>
          </View>
          <Text style={styles.stepText}>{step}</Text>
        </View>
      ))}
    </ScrollView>
  );
}

function createStyles(colors: MaterialColorScheme, sport: MaterialTertiary) {
  return StyleSheet.create({
    screen: { flex: 1, backgroundColor: colors.background },
    centered: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: colors.background,
      padding: spacing.lg,
    },
    container: { padding: spacing.lg, ...centeredContent },
    title: { ...materialTypography.displayMedium, color: colors.onSurface, marginBottom: spacing.lg },
    photoRow: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.lg },
    photoColumn: { flex: 1 },
    photoFrame: {
      width: '100%',
      aspectRatio: 4 / 3,
      borderRadius: radius.md,
      backgroundColor: colors.surfaceVariant,
      overflow: 'hidden',
    },
    photo: { width: '100%', height: '100%' },
    photoLabel: {
      ...materialTypography.labelMedium,
      color: colors.onSurfaceVariant,
      textAlign: 'center',
      marginTop: spacing.xs,
    },
    sectionTitle: {
      ...materialTypography.overline,
      color: colors.onSurfaceVariant,
      marginBottom: spacing.sm,
    },
    stepRow: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.sm, alignItems: 'flex-start' },
    stepBadge: {
      width: 20,
      height: 20,
      borderRadius: 10,
      backgroundColor: sport.tertiary,
      alignItems: 'center',
      justifyContent: 'center',
      marginTop: 1,
    },
    stepBadgeText: { ...materialTypography.overline, color: sport.onTertiary, letterSpacing: 0 },
    stepText: { ...materialTypography.bodyLarge, flex: 1, color: colors.onSurface },
    error: { ...materialTypography.bodyLarge, color: colors.error },
  });
}
