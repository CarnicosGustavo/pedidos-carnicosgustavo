import { PRODUCTS, type Product, type Unit } from '../data/products'
import { REGIONS, type Region, type RegionId } from '../data/regions'
import { SEARCH_SYNONYMS } from '../data/synonyms'
import { getSupabase, isSupabaseConfigured } from './supabase'

const CACHE_KEY = 'cg_catalog_v1'
const CACHE_TTL_MS = 5 * 60 * 1000 // 5 min

export type CatalogData = {
  products: Product[]
  regions: Region[]
  synonyms: Record<string, string[]>
  /** true si estos datos vienen de Supabase, false si son fallback local. */
  fromRemote: boolean
  /** timestamp de cuando se cargaron. */
  fetchedAt: number
}

const FALLBACK: CatalogData = {
  products: PRODUCTS,
  regions: REGIONS,
  synonyms: SEARCH_SYNONYMS,
  fromRemote: false,
  fetchedAt: Date.now(),
}

type CachedShape = { data: CatalogData; cachedAt: number }

function readCache(): CatalogData | null {
  try {
    const raw = localStorage.getItem(CACHE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as CachedShape
    if (!parsed?.data || !parsed.cachedAt) return null
    if (Date.now() - parsed.cachedAt > CACHE_TTL_MS) return null
    return { ...parsed.data, fetchedAt: parsed.cachedAt }
  } catch {
    return null
  }
}

function writeCache(data: CatalogData) {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify({ data, cachedAt: Date.now() } satisfies CachedShape))
  } catch {
    /* ignore quota */
  }
}

export function invalidateCatalogCache() {
  try {
    localStorage.removeItem(CACHE_KEY)
  } catch {
    /* ignore */
  }
}

type DbProduct = {
  id: string
  name: string
  region_id: string
  category: string
  default_unit: Unit
  photo_url: string | null
  sort_order: number
  is_active: boolean
  description: string | null
}

type DbRegion = {
  id: string
  name: string
  short_name: string
  emoji: string
  color: string
  sort_order: number
  is_active: boolean
}

type DbSynonym = {
  product_id: string
  term: string
}

function mapDbProduct(p: DbProduct): Product {
  return {
    id: p.id,
    name: p.name,
    regionId: p.region_id as RegionId,
    category: p.category as Product['category'],
    defaultUnit: p.default_unit,
    photo: p.photo_url ?? undefined,
    sortOrder: p.sort_order,
    description: p.description ?? undefined,
  }
}

function mapDbRegion(r: DbRegion): Region {
  return {
    id: r.id as RegionId,
    name: r.name,
    shortName: r.short_name,
    emoji: r.emoji,
    color: r.color as Region['color'],
    sortOrder: r.sort_order,
  }
}

/**
 * Carga el catálogo desde Supabase. Si no hay config, falla la red, o la
 * tabla está vacía, devuelve los datos locales de `src/data/*`.
 */
export async function loadCatalog(): Promise<CatalogData> {
  if (!isSupabaseConfigured()) return FALLBACK

  const cached = readCache()
  if (cached) return cached

  const sb = getSupabase()
  if (!sb) return FALLBACK

  try {
    const [prodRes, regRes, synRes] = await Promise.all([
      sb.from('products').select('*').eq('is_active', true).order('sort_order'),
      sb.from('regions').select('*').eq('is_active', true).order('sort_order'),
      sb.from('product_synonyms').select('product_id, term'),
    ])

    if (prodRes.error || regRes.error) return FALLBACK
    if (!prodRes.data?.length || !regRes.data?.length) return FALLBACK

    const products = (prodRes.data as DbProduct[]).map(mapDbProduct)
    const regions = (regRes.data as DbRegion[]).map(mapDbRegion)
    const synonyms: Record<string, string[]> = {}
    for (const s of (synRes.data ?? []) as DbSynonym[]) {
      const t = s.term.toLowerCase().trim()
      if (!t) continue
      ;(synonyms[t] ??= []).push(s.product_id)
    }

    const data: CatalogData = {
      products,
      regions,
      synonyms,
      fromRemote: true,
      fetchedAt: Date.now(),
    }
    writeCache(data)
    return data
  } catch {
    return FALLBACK
  }
}

/** Versión síncrona del fallback, útil para que el primer render no parpadee. */
export function fallbackCatalog(): CatalogData {
  return FALLBACK
}
