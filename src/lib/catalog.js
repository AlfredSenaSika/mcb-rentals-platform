import { supabase } from './supabase';

// Everyday Ghanaian / shoot-floor aliases so the Visual AI Assistant & search
// understand casual descriptions (e.g. "metal stand" -> C-Stand, "umbrella" -> Softbox).
const CASUAL_ALIASES = [
  { terms: ['metal stand', 'heavy stand', 'steel stand', 'c stand', 'c-stand'], keywords: ['c-stand', 'c stand', 'century stand', 'stand'] },
  { terms: ['umbrella', 'round light', 'soft light', 'octagon', 'diffuser'], keywords: ['softbox', 'dome', 'octabox', 'umbrella', 'modifier'] },
  { terms: ['wireless video', 'transmitter', 'sender', 'monitor link'], keywords: ['hollyland', 'mars', '400s', 'wireless'] },
  { terms: ['lapel', 'clip mic', 'collar mic', 'wireless mic', 'interview mic'], keywords: ['rode', 'sennheiser', 'lavalier', 'mic', 'zoom'] },
  { terms: ['stabilizer', 'steadycam', 'steady cam', 'gimbal'], keywords: ['ronin', 'rs3', 'rs4', 'gimbal', 'dji'] },
  { terms: ['big light', 'daylight', 'cob light', 'studio light'], keywords: ['aputure', 'amaran', '300d', '600d', '150c', 'led'] },
  { terms: ['drone', 'aerial', 'flying camera'], keywords: ['mavic', 'drone', 'dji'] },
  { terms: ['zoom lens', 'wedding lens', 'telephoto'], keywords: ['70-200', '24-70', '24-105'] },
];

export function resolveProductImage(product) {
  // Supports self-hosted Supabase Storage WebP bucket once migrated, with safe fallback.
  if (product.storage_image_path) {
    const { data } = supabase.storage
      .from('equipment-images')
      .getPublicUrl(product.storage_image_path);
    if (data?.publicUrl) return data.publicUrl;
  }
  return product.featured_image || '';
}

export async function fetchPublishedCatalog() {
  const [{ data: products, error }, { data: stockRows }] = await Promise.all([
    supabase
      .from('inv_products')
      .select(
        'id, name, brand, model, category, subcategory, short_desc, specs, accessories, price_daily, price_half_day, price_weekly, deposit, quantity, featured_image, availability_status, maintenance_status, status'
      )
      .eq('status', 'published')
      .order('category', { ascending: true })
      .order('name', { ascending: true }),
    supabase.from('v_live_equipment_stock').select('*'),
  ]);

  if (error) throw error;

  const stockMap = new Map((stockRows || []).map((s) => [s.product_id, s]));

  return (products || []).map((p) => {
    const live = stockMap.get(p.id);
    const totalOwned = live ? live.total_owned : Number(p.quantity || 1);
    const availableCount = live
      ? live.available_count
      : p.availability_status === 'available' && p.maintenance_status !== 'faulty'
        ? Number(p.quantity || 1)
        : 0;

    return {
      ...p,
      totalOwned,
      availableCount,
      outCount: live ? live.out_count : 0,
      packedCount: live ? live.packed_count : 0,
      faultyCount: live ? live.faulty_count : 0,
      resolvedImage: resolveProductImage(p),
    };
  });
}

export function searchCatalogWithAliases(products, query) {
  const q = (query || '').trim().toLowerCase();
  if (!q) return [];

  const expandedTerms = new Set(q.split(/\s+/).filter((w) => w.length > 1));
  for (const alias of CASUAL_ALIASES) {
    if (alias.terms.some((t) => q.includes(t))) {
      alias.keywords.forEach((k) => expandedTerms.add(k));
    }
  }

  return products
    .map((p) => {
      const haystack = `${p.name} ${p.brand || ''} ${p.model || ''} ${p.category || ''} ${p.subcategory || ''} ${p.short_desc || ''}`.toLowerCase();
      let score = 0;
      if (haystack.includes(q)) score += 10;
      for (const term of expandedTerms) {
        if (haystack.includes(term)) score += 3;
      }
      return { product: p, score };
    })
    .filter((entry) => entry.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 4)
    .map((entry) => entry.product);
}
