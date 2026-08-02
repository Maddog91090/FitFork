import { useCallback, useState } from 'react';
import { View, Text, ActivityIndicator, ScrollView, StyleSheet } from 'react-native';
import { useLocalSearchParams, useFocusEffect } from 'expo-router';
import {
  fetchRecipes,
  fetchRecipeIngredients,
  fetchRecipeInstructions,
  type Recipe,
  type RecipeIngredient,
} from '../../lib/mealPlanData';
import { scaleIngredientQuantity, scaleMacroValue, clampPortionMultiplier } from '../../lib/mealPlan';
import { Card } from '../../components/ui/Card';
import { Screen } from '../../components/ui/Screen';
import { colors, spacing } from '../../theme/tokens';

export default function RecipeDetailScreen() {
  const { id, portion: portionParam } = useLocalSearchParams<{ id: string; portion?: string }>();
  const parsedPortion = Number(portionParam);
  const portionMultiplier =
    Number.isFinite(parsedPortion) && parsedPortion > 0 ? clampPortionMultiplier(parsedPortion) : 1;
  const [recipe, setRecipe] = useState<Recipe | null>(null);
  const [ingredients, setIngredients] = useState<RecipeIngredient[]>([]);
  const [instructions, setInstructions] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setError(null);
    try {
      const [allRecipes, allIngredients, steps] = await Promise.all([
        fetchRecipes(),
        fetchRecipeIngredients([id]),
        fetchRecipeInstructions(id),
      ]);
      setRecipe(allRecipes.find((r) => r.id === id) ?? null);
      setIngredients(allIngredients);
      setInstructions(steps);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur de chargement de la recette.');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  if (loading) {
    return (
      <Screen style={styles.centered}>
        <ActivityIndicator color={colors.accentRed} />
      </Screen>
    );
  }

  if (error || !recipe) {
    return (
      <Screen style={styles.centered}>
        <Text style={styles.error}>{error ?? 'Recette introuvable.'}</Text>
      </Screen>
    );
  }

  return (
    <Screen>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.container}>
        <Text style={styles.title}>{recipe.name}</Text>
      <Text style={styles.macros}>
        {scaleMacroValue(recipe.baseCalories, portionMultiplier)} kcal — {scaleMacroValue(recipe.baseProteinG, portionMultiplier)}g prot / {scaleMacroValue(recipe.baseFatG, portionMultiplier)}g lip / {scaleMacroValue(recipe.baseCarbsG, portionMultiplier)}g gluc (
        {scaleMacroValue(recipe.baseServingG, portionMultiplier)}g)
      </Text>
      {Math.round(portionMultiplier * 100) !== 100 && (
        <Text style={styles.portionBanner}>
          Portion : {Math.round(portionMultiplier * 100)} % de la recette de base
        </Text>
      )}

      <Text style={styles.sectionTitle}>Ingrédients</Text>
      <Card style={styles.card}>
        {ingredients.map((ing, index) => (
          <Text key={index} style={styles.ingredientLine}>
            {ing.ingredientName} — {scaleIngredientQuantity(ing, portionMultiplier)}
            {ing.unit}
          </Text>
        ))}
      </Card>

      <Text style={styles.sectionTitle}>Préparation</Text>
      {instructions.map((step, index) => (
        <View key={index} style={styles.stepRow}>
          <View style={styles.stepBadge}>
            <Text style={styles.stepBadgeText}>{index + 1}</Text>
          </View>
          <Text style={styles.stepText}>{step}</Text>
        </View>
      ))}
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1 },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.lg,
  },
  container: { padding: spacing.lg },
  title: { fontSize: 19, fontWeight: '800', color: colors.textPrimary, marginBottom: spacing.xs },
  macros: { color: colors.textSecondary, fontSize: 12, marginBottom: spacing.lg },
  portionBanner: { color: colors.accentRed, fontWeight: '700', fontSize: 12, marginBottom: spacing.lg },
  sectionTitle: {
    fontSize: 11,
    textTransform: 'uppercase',
    color: colors.textSecondary,
    fontWeight: '700',
    marginTop: spacing.md,
    marginBottom: spacing.sm,
  },
  card: { marginBottom: spacing.sm },
  ingredientLine: { color: colors.textPrimary, fontSize: 13, marginBottom: spacing.xs },
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
  stepBadgeText: { color: '#FFFFFF', fontSize: 11, fontWeight: '700' },
  stepText: { flex: 1, color: colors.textPrimary, fontSize: 13 },
  error: { color: colors.error },
});
