import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { View, Text, Pressable, ActivityIndicator, ScrollView, Platform, StyleSheet } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { useAuth } from '../../lib/auth-context';
import { getCurrentPlan, updatePlanEntry, fetchRecipes, type Recipe, type SavedPlan } from '../../lib/mealPlanData';
import { pickReplacementRecipe, MEAL_TYPE_RATIOS, clampPortionMultiplier, type MealType } from '../../lib/mealPlan';
import { Card } from '../../components/ui/Card';
import { EmptyState } from '../../components/ui/EmptyState';
import { Screen } from '../../components/ui/Screen';
import { StaggerItem } from '../../components/ui/StaggerItem';
import { spacing, type ThemeColors } from '../../theme/tokens';
import { typography } from '../../theme/typography';
import { useColors } from '../../theme/useColors';

const isAndroid = Platform.OS === 'android';
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
  const hasLoadedOnce = useRef(false);
  const scrollRef = useRef<ScrollView>(null);
  const hasEnteredRef = useRef(false);
  const colors = useColors();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const shouldAnimateEntrance = !hasEnteredRef.current;

  useEffect(() => {
    if (plan) hasEnteredRef.current = true;
  });

  const load = useCallback(async () => {
    if (!session) return;
    if (!hasLoadedOnce.current) setChecking(true);
    setError(null);
    try {
      const [currentPlan, allRecipes] = await Promise.all([getCurrentPlan(session.user.id), fetchRecipes()]);
      setPlan(currentPlan);
      setRecipes(allRecipes);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur de chargement du plan.');
    } finally {
      setChecking(false);
      hasLoadedOnce.current = true;
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
        scrollRef.current?.scrollTo({ y: 0, animated: true });
        return;
      }

      const slotTarget = plan.targetCalories * MEAL_TYPE_RATIOS[mealType];
      const newMultiplier = clampPortionMultiplier(slotTarget / replacement.baseCalories);

      await updatePlanEntry(entryId, replacement.id, newMultiplier);
      setPlan((prev) =>
        prev
          ? {
              ...prev,
              entries: prev.entries.map((e) =>
                e.id === entryId ? { ...e, recipeId: replacement.id, portionMultiplier: newMultiplier } : e
              ),
            }
          : prev
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur lors de l'échange.");
      scrollRef.current?.scrollTo({ y: 0, animated: true });
    } finally {
      setSwappingId(null);
    }
  };

  if (loading || !session || checking) {
    return (
      <Screen edges={['top']} style={styles.centered}>
        <ActivityIndicator color={colors.accentRed} />
      </Screen>
    );
  }

  if (!plan || plan.entries.length === 0) {
    return (
      <Screen edges={['top']} style={styles.centered}>
        <EmptyState
          icon={<Text style={styles.emptyIcon}>📋</Text>}
          title="Aucun plan pour l'instant"
          message="Génère ton premier plan de repas de la semaine."
          actionLabel="Générer un plan"
          onAction={() => router.push('/generate-plan')}
        />
      </Screen>
    );
  }

  return (
    <Screen edges={['top']}>
      <ScrollView ref={scrollRef} style={styles.scroll} contentContainerStyle={styles.container}>
        {error && <Text style={styles.error}>{error}</Text>}
      {DAY_LABELS.map((dayLabel, dayIndex) => {
        const dayEntries = plan.entries.filter((e) => e.dayIndex === dayIndex);
        if (dayEntries.length === 0) return null;
        return (
          <StaggerItem key={dayLabel} index={dayIndex} enabled={shouldAnimateEntrance} style={styles.dayBlock}>
            <Text style={styles.dayLabel} accessibilityRole="header">{dayLabel}</Text>
            {dayEntries.map((entry) => {
              const recipe = recipeById.get(entry.recipeId);
              return (
                <Card key={entry.id} style={styles.entryCard}>
                  <View style={styles.entryRow}>
                    <Pressable
                      style={styles.entryInfo}
                      accessibilityRole="button"
                      accessibilityLabel={`${MEAL_TYPE_LABELS[entry.mealType]} : ${recipe ? recipe.name : entry.recipeId}, voir la recette`}
                      android_ripple={{ color: colors.divider }}
                      onPress={() =>
                        router.push({
                          pathname: '/recipe/[id]',
                          params: { id: entry.recipeId, portion: String(entry.portionMultiplier) },
                        })
                      }
                    >
                      <Text style={styles.mealTypeLabel}>{MEAL_TYPE_LABELS[entry.mealType]}</Text>
                      <Text style={styles.recipeName}>
                        {recipe ? recipe.name : entry.recipeId} ({Math.round(entry.portionMultiplier * 100)}%)
                      </Text>
                    </Pressable>
                    <Pressable
                      style={styles.swapButton}
                      hitSlop={8}
                      android_ripple={{ color: colors.divider }}
                      onPress={() => handleSwap(entry.id, entry.mealType, entry.recipeId)}
                      disabled={swappingId === entry.id}
                      accessibilityRole="button"
                      accessibilityLabel={`Échanger ${recipe ? recipe.name : entry.recipeId} contre une autre recette`}
                      accessibilityState={{ busy: swappingId === entry.id }}
                    >
                      {swappingId === entry.id ? (
                        <ActivityIndicator size="small" color={colors.accentRed} />
                      ) : (
                        <Text style={styles.swapHint}>Échanger</Text>
                      )}
                    </Pressable>
                  </View>
                </Card>
              );
            })}
          </StaggerItem>
        );
      })}
      </ScrollView>
    </Screen>
  );
}

const makeStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    scroll: { flex: 1 },
    centered: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      padding: spacing.lg,
    },
    container: { padding: spacing.lg },
    dayBlock: { marginBottom: spacing.lg },
    dayLabel: {
      ...typography.label,
      textTransform: 'uppercase',
      color: colors.textSecondary,
      fontWeight: '700',
      marginBottom: spacing.sm,
    },
    entryCard: { marginBottom: spacing.sm, overflow: isAndroid ? 'hidden' : 'visible' },
    entryRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    entryInfo: {
      flexDirection: 'row',
      alignItems: 'center',
      flex: 1,
      minHeight: 44,
    },
    mealTypeLabel: { ...typography.label, width: 80, color: colors.textSecondary },
    recipeName: { ...typography.body, flex: 1, color: colors.textPrimary, fontWeight: '600' },
    swapButton: {
      marginLeft: spacing.md,
      paddingVertical: spacing.sm,
      paddingHorizontal: spacing.sm,
      // Reserves the "Échanger" text's width so swapping to the spinner doesn't shift the row.
      minWidth: 70,
      alignItems: 'center',
    },
    swapHint: { ...typography.caption, color: colors.accentRed, fontWeight: '700' },
    error: { color: colors.error, marginBottom: spacing.md },
    emptyIcon: { fontSize: 32 },
  });
