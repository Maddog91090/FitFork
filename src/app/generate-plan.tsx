import { useEffect, useMemo, useState } from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { useAuth } from '../lib/auth-context';
import { getProfile, getTrainingProfile } from '../lib/profile';
import { computeTargetsFromProfile } from '../lib/targets';
import { fetchRecipes, fetchRecipeIngredients, saveWeeklyPlan } from '../lib/mealPlanData';
import { fetchRecentWeightLogs, type WeightLogEntry } from '../lib/weightLogData';
import { computeAdjustedTargets } from '../lib/progressTracking';
import { generateWeeklyPlan, DAY_LABELS, type MealSlot, type MealType } from '../lib/mealPlan';
import { Button } from '../components/ui/Button';
import { PressableScale } from '../components/ui/PressableScale';
import { BackLink } from '../components/ui/BackLink';
import {
  centeredContent,
  radius,
  shadow,
  spacing,
  state,
  typography,
  useThemeColors,
  type ThemeColors,
} from '../theme/tokens';

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
  const colors = useThemeColors();
  const styles = useMemo(() => createStyles(colors), [colors]);
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

      const baseTargets = computeTargetsFromProfile(profile);
      let weightLogs: WeightLogEntry[] = [];
      try {
        weightLogs = await fetchRecentWeightLogs(session.user.id);
      } catch {
        // Progress tracking is a strictly additive enhancement — if fetching weight
        // history fails for any reason, fall back to the base (unadjusted) targets
        // rather than aborting meal-plan generation entirely.
      }
      const targets = computeAdjustedTargets(baseTargets, profile.goal, profile.weightKg, weightLogs);
      const recipes = await fetchRecipes();
      const allIngredients = await fetchRecipeIngredients(recipes.map((r) => r.id));
      const ingredientNamesByRecipe = new Map<string, string[]>();
      for (const ingredient of allIngredients) {
        const names = ingredientNamesByRecipe.get(ingredient.recipeId) ?? [];
        names.push(ingredient.ingredientName);
        ingredientNamesByRecipe.set(ingredient.recipeId, names);
      }
      const recipeOptions = recipes.map((r) => ({
        id: r.id,
        mealType: r.mealType,
        baseCalories: r.baseCalories,
        baseProteinG: r.baseProteinG,
        baseFatG: r.baseFatG,
        baseCarbsG: r.baseCarbsG,
        ingredientNames: ingredientNamesByRecipe.get(r.id) ?? [],
      }));

      const slots: MealSlot[] = [];
      selected.forEach((row, dayIndex) => {
        row.forEach((isSelected, mealIndex) => {
          if (isSelected) slots.push({ dayIndex, mealType: MEAL_TYPES[mealIndex] });
        });
      });

      const entries = generateWeeklyPlan(targets, slots, recipeOptions);
      await saveWeeklyPlan(session.user.id, targets, entries);
      router.replace('/plan');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Impossible de générer ton plan. Réessaie.');
    } finally {
      setGenerating(false);
    }
  };

  if (loading || !session) {
    return null;
  }

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.container}>
      <BackLink />
      <Text style={styles.title}>Choisis les repas à générer</Text>
      {DAY_LABELS.map((dayLabel, dayIndex) => (
        <View key={dayLabel} style={styles.dayRow}>
          <Text style={styles.dayLabel}>{dayLabel}</Text>
          <View style={styles.mealRow}>
            {MEAL_TYPES.map((mealType, mealIndex) => (
              <PressableScale
                key={mealType}
                onPress={() => toggle(dayIndex, mealIndex)}
                accessibilityRole="checkbox"
                accessibilityState={{ checked: selected[dayIndex][mealIndex] }}
                style={[styles.cell, selected[dayIndex][mealIndex] && styles.cellSelected]}
              >
                <Text style={selected[dayIndex][mealIndex] ? styles.cellLabelSelected : styles.cellLabel}>
                  {MEAL_TYPE_LABELS[mealType]}
                </Text>
              </PressableScale>
            ))}
          </View>
        </View>
      ))}
      {error && <Text style={styles.error}>{error}</Text>}
      <Button title="Générer le plan" onPress={handleGenerate} loading={generating} />
    </ScrollView>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    screen: { flex: 1, backgroundColor: colors.bgBase },
    container: { padding: spacing.lg, ...centeredContent },
    title: { ...typography.title, color: colors.textPrimary, marginBottom: spacing.lg },
    dayRow: { marginBottom: spacing.md },
    dayLabel: {
      ...typography.overline,
      color: colors.textSecondary,
      marginBottom: spacing.sm,
    },
    mealRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
    cell: {
      backgroundColor: colors.bgSurface,
      borderRadius: radius.sm,
      paddingVertical: spacing.sm,
      paddingHorizontal: spacing.md,
      minHeight: state.minTouchSize,
      justifyContent: 'center',
      ...shadow.card,
    },
    cellSelected: { backgroundColor: colors.accentRed, shadowColor: colors.accentRed, shadowOpacity: 0.25 },
    cellLabel: { ...typography.caption, color: colors.textSecondary },
    cellLabelSelected: { ...typography.captionStrong, color: colors.textOnAccent },
    error: { ...typography.body, color: colors.error, marginTop: spacing.md, marginBottom: spacing.sm },
  });
}
