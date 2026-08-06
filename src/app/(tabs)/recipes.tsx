import { useCallback, useEffect, useMemo, useState } from 'react';
import { View, Text, Image, ActivityIndicator, ScrollView, Pressable, StyleSheet } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { useAuth } from '../../lib/auth-context';
import { fetchRecipes, type Recipe } from '../../lib/mealPlanData';
import type { MealType } from '../../lib/mealPlan';
import { filterRecipes, type RecipeFilters, type PrepTimeFilter } from '../../lib/recipeFilters';
import { ChoiceGroup } from '../../components/ChoiceGroup';
import { TagFilterGroup } from '../../components/TagFilterGroup';
import { Card } from '../../components/ui/Card';
import { EmptyState } from '../../components/ui/EmptyState';
import { centeredContent, radius, spacing, typography, useThemeColors, type ThemeColors } from '../../theme/tokens';

const MEAL_TYPE_OPTIONS: { value: MealType | 'all'; label: string }[] = [
  { value: 'all', label: 'Tous' },
  { value: 'breakfast', label: 'Petit déjeuner' },
  { value: 'lunch', label: 'Déjeuner' },
  { value: 'dinner', label: 'Dîner' },
  { value: 'snack', label: 'Collation' },
];

const TAG_OPTIONS: { value: string; label: string }[] = [
  { value: 'poulet', label: 'Poulet' },
  { value: 'boeuf', label: 'Bœuf' },
  { value: 'porc', label: 'Porc' },
  { value: 'dinde', label: 'Dinde' },
  { value: 'poisson_fruits_de_mer', label: 'Poisson & fruits de mer' },
  { value: 'oeuf', label: 'Œuf' },
  { value: 'vegetarien', label: 'Végétarien' },
];

const PREP_TIME_OPTIONS: { value: string; label: string }[] = [
  { value: 'all', label: 'Tous' },
  { value: '15', label: '≤ 15 min' },
  { value: '30', label: '≤ 30 min' },
  { value: '45', label: '≤ 45 min' },
];

function parsePrepTimeFilter(value: string): PrepTimeFilter {
  return value === 'all' ? 'all' : (Number(value) as PrepTimeFilter);
}

export default function RecipesScreen() {
  const colors = useThemeColors();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const { session, loading } = useAuth();
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [checking, setChecking] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [mealType, setMealType] = useState<MealType | 'all'>('all');
  const [tags, setTags] = useState<string[]>([]);
  const [prepTimeValue, setPrepTimeValue] = useState('all');

  const load = useCallback(async () => {
    if (!session) return;
    setChecking(true);
    setError(null);
    try {
      const allRecipes = await fetchRecipes();
      setRecipes(allRecipes);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur de chargement des recettes.');
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

  const filters: RecipeFilters = {
    mealType,
    tags,
    maxPrepTimeMinutes: parsePrepTimeFilter(prepTimeValue),
  };
  const filteredRecipes = filterRecipes(recipes, filters);

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

      <ChoiceGroup options={MEAL_TYPE_OPTIONS} value={mealType} onChange={setMealType} />
      <TagFilterGroup options={TAG_OPTIONS} value={tags} onChange={setTags} />
      <ChoiceGroup options={PREP_TIME_OPTIONS} value={prepTimeValue} onChange={setPrepTimeValue} />

      {filteredRecipes.length === 0 ? (
        <EmptyState
          title="Aucune recette ne correspond"
          message="Essaie d'assouplir tes filtres pour voir plus de résultats."
        />
      ) : (
        filteredRecipes.map((recipe) => (
          <Pressable
            key={recipe.id}
            accessibilityRole="button"
            onPress={() => router.push({ pathname: '/recipe/[id]', params: { id: recipe.id } })}
          >
            <Card style={styles.recipeCard}>
              <View style={styles.recipeRow}>
                <View style={styles.thumbFrame}>
                  {recipe.imageUrl && <Image source={{ uri: recipe.imageUrl }} style={styles.thumb} />}
                </View>
                <View style={styles.recipeText}>
                  <Text style={styles.recipeName}>{recipe.name}</Text>
                  <Text style={styles.recipeMeta}>{Math.round(recipe.baseCalories)} kcal</Text>
                </View>
              </View>
            </Card>
          </Pressable>
        ))
      )}
    </ScrollView>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    screen: { flex: 1, backgroundColor: colors.bgBase },
    centered: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.bgBase },
    container: { padding: spacing.lg, ...centeredContent },
    error: { ...typography.body, color: colors.error, marginBottom: spacing.md },
    recipeCard: { marginBottom: spacing.sm },
    recipeRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
    thumbFrame: {
      width: 56,
      height: 56,
      borderRadius: radius.sm,
      backgroundColor: colors.bgSunken,
      overflow: 'hidden',
    },
    thumb: { width: '100%', height: '100%' },
    recipeText: { flex: 1 },
    recipeName: { ...typography.bodyStrong, color: colors.textPrimary },
    recipeMeta: { ...typography.caption, color: colors.textSecondary },
  });
}
