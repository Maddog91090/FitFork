import { useEffect, useState } from 'react';
import { View, Text, Pressable, Button, ScrollView, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { useAuth } from '../lib/auth-context';
import { getProfile, getTrainingProfile } from '../lib/profile';
import { computeTargetsFromProfile } from '../lib/targets';
import { fetchRecipes, saveWeeklyPlan } from '../lib/mealPlanData';
import { generateWeeklyPlan, type MealSlot, type MealType } from '../lib/mealPlan';

const DAY_LABELS = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];
const MEAL_TYPES: MealType[] = ['breakfast', 'lunch', 'dinner', 'snack'];
const MEAL_TYPE_LABELS: Record<MealType, string> = {
  breakfast: 'Petit-déj',
  lunch: 'Déjeuner',
  dinner: 'Dîner',
  snack: 'Collation',
};

function defaultSelection(): boolean[][] {
  return DAY_LABELS.map(() => MEAL_TYPES.map(() => true));
}

export default function GeneratePlanScreen() {
  const { session, loading } = useAuth();
  const [selected, setSelected] = useState<boolean[][]>(defaultSelection());
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && !session) {
      router.replace('/login');
    }
  }, [loading, session]);

  const toggle = (dayIndex: number, mealIndex: number) => {
    setSelected((prev) =>
      prev.map((row, d) => (d === dayIndex ? row.map((v, m) => (m === mealIndex ? !v : v)) : row))
    );
  };

  const handleGenerate = async () => {
    setError(null);
    if (!session) {
      setError('Session expirée, reconnecte-toi.');
      return;
    }

    setGenerating(true);
    try {
      const [profile, trainingProfile] = await Promise.all([
        getProfile(session.user.id),
        getTrainingProfile(session.user.id),
      ]);

      if (!profile || !trainingProfile) {
        router.replace('/onboarding');
        return;
      }

      const targets = computeTargetsFromProfile(profile, trainingProfile);
      const recipes = await fetchRecipes();
      const recipeOptions = recipes.map((r) => ({ id: r.id, mealType: r.mealType, baseCalories: r.baseCalories }));

      const slots: MealSlot[] = [];
      selected.forEach((row, dayIndex) => {
        row.forEach((isSelected, mealIndex) => {
          if (isSelected) slots.push({ dayIndex, mealType: MEAL_TYPES[mealIndex] });
        });
      });

      const entries = generateWeeklyPlan(targets.calories, slots, recipeOptions);
      await saveWeeklyPlan(session.user.id, targets, entries);
      router.replace('/plan');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Une erreur est survenue.');
    } finally {
      setGenerating(false);
    }
  };

  if (loading || !session) {
    return null;
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Choisis les repas à générer</Text>
      {DAY_LABELS.map((dayLabel, dayIndex) => (
        <View key={dayLabel} style={styles.dayRow}>
          <Text style={styles.dayLabel}>{dayLabel}</Text>
          <View style={styles.mealRow}>
            {MEAL_TYPES.map((mealType, mealIndex) => (
              <Pressable
                key={mealType}
                onPress={() => toggle(dayIndex, mealIndex)}
                style={[styles.cell, selected[dayIndex][mealIndex] && styles.cellSelected]}
              >
                <Text style={selected[dayIndex][mealIndex] ? styles.cellLabelSelected : styles.cellLabel}>
                  {MEAL_TYPE_LABELS[mealType]}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>
      ))}
      {error && <Text style={styles.error}>{error}</Text>}
      <Button
        title={generating ? 'Génération...' : 'Générer le plan'}
        onPress={handleGenerate}
        disabled={generating}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 24 },
  title: { fontSize: 18, fontWeight: '600', marginBottom: 16 },
  dayRow: { marginBottom: 12 },
  dayLabel: { fontWeight: '600', marginBottom: 4 },
  mealRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  cell: { borderWidth: 1, borderColor: '#888', borderRadius: 12, paddingVertical: 6, paddingHorizontal: 10 },
  cellSelected: { backgroundColor: '#208AEF', borderColor: '#208AEF' },
  cellLabel: { color: '#333' },
  cellLabelSelected: { color: '#fff' },
  error: { color: 'red', marginTop: 16, marginBottom: 8 },
});
