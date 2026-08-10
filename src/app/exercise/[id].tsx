import { useMemo } from 'react';
import { View, Text, Image, ScrollView, StyleSheet } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { getExercise } from '../../lib/exercises';
import { BackLink } from '../../components/ui/BackLink';
import { centeredContent, radius, spacing, typography, useThemeColors, type ThemeColors } from '../../theme/tokens';

export default function ExerciseDetailScreen() {
  const colors = useThemeColors();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const { id } = useLocalSearchParams<{ id: string }>();
  const exercise = id ? getExercise(id) : undefined;

  if (!exercise) {
    return (
      <View style={styles.centered}>
        <BackLink />
        <Text style={styles.error}>Exercice introuvable.</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.container}>
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

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    screen: { flex: 1, backgroundColor: colors.bgBase },
    centered: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: colors.bgBase,
      padding: spacing.lg,
    },
    container: { padding: spacing.lg, ...centeredContent },
    title: { ...typography.display, color: colors.textPrimary, marginBottom: spacing.lg },
    photoRow: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.lg },
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
    sectionTitle: {
      ...typography.overline,
      color: colors.textSecondary,
      marginBottom: spacing.sm,
    },
    stepRow: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.sm, alignItems: 'flex-start' },
    stepBadge: {
      width: 20,
      height: 20,
      borderRadius: 10,
      backgroundColor: colors.accentRed,
      alignItems: 'center',
      justifyContent: 'center',
      marginTop: 1,
    },
    stepBadgeText: { ...typography.overline, color: colors.textOnAccent, letterSpacing: 0 },
    stepText: { ...typography.body, flex: 1, color: colors.textPrimary },
    error: { ...typography.body, color: colors.error },
  });
}
