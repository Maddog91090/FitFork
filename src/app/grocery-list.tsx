import { useCallback, useEffect, useState } from 'react';
import { View, Text, ActivityIndicator, ScrollView, StyleSheet } from 'react-native';
import { Link, router, useFocusEffect } from 'expo-router';
import { useAuth } from '../lib/auth-context';
import { getCurrentPlan, fetchRecipeIngredients } from '../lib/mealPlanData';

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
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator />
      </View>
    );
  }

  if (!hasPlan) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 }}>
        <Text style={{ marginBottom: 16 }}>Aucun plan pour l'instant.</Text>
        <Link href="/generate-plan">Générer un plan</Link>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Liste de courses</Text>
      {error && <Text style={styles.error}>{error}</Text>}
      {items.map((item) => (
        <View key={`${item.name}|${item.unit}`} style={styles.row}>
          <Text style={styles.name}>{item.name}</Text>
          <Text style={styles.quantity}>
            {Math.round(item.quantity * 10) / 10} {item.unit}
          </Text>
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 24 },
  title: { fontSize: 18, fontWeight: '600', marginBottom: 16 },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  name: { flex: 1 },
  quantity: { color: '#666' },
  error: { color: 'red', marginBottom: 16 },
});
