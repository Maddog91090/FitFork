import { useCallback, useEffect, useState } from 'react';
import { View, Text, ActivityIndicator, ScrollView, StyleSheet, Pressable } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { useAuth } from '../../lib/auth-context';
import { getTrainingProfile } from '../../lib/profile';
import { selectTemplate } from '../../lib/workoutTemplate';
import { generateWorkoutProgram } from '../../lib/workoutProgram';
import {
  fetchWorkoutTemplates,
  saveWorkoutProgram,
  getAssignedTemplateId,
  fetchTemplateDaySlots,
  fetchExercisePool,
  saveGeneratedProgram,
  fetchProgramDetails,
  type WorkoutProgram,
} from '../../lib/workoutProgramData';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { colors, spacing } from '../../theme/tokens';

export default function WorkoutScreen() {
  const { session, loading } = useAuth();
  const [program, setProgram] = useState<WorkoutProgram | null>(null);
  const [checking, setChecking] = useState(true);
  const [regenerating, setRegenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  const toggleExercise = (key: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  };

  const assignAndLoad = useCallback(async (userId: string, forceRegenerate: boolean) => {
    const trainingProfile = await getTrainingProfile(userId);
    if (!trainingProfile) {
      router.replace('/onboarding');
      return;
    }

    const templates = await fetchWorkoutTemplates();
    let templateId = forceRegenerate ? null : await getAssignedTemplateId(userId);
    let needsGeneration = forceRegenerate;

    if (!templateId) {
      const selected = selectTemplate(trainingProfile, templates);
      if (!selected) {
        setError('Aucun programme disponible pour ton profil.');
        return;
      }
      await saveWorkoutProgram(userId, selected.id);
      templateId = selected.id;
      needsGeneration = true;
    }

    const generateAndSaveProgram = async (id: string) => {
      const template = templates.find((t) => t.id === id)!;
      const [archetypes, pool] = await Promise.all([
        fetchTemplateDaySlots(id),
        fetchExercisePool(template.equipment),
      ]);
      const generatedDays = generateWorkoutProgram(template.daysPerWeek, archetypes, pool);
      await saveGeneratedProgram(userId, generatedDays);
    };

    if (needsGeneration) {
      await generateAndSaveProgram(templateId);
    }

    let details = await fetchProgramDetails(userId, templateId);

    if (!needsGeneration && details.days.length === 0) {
      await generateAndSaveProgram(templateId);
      details = await fetchProgramDetails(userId, templateId);
    }

    setProgram(details);
  }, []);

  const load = useCallback(async () => {
    if (!session) return;
    setChecking(true);
    setError(null);
    try {
      await assignAndLoad(session.user.id, false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur de chargement du programme.');
    } finally {
      setChecking(false);
    }
  }, [session, assignAndLoad]);

  const handleRegenerate = async () => {
    if (!session) return;
    setRegenerating(true);
    setError(null);
    try {
      await assignAndLoad(session.user.id, true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors de la régénération.');
    } finally {
      setRegenerating(false);
    }
  };

  useEffect(() => {
    if (!loading && !session) {
      router.replace('/login');
    }
  }, [loading, session]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  if (loading || !session || checking) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator color={colors.accentRed} />
      </View>
    );
  }

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.container}>
      {error && <Text style={styles.error}>{error}</Text>}
      {program && (
        <>
          <Text style={styles.title}>{program.templateName}</Text>
          {program.days.map((day) => (
            <View key={day.dayNumber} style={styles.dayBlock}>
              <Text style={styles.dayLabel}>{day.name}</Text>
              {day.exercises.map((exercise, index) => {
                const key = `${day.dayNumber}-${index}`;
                const isExpanded = expanded.has(key);
                return (
                  <Pressable key={index} onPress={() => toggleExercise(key)}>
                    <Card style={styles.exerciseCard}>
                      <Text style={styles.exerciseName}>
                        {exercise.name} — {exercise.sets} x {exercise.repsMin}-{exercise.repsMax}
                      </Text>
                      <Text style={styles.exerciseMeta}>{exercise.muscleGroup}</Text>
                      {isExpanded && (
                        <View style={styles.instructionsBlock}>
                          {exercise.instructions.map((step, stepIndex) => (
                            <Text key={stepIndex} style={styles.instructionLine}>
                              {stepIndex + 1}. {step}
                            </Text>
                          ))}
                        </View>
                      )}
                    </Card>
                  </Pressable>
                );
              })}
            </View>
          ))}
        </>
      )}
      <View style={styles.regenerateWrap}>
        <Button title="Régénérer le programme" variant="secondary" onPress={handleRegenerate} loading={regenerating} />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bgBase },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.bgBase },
  container: { padding: spacing.lg },
  title: { fontSize: 18, fontWeight: '800', color: colors.textPrimary, marginBottom: spacing.lg },
  dayBlock: { marginBottom: spacing.lg },
  dayLabel: {
    fontSize: 11,
    textTransform: 'uppercase',
    color: colors.textSecondary,
    fontWeight: '700',
    marginBottom: spacing.sm,
  },
  exerciseCard: { marginBottom: spacing.sm },
  exerciseName: { fontSize: 13, fontWeight: '700', color: colors.textPrimary },
  exerciseMeta: { fontSize: 11, color: colors.textSecondary, marginTop: 2 },
  instructionsBlock: { marginTop: spacing.sm },
  instructionLine: { fontSize: 12, color: colors.textSecondary, marginBottom: spacing.xs },
  error: { color: colors.error, marginBottom: spacing.md },
  regenerateWrap: { marginTop: spacing.md },
});
