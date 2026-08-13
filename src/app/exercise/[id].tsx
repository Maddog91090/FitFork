import { useMemo } from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { getExercise } from '../../lib/exercises';
import { BackLink } from '../../components/ui/BackLink';
import { ExercisePhotoPair } from '../../components/ui/ExercisePhotoPair';
import { centeredContent, spacing, typography, useThemeColors, type ThemeColors } from '../../theme/tokens';

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

      <ExercisePhotoPair
        imageStart={exercise.imageStart}
        imageEnd={exercise.imageEnd}
        style={styles.photoRowSpacing}
      />

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
    photoRowSpacing: { marginBottom: spacing.lg },
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
