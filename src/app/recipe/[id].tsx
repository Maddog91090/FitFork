import { useCallback, useMemo, useState } from 'react';
import { View, Text, ActivityIndicator, ScrollView, StyleSheet, Image } from 'react-native';
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
import { ErrorNotice } from '../../components/ui/ErrorNotice';
import { BackLink } from '../../components/ui/BackLink';
import { centeredContent, radius, shadow, spacing, typography, useThemeColors, type ThemeColors } from '../../theme/tokens';

export default function RecipeDetailScreen() {
  const colors = useThemeColors();
  const styles = useMemo(() => createStyles(colors), [colors]);
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
      <View style={styles.centered}>
        <ActivityIndicator color={colors.accentRed} />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centered}>
        <BackLink />
        <ErrorNotice message={error} onRetry={load} />
      </View>
    );
  }

  if (!recipe) {
    return (
      <View style={styles.centered}>
        <BackLink />
        <Text style={styles.error}>Recette introuvable.</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.container}>
      <BackLink />
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

      {recipe.imageUrl && (
        <View style={styles.photoFrame}>
          <Image source={{ uri: recipe.imageUrl }} style={styles.photo} accessibilityLabel={recipe.name} />
        </View>
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
    title: { ...typography.display, color: colors.textPrimary, marginBottom: spacing.xs },
    macros: { ...typography.caption, color: colors.textSecondary, marginBottom: spacing.lg },
    portionBanner: { ...typography.captionStrong, color: colors.accentRedDeep, marginBottom: spacing.lg },
    photoFrame: {
      width: '100%',
      aspectRatio: 4 / 3,
      borderRadius: radius.lg,
      backgroundColor: colors.bgSunken,
      marginBottom: spacing.lg,
      overflow: 'hidden',
      ...shadow.card,
    },
    photo: {
      width: '100%',
      height: '100%',
    },
    sectionTitle: {
      ...typography.overline,
      color: colors.textSecondary,
      marginTop: spacing.md,
      marginBottom: spacing.sm,
    },
    card: { marginBottom: spacing.sm },
    ingredientLine: { ...typography.body, color: colors.textPrimary, marginBottom: spacing.xs },
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
