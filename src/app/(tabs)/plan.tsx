import { useCallback, useEffect, useMemo, useState } from 'react';
import { View, Text, ActivityIndicator, ScrollView, StyleSheet } from 'react-native';
import { Image } from 'expo-image';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router, useFocusEffect } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { useAuth } from '../../lib/auth-context';
import { getCurrentPlan, updatePlanEntry, fetchRecipes, type Recipe, type SavedPlan } from '../../lib/mealPlanData';
import {
  pickReplacementRecipe,
  MEAL_TYPE_RATIOS,
  clampPortionMultiplier,
  DAY_LABELS,
  todayDayIndex,
  type MealType,
} from '../../lib/mealPlan';
import { ChoiceGroup } from '../../components/ChoiceGroup';
import { Card } from '../../components/ui/Card';
import { EmptyState } from '../../components/ui/EmptyState';
import { ErrorNotice } from '../../components/ui/ErrorNotice';
import { PressableScale } from '../../components/ui/PressableScale';
import {
  centeredContent,
  typography,
  radius,
  spacing,
  state,
  useThemeColors,
  type ThemeColors,
} from '../../theme/tokens';

const MEAL_TYPE_LABELS: Record<MealType, string> = {
  breakfast: 'Petit-déj',
  lunch: 'Déjeuner',
  dinner: 'Dîner',
  snack: 'Collation',
};

const DAY_TAB_OPTIONS = DAY_LABELS.map((label, index) => ({ value: String(index), label }));

export default function PlanScreen() {
  const colors = useThemeColors();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const insets = useSafeAreaInsets();
  const { session, loading } = useAuth();
  const [plan, setPlan] = useState<SavedPlan | null>(null);
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [checking, setChecking] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [swappingId, setSwappingId] = useState<string | null>(null);
  const [activeDayIndex, setActiveDayIndex] = useState(todayDayIndex());

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
      const recipeOptions = recipes.map((r) => ({
        id: r.id,
        mealType: r.mealType,
        baseCalories: r.baseCalories,
        baseProteinG: r.baseProteinG,
        baseFatG: r.baseFatG,
        baseCarbsG: r.baseCarbsG,
      }));
      const replacement = pickReplacementRecipe(mealType, currentRecipeId, recipeOptions);
      if (!replacement) {
        setError('Aucune autre recette disponible pour ce repas.');
        return;
      }

      const slotTarget = plan.targetCalories * MEAL_TYPE_RATIOS[mealType];
      const newMultiplier = clampPortionMultiplier(slotTarget / replacement.baseCalories);

      await updatePlanEntry(entryId, replacement.id, newMultiplier);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur lors de l'échange.");
    } finally {
      setSwappingId(null);
    }
  };

  if (loading || !session || checking) {
    return (
      <View style={[styles.centered, { paddingTop: insets.top }]}>
        <ActivityIndicator color={colors.domainNutrition} />
      </View>
    );
  }

  if (error && !plan) {
    return (
      <View style={[styles.centered, { paddingTop: insets.top }]}>
        <ErrorNotice message={error} onRetry={load} />
      </View>
    );
  }

  if (!plan || plan.entries.length === 0) {
    return (
      <View style={[styles.centered, { paddingTop: insets.top }]}>
        <EmptyState
          icon={
            <MaterialIcons
              testID="empty-state-icon"
              name="event"
              size={64}
              color={colors.textSecondary}
              accessible={false}
            />
          }
          title="Aucun plan pour l'instant"
          message="Génère ton premier plan de repas de la semaine."
          actionLabel="Générer un plan"
          onAction={() => router.push('/generate-plan')}
          domain="nutrition"
        />
      </View>
    );
  }

  const dayEntries = plan.entries.filter((e) => e.dayIndex === activeDayIndex);

  return (
    <ScrollView style={[styles.screen, { paddingTop: insets.top }]} contentContainerStyle={styles.container}>
      {error && <ErrorNotice message={error} onRetry={load} />}

      <ChoiceGroup
        options={DAY_TAB_OPTIONS}
        value={String(activeDayIndex)}
        onChange={(value) => setActiveDayIndex(Number(value))}
        domain="nutrition"
      />

      {dayEntries.length === 0 ? (
        <Text style={styles.emptyDayText}>Rien de prévu ce jour-là.</Text>
      ) : (
        dayEntries.map((entry) => {
          const recipe = recipeById.get(entry.recipeId);
          return (
            <Card key={entry.id} style={styles.entryCard}>
              <View style={styles.entryRow}>
                <PressableScale
                  style={styles.entryInfo}
                  accessibilityRole="button"
                  onPress={() =>
                    router.push({
                      pathname: '/recipe/[id]',
                      params: { id: entry.recipeId, portion: String(entry.portionMultiplier) },
                    })
                  }
                >
                  <View style={styles.thumbFrame}>
                    {recipe?.imageUrl && (
                      <Image source={{ uri: recipe.imageUrl }} style={styles.thumb} contentFit="cover" />
                    )}
                  </View>
                  <View style={styles.entryText}>
                    <Text style={styles.mealTypeLabel}>{MEAL_TYPE_LABELS[entry.mealType]}</Text>
                    <Text style={styles.recipeName}>
                      {recipe ? recipe.name : entry.recipeId} ({Math.round(entry.portionMultiplier * 100)}%)
                    </Text>
                  </View>
                </PressableScale>
                <PressableScale
                  onPress={() => handleSwap(entry.id, entry.mealType, entry.recipeId)}
                  disabled={swappingId === entry.id}
                  accessibilityRole="button"
                  hitSlop={state.hitSlop}
                  style={styles.swapTouchable}
                >
                  {swappingId === entry.id ? (
                    <ActivityIndicator size="small" color={colors.domainNutrition} />
                  ) : (
                    <Text style={styles.swapHint}>Échanger</Text>
                  )}
                </PressableScale>
              </View>
            </Card>
          );
        })
      )}
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
    emptyDayText: { ...typography.body, color: colors.textSecondary, marginTop: spacing.md },
    entryCard: { marginBottom: spacing.sm },
    entryRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    entryInfo: { flexDirection: 'row', alignItems: 'center', flex: 1, gap: spacing.md },
    thumbFrame: {
      width: 56,
      height: 56,
      borderRadius: radius.sm,
      backgroundColor: colors.bgSunken,
      overflow: 'hidden',
    },
    thumb: { width: '100%', height: '100%' },
    entryText: { flex: 1 },
    mealTypeLabel: { ...typography.caption, color: colors.textSecondary },
    recipeName: { ...typography.bodyStrong, color: colors.textPrimary },
    swapTouchable: {
      minHeight: state.minTouchSize,
      minWidth: state.minTouchSize,
      justifyContent: 'center',
      alignItems: 'center',
      marginLeft: spacing.md,
      paddingHorizontal: spacing.sm,
    },
    swapHint: { ...typography.captionStrong, color: colors.domainNutritionDeep },
  });
}
