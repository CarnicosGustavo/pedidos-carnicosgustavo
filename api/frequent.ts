import { createClient } from '@supabase/supabase-js'
import type { VercelRequest, VercelResponse } from '@vercel/node'

type DbProduct = {
  id: string
  name: string
  region_id: string
  category: string
  default_unit: 'piezas' | 'kg'
  photo_url: string | null
  sort_order: number
  is_active: boolean
  description: string | null
}

type FrequentRow = {
  productId: string
  name: string
  count: number
}

const CACHE_TTL_MS = 60 * 60 * 1000 // 1 hora
let _cache: { value: FrequentRow[]; expires: number } | null = null

function json(res: VercelResponse, status: number, body: unknown) {
  res.status(status).json(body)
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    json(res, 405, { ok: false, error: 'Method not allowed' })
    return
  }

  const limit = Math.min(Math.max(parseInt(String(req.query.limit ?? '12'), 10) || 12, 1), 30)

  // Cache de 1h en el runtime (compartido por todas las requests del deploy).
  if (_cache && _cache.expires > Date.now()) {
    json(res, 200, { ok: true, items: _cache.value.slice(0, limit), cached: true })
    return
  }

  // Fail-soft: si la migración no se ha aplicado, devolvemos lista vacía
  // (la app sigue funcionando y muestra los productos en el orden local).
  if (!supabaseUrl || !supabaseServiceRoleKey) {
    json(res, 200, { ok: true, items: [], cached: false, note: 'Supabase no configurado' })
    return
  }

  const supabaseUrl = process.env.SUPABASE_URL?.trim()
  const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim()
  const table = (process.env.SUPABASE_ORDERS_TABLE?.trim() || 'web_orders').trim()

  if (!supabaseUrl || !supabaseServiceRoleKey) {
    json(res, 500, { ok: false, error: 'Supabase not configured' })
    return
  }

  const supabase = createClient(supabaseUrl, supabaseServiceRoleKey, {
    auth: { persistSession: false },
  })

  try {
    const rows = await aggregateFrequent(supabase, table, limit * 3)
    _cache = { value: rows, expires: Date.now() + CACHE_TTL_MS }
    json(res, 200, { ok: true, items: rows.slice(0, limit), cached: false })
  } catch (e) {
    // Fail-soft: la app sigue funcionando aunque la migración no se haya aplicado.
    // eslint-disable-next-line no-console
    console.warn('[frequent] aggregate failed:', e instanceof Error ? e.message : e)
    json(res, 200, { ok: true, items: [], cached: false, note: 'aggregation unavailable' })
  }
}

/**
 * Agrega por productId leyendo los items de la tabla de pedidos. Si la
 * primera estrategia (sql crudo) falla, intenta leer la tabla materializada
 * `frequent_products` que mantiene el orden por total_qty.
 */
async function aggregateFrequent(
  supabase: ReturnType<typeof createClient>,
  table: string,
  limit: number,
): Promise<FrequentRow[]> {
  // 1) Intentar lectura directa de la tabla materializada (rápido).
  const matRes = await supabase
    .from('frequent_products')
    .select('product_id, total_qty')
    .order('total_qty', { ascending: false })
    .limit(limit)

  if (!matRes.error && matRes.data && matRes.data.length > 0) {
    // Necesitamos el `name` actual: lo unimos con la tabla `products`.
    const ids = (matRes.data as { product_id: string }[]).map((r) => r.product_id)
    const prodRes = await supabase
      .from('products')
      .select('id, name, is_active')
      .in('id', ids)
    const byId = new Map<string, DbProduct>(
      ((prodRes.data ?? []) as DbProduct[]).map((p) => [p.id, p]),
    )
    return (matRes.data as { product_id: string; total_qty: number }[])
      .map((r) => {
        const p = byId.get(r.product_id)
        return p && p.is_active
          ? { productId: r.product_id, name: p.name, count: Number(r.total_qty) || 0 }
          : null
      })
      .filter((x): x is FrequentRow => x !== null)
  }

  // 2) Fallback: agregación on-demand con RPC.
  //    Define esta función en Supabase (ver supabase/migrations/0001):
  //      create function frequent_products_aggregate(limit_n int) ...
  //    que devuelve setof (product_id text, name text, total_qty numeric).
  const rpcRes = await supabase.rpc('frequent_products_aggregate', { limit_n: limit })
  if (rpcRes.error) throw rpcRes.error

  return ((rpcRes.data ?? []) as { product_id: string; name: string; total_qty: number }[]).map(
    (r) => ({
      productId: r.product_id,
      name: r.name,
      count: Number(r.total_qty) || 0,
    }),
  )
}
