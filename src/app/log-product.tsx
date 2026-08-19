import { useEffect, useMemo, useState } from 'react';
import { View, Text, ScrollView, ActivityIndicator, StyleSheet, Image } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { useAuth } from '../lib/auth-context';
import { lookupProduct, type ScannedProduct } from '../lib/openFoodFacts';
import { scaleProductMacros } from '../lib/foodLog';
import { logProduct } from '../lib/foodLogData';
import type { MealType } from '../lib/mealPlan';
import { BackLink } from '../components/ui/BackLink';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { TextField } from '../components/ui/TextField';
import { EmptyState } from '../components/ui/EmptyState';
import { ErrorNotice } from '../components/ui/ErrorNotice';
import { ChoiceGroup } from '../components/ChoiceGroup';
import { materialTypography, spacing, useMaterialColors, type MaterialColorScheme } from '../theme/tokens';

const MEAL_TYPE_OPTIONS: { value: MealType; label: string }[] = [
  { value: 'breakfast', label: 'Petit-déj' },
  { value: 'lunch', label: 'Déjeuner' },
  { value: 'snack', label: 'Collation' },
  { value: 'dinner', label: 'Dîner' },
];

export default function LogProductScreen() {
  const colors = useMaterialColors();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const insets = useSafeAreaInsets();
  const { session } = useAuth();
  const { barcode } = useLocalSearchParams<{ barcode: string }>();

  const [loading, setLoading] = useState(true);
  const [product, setProduct] = useState<ScannedProduct | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [quantityInput, setQuantityInput] = useState('100');
  const [mealType, setMealType] = useState<MealType | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const result = await lookupProduct(barcode);
      setProduct(result);
    } catch (err) {
      setLoadError(err instanceof Error ? err.message : 'Erreur lors de la recherche du produit.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [barcode]);

  const quantity = Number(quantityInput.replace(',', '.'));
  const quantityValid = Number.isFinite(quantity) && quantity > 0;
  const preview = product && quantityValid ? scaleProductMacros(product, quantity) : null;

  const handleSubmit = async () => {
    if (!session || !product || !mealType || !quantityValid) return;
    setSubmitting(true);
    setSubmitError(null);
    try {
      await logProduct(session.user.id, mealType, product, quantity);
      router.replace('/journal');
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : "Erreur lors de l'ajout au journal.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <View style={[styles.centered, { paddingTop: insets.top }]}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  if (loadError) {
    return (
      <View style={[styles.screen, { paddingTop: insets.top }]}>
        <View style={styles.container}>
          <BackLink />
          <ErrorNotice message={loadError} onRetry={load} />
        </View>
      </View>
    );
  }

  if (!product) {
    return (
      <ScrollView style={[styles.screen, { paddingTop: insets.top }]} contentContainerStyle={styles.container}>
        <BackLink />
        <EmptyState
          icon={<MaterialIcons name="search-off" size={64} color={colors.onSurfaceVariant} accessible={false} />}
          title="Produit non trouvé"
          message="Ce code-barres n'est pas dans notre base. Tu peux ajouter le produit manuellement."
          actionLabel="Saisir manuellement"
          onAction={() => router.replace('/log-manual')}
          domain="nutrition"
        />
      </ScrollView>
    );
  }

  return (
    <ScrollView style={[styles.screen, { paddingTop: insets.top }]} contentContainerStyle={styles.container}>
      <BackLink />

      <View style={styles.header}>
        {product.imageUrl && <Image source={{ uri: product.imageUrl }} style={styles.productImage} />}
        <View style={styles.headerText}>
          <Text style={styles.productName}>{product.name}</Text>
          {product.brand && <Text style={styles.productBrand}>{product.brand}</Text>}
        </View>
      </View>

      <Text style={styles.sectionLabel}>Pour 100 g</Text>
      <Card style={styles.per100Card}>
        <Text style={styles.per100Text}>
          {product.caloriesPer100g} kcal · P {product.proteinGPer100g}g · L {product.fatGPer100g}g · G {product.carbsGPer100g}g
        </Text>
      </Card>

      <TextField label="Quantité (g)" value={quantityInput} onChangeText={setQuantityInput} keyboardType="numeric" />

      {preview && (
        <Card style={styles.previewCard}>
          <Text style={styles.previewValue}>{preview.calories} kcal</Text>
          <Text style={styles.previewMacros}>
            P {preview.proteinG}g · L {preview.fatG}g · G {preview.carbsG}g
          </Text>
        </Card>
      )}

      <Text style={styles.sectionLabel}>Repas</Text>
      <ChoiceGroup options={MEAL_TYPE_OPTIONS} value={mealType} onChange={setMealType} domain="nutrition" />

      {submitError && <Text style={styles.error}>{submitError}</Text>}

      <View style={styles.submitButton}>
        <Button
          title="Ajouter au journal"
          onPress={handleSubmit}
          loading={submitting}
          disabled={!mealType || !quantityValid}
          domain="nutrition"
        />
      </View>
    </ScrollView>
  );
}

function createStyles(colors: MaterialColorScheme) {
  return StyleSheet.create({
    screen: { flex: 1, backgroundColor: colors.background },
    centered: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background },
    container: { padding: spacing.lg },
    header: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, marginVertical: spacing.lg },
    productImage: { width: 64, height: 64, borderRadius: 8 },
    headerText: { flex: 1 },
    productName: { ...materialTypography.titleLarge, color: colors.onSurface },
    productBrand: { ...materialTypography.labelMedium, color: colors.onSurfaceVariant, marginTop: spacing.xs },
    sectionLabel: { ...materialTypography.overline, color: colors.onSurfaceVariant, marginBottom: spacing.sm },
    per100Card: { marginBottom: spacing.lg },
    per100Text: { ...materialTypography.bodyMedium, color: colors.onSurface },
    previewCard: { alignItems: 'center', marginVertical: spacing.lg },
    previewValue: { ...materialTypography.headlineLarge, color: colors.onSurface },
    previewMacros: { ...materialTypography.labelMedium, color: colors.onSurfaceVariant, marginTop: spacing.xs },
    error: { ...materialTypography.bodyLarge, color: colors.error, marginTop: spacing.md },
    submitButton: { marginTop: spacing.xl },
  });
}
