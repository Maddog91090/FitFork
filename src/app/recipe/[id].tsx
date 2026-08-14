import { useCallback, useMemo, useState } from 'react';
import { View, Text, ActivityIndicator, ScrollView, StyleSheet } from 'react-native';
import { Image } from 'expo-image';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
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
import {
  centeredContent,
  materialElevation,
  materialTypography,
  radius,
  spacing,
  useMaterialColors,
  useMaterialTertiary,
  type MaterialColorScheme,
  type MaterialTertiary,
} from '../../theme/tokens';

export default function RecipeDetailScreen() {
  const colors = useMaterialColors();
  const nutrition = useMaterialTertiary('nutrition');
  const styles = useMemo(() => createStyles(colors, nutrition), [colors, nutrition]);
  const insets = useSafeAreaInsets();
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
      <View style={[styles.centered, { paddingTop: insets.top }]}>
        <ActivityIndicator color={nutrition.tertiary} />
      </View>
    );
  }

  if (error) {
    return (
      <View style={[styles.centered, { paddingTop: insets.top }]}>
        <BackLink />
        <ErrorNotice message={error} onRetry={load} />
      </View>
    );
  }

  if (!recipe) {
    return (
      <View style={[styles.centered, { paddingTop: insets.top }]}>
        <BackLink />
        <Text style={styles.error}>Recette introuvable.</Text>
      </View>
    );
  }

  return (
    <ScrollView style={[styles.screen, { paddingTop: insets.top }]} contentContainerStyle={styles.container}>
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
          <Image
            source={{ uri: recipe.imageUrl }}
            style={styles.photo}
            contentFit="cover"
            accessibilityLabel={recipe.name}
          />
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

function createStyles(colors: MaterialColorScheme, nutrition: MaterialTertiary) {
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
    title: { ...materialTypography.displayMedium, color: colors.onSurface, marginBottom: spacing.xs },
    macros: { ...materialTypography.labelMedium, color: colors.onSurfaceVariant, marginBottom: spacing.lg },
    portionBanner: { ...materialTypography.labelSmall, color: nutrition.tertiaryContainer, marginBottom: spacing.lg },
    photoFrame: {
      width: '100%',
      aspectRatio: 4 / 3,
      borderRadius: radius.lg,
      backgroundColor: colors.surfaceVariant,
      marginBottom: spacing.lg,
      overflow: 'hidden',
      ...materialElevation,
    },
    photo: {
      width: '100%',
      height: '100%',
    },
    sectionTitle: {
      ...materialTypography.overline,
      color: colors.onSurfaceVariant,
      marginTop: spacing.md,
      marginBottom: spacing.sm,
    },
    card: { marginBottom: spacing.sm },
    ingredientLine: { ...materialTypography.bodyLarge, color: colors.onSurface, marginBottom: spacing.xs },
    stepRow: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.sm, alignItems: 'flex-start' },
    stepBadge: {
      width: 20,
      height: 20,
      borderRadius: 10,
      backgroundColor: nutrition.tertiary,
      alignItems: 'center',
      justifyContent: 'center',
      marginTop: 1,
    },
    stepBadgeText: { ...materialTypography.overline, color: nutrition.onTertiary, letterSpacing: 0 },
    stepText: { ...materialTypography.bodyLarge, flex: 1, color: colors.onSurface },
    error: { ...materialTypography.bodyLarge, color: colors.error },
  });
}
