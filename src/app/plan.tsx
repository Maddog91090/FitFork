import { useCallback, useEffect, useState } from 'react';
import { View, Text, Pressable, ActivityIndicator, ScrollView, StyleSheet } from 'react-native';
import { Link, router, useFocusEffect } from 'expo-router';
import { useAuth } from '../lib/auth-context';
import { getCurrentPlan, updatePlanEntry, fetchRecipes, type Recipe, type SavedPlan } from '../lib/mealPlanData';
import { pickReplacementRecipe, MEAL_TYPE_RATIOS, clampPortionMultiplier, type MealType } from '../lib/mealPlan';

const DAY_LABELS = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche'];
const MEAL_TYPE_LABELS: Record<MealType, string> = {
  breakfast: 'Petit-déj',
  lunch: 'Déjeuner',
  dinner: 'Dîner',
  snack: 'Collation',
};

export default function PlanScreen() {
  const { session, loading } = useAuth();
  const [plan, setPlan] = useState<SavedPlan | null>(null);
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [checking, setChecking] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [swappingId, setSwappingId] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!session) return;
    setChecking(true);
    setError(null);
    try {
      const [currentPlan, allRecipes] = await Promise.all([getCurrentPlan(session.user.id), fetchRecipes()]);
      setPlan(currentPlan);
      setRecipes(allRecipes);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur de chargement du plan.');
    } finally {
      setChecking(false);
    }
  }, [session]);

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

  const recipeById = new Map(recipes.map((r) => [r.id, r]));

  const handleSwap = async (entryId: string, mealType: MealType, currentRecipeId: string) => {
    if (!plan) return;
    setSwappingId(entryId);
    setError(null);
    try {
      const recipeOptions = recipes.map((r) => ({ id: r.id, mealType: r.mealType, baseCalories: r.baseCalories }));
      const replacement = pickReplacementRecipe(mealType, currentRecipeId, recipeOptions);
      if (!replacement) {
        setError('Aucune autre recette disponible pour ce repas.');
        return;
      }

      const currentEntry = plan.entries.find((e) => e.id === entryId);
      if (!currentEntry) return;

      const dailyTargetCalories = currentTargetCalories(currentEntry, recipeById, mealType);
      const slotTarget = dailyTargetCalories * MEAL_TYPE_RATIOS[mealType];
      const newMultiplier = clampPortionMultiplier(slotTarget / replacement.baseCalories);

      await updatePlanEntry(entryId, replacement.id, newMultiplier);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors de l\'échange.');
    } finally {
      setSwappingId(null);
    }
  };

  if (loading || !session || checking) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator />
      </View>
    );
  }

  if (!plan || plan.entries.length === 0) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 }}>
        <Text style={{ marginBottom: 16 }}>Aucun plan pour l'instant.</Text>
        <Link href="/generate-plan">Générer un plan</Link>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      {error && <Text style={styles.error}>{error}</Text>}
      {DAY_LABELS.map((dayLabel, dayIndex) => {
        const dayEntries = plan.entries.filter((e) => e.dayIndex === dayIndex);
        if (dayEntries.length === 0) return null;
        return (
          <View key={dayLabel} style={styles.dayBlock}>
            <Text style={styles.dayLabel}>{dayLabel}</Text>
            {dayEntries.map((entry) => {
              const recipe = recipeById.get(entry.recipeId);
              return (
                <Pressable
                  key={entry.id}
                  style={styles.entryRow}
                  onPress={() => handleSwap(entry.id, entry.mealType, entry.recipeId)}
                  disabled={swappingId === entry.id}
                >
                  <Text style={styles.mealTypeLabel}>{MEAL_TYPE_LABELS[entry.mealType]}</Text>
                  <Text style={styles.recipeName}>
                    {recipe ? recipe.name : entry.recipeId} ({Math.round(entry.portionMultiplier * 100)}%)
                  </Text>
                  <Text style={styles.swapHint}>{swappingId === entry.id ? '...' : 'Échanger'}</Text>
                </Pressable>
              );
            })}
          </View>
        );
      })}
      <Link href="/grocery-list" style={styles.groceryLink}>
        Voir la liste de courses
      </Link>
    </ScrollView>
  );
}

// SavedPlan.entries only stores portionMultiplier, not the daily calorie target that
// produced it. Reconstruct it from the entry being replaced instead of adding a new
// column: since portionMultiplier = clamp(dailyTarget * mealTypeRatio / baseCalories),
// un-clamping by re-deriving from the current (already-clamped) values keeps the swap
// consistent with what's on screen.
function currentTargetCalories(
  currentEntry: SavedPlan['entries'][number],
  recipeById: Map<string, Recipe>,
  mealType: MealType
): number {
  const currentRecipe = recipeById.get(currentEntry.recipeId);
  if (!currentRecipe) return 0;
  return (currentRecipe.baseCalories * currentEntry.portionMultiplier) / MEAL_TYPE_RATIOS[mealType];
}

const styles = StyleSheet.create({
  container: { padding: 24 },
  dayBlock: { marginBottom: 20 },
  dayLabel: { fontSize: 16, fontWeight: '700', marginBottom: 8 },
  entryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  mealTypeLabel: { width: 90, color: '#666' },
  recipeName: { flex: 1 },
  swapHint: { color: '#208AEF' },
  error: { color: 'red', marginBottom: 16 },
  groceryLink: { marginTop: 16, textAlign: 'center' },
});
