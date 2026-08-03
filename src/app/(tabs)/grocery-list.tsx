import { useCallback, useEffect, useState } from 'react';
import { View, Text, ActivityIndicator, ScrollView, StyleSheet } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { useAuth } from '../../lib/auth-context';
import { getCurrentPlan, fetchRecipeIngredients } from '../../lib/mealPlanData';
import { Card } from '../../components/ui/Card';
import { EmptyState } from '../../components/ui/EmptyState';
import { colors, spacing, typography } from '../../theme/tokens';

type AggregatedIngredient = { name: string; quantity: number; unit: string };

export default function GroceryListScreen() {
  const { session, loading } = useAuth();
  const [items, setItems] = useState<AggregatedIngredient[]>([]);
  const [hasPlan, setHasPlan] = useState(true);
  const [checking, setChecking] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!session) return;
    setChecking(true);
    setError(null);
    try {
      const plan = await getCurrentPlan(session.user.id);
      if (!plan || plan.entries.length === 0) {
        setHasPlan(false);
        setItems([]);
        return;
      }
      setHasPlan(true);

      const recipeIds = Array.from(new Set(plan.entries.map((e) => e.recipeId)));
      const ingredients = await fetchRecipeIngredients(recipeIds);

      const totals = new Map<string, AggregatedIngredient>();
      for (const entry of plan.entries) {
        const recipeIngredients = ingredients.filter((i) => i.recipeId === entry.recipeId);
        for (const ingredient of recipeIngredients) {
          const key = `${ingredient.ingredientName}|${ingredient.unit}`;
          const scaledQuantity = ingredient.quantity * entry.portionMultiplier;
          const existing = totals.get(key);
          if (existing) {
            existing.quantity += scaledQuantity;
          } else {
            totals.set(key, { name: ingredient.ingredientName, quantity: scaledQuantity, unit: ingredient.unit });
          }
        }
      }

      setItems(Array.from(totals.values()).sort((a, b) => a.name.localeCompare(b.name)));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur de chargement de la liste de courses.');
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

  if (loading || !session || checking) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator color={colors.accentRed} />
      </View>
    );
  }

  if (!hasPlan) {
    return (
      <View style={styles.centered}>
        <EmptyState
          illustration={require('../../../assets/images/illustrations/empty-grocery.png')}
          title="Aucun plan pour l'instant"
          message="Génère un plan de repas pour obtenir ta liste de courses."
          actionLabel="Générer un plan"
          onAction={() => router.push('/generate-plan')}
        />
      </View>
    );
  }

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.container}>
      <Text style={styles.title}>Liste de courses</Text>
      {error && <Text style={styles.error}>{error}</Text>}
      <Card>
        {items.map((item, index) => (
          <View
            key={`${item.name}|${item.unit}`}
            style={[styles.row, index === items.length - 1 && styles.rowLast]}
          >
            <Text style={styles.name}>{item.name}</Text>
            <Text style={styles.quantity}>
              {Math.round(item.quantity * 10) / 10} {item.unit}
            </Text>
          </View>
        ))}
      </Card>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bgBase },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.bgBase,
    padding: spacing.lg,
  },
  container: { padding: spacing.lg },
  title: { ...typography.display, color: colors.textPrimary, marginBottom: spacing.lg },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: spacing.sm + 1,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
  },
  rowLast: { borderBottomWidth: 0 },
  name: { ...typography.body, flex: 1, color: colors.textPrimary },
  quantity: { ...typography.captionStrong, color: colors.textSecondary },
  error: { ...typography.body, color: colors.error, marginBottom: spacing.md },
});
