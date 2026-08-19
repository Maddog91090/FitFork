import { supabase } from './supabase';

export type ScannedProduct = {
  barcode: string;
  name: string;
  brand: string | null;
  caloriesPer100g: number;
  proteinGPer100g: number;
  fatGPer100g: number;
  carbsGPer100g: number;
  imageUrl: string | null;
};

async function fetchFromCache(barcode: string): Promise<ScannedProduct | null> {
  const { data, error } = await supabase
    .from('scanned_products')
    .select('barcode, name, brand, calories_per_100g, protein_g_per_100g, fat_g_per_100g, carbs_g_per_100g, image_url')
    .eq('barcode', barcode)
    .maybeSingle();

  if (error) throw error;
  if (!data) return null;

  return {
    barcode: data.barcode,
    name: data.name,
    brand: data.brand,
    caloriesPer100g: data.calories_per_100g,
    proteinGPer100g: data.protein_g_per_100g,
    fatGPer100g: data.fat_g_per_100g,
    carbsGPer100g: data.carbs_g_per_100g,
    imageUrl: data.image_url,
  };
}

/** Best-effort: a caching failure must never block showing the product to the user. */
async function cacheProduct(product: ScannedProduct): Promise<void> {
  try {
    await supabase.from('scanned_products').upsert({
      barcode: product.barcode,
      name: product.name,
      brand: product.brand,
      calories_per_100g: product.caloriesPer100g,
      protein_g_per_100g: product.proteinGPer100g,
      fat_g_per_100g: product.fatGPer100g,
      carbs_g_per_100g: product.carbsGPer100g,
      image_url: product.imageUrl,
    });
  } catch {
    // Cache is a nice-to-have; the product we already fetched is still returned.
  }
}

/**
 * Open Food Facts coverage is uneven outside major brands — a null return
 * here (product genuinely absent, or present but missing usable calorie
 * data) is expected often enough that callers must offer manual entry as a
 * fallback rather than treating it as an error.
 */
async function fetchFromOpenFoodFacts(barcode: string): Promise<ScannedProduct | null> {
  const response = await fetch(
    `https://world.openfoodfacts.org/api/v2/product/${encodeURIComponent(barcode)}.json?fields=product_name,brands,nutriments,image_url`
  );
  if (!response.ok) throw new Error('Erreur réseau lors de la recherche du produit.');

  const json = await response.json();
  if (json.status !== 1 || !json.product) return null;

  const product = json.product;
  const calories = product.nutriments?.['energy-kcal_100g'];
  if (typeof calories !== 'number') return null;

  return {
    barcode,
    name: product.product_name?.trim() || 'Produit sans nom',
    brand: product.brands?.split(',')[0]?.trim() || null,
    caloriesPer100g: calories,
    proteinGPer100g: product.nutriments?.proteins_100g ?? 0,
    fatGPer100g: product.nutriments?.fat_100g ?? 0,
    carbsGPer100g: product.nutriments?.carbohydrates_100g ?? 0,
    imageUrl: product.image_url || null,
  };
}

/** Checks the shared Supabase cache first, then falls back to the Open Food Facts API. */
export async function lookupProduct(barcode: string): Promise<ScannedProduct | null> {
  const cached = await fetchFromCache(barcode);
  if (cached) return cached;

  const fetched = await fetchFromOpenFoodFacts(barcode);
  if (fetched) await cacheProduct(fetched);
  return fetched;
}
