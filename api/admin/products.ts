import { createClient } from '@supabase/supabase-js'
import type { VercelRequest, VercelResponse } from '@vercel/node'

/**
 * Admin CRUD para productos. Usa el service role (server-side only).
 *
 *   GET    /api/admin/products
 *   POST   /api/admin/products        body: Product
 *   PUT    /api/admin/products        body: Product
 *   DELETE /api/admin/products?id=xxx
 *
 * La autenticación real del admin se hace en el cliente con
 * VITE_ADMIN_PASSWORD; este endpoint es interno y NO debe exponerse
 * públicamente. Se debe proteger con Vercel Firewall / IP allowlist
 * o agregar un check de header `x-admin-token` si se expone.
 */

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

function json(res: VercelResponse, status: number, body: unknown) {
  res.status(status).json(body)
}

async function readBody(req: VercelRequest): Promise<unknown> {
  if (req.body && typeof req.body === 'object') return req.body
  if (typeof req.body === 'string') {
    try {
      return JSON.parse(req.body)
    } catch {
      return null
    }
  }
  return null
}

function getClient() {
  const url = process.env.SUPABASE_URL?.trim()
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim()
  if (!url || !key) return null
  return createClient(url, key, { auth: { persistSession: false } })
}

const ADMIN_TOKEN = (process.env.ADMIN_TOKEN ?? '').trim()

function checkAuth(req: VercelRequest, res: VercelResponse): boolean {
  if (!ADMIN_TOKEN) {
    // Si ADMIN_TOKEN no está definido, denegamos el endpoint (fail-closed).
    json(res, 503, { ok: false, error: 'Admin endpoint no configurado (ADMIN_TOKEN).' })
    return false
  }
  const header = String(req.headers['x-admin-token'] ?? '')
  if (header !== ADMIN_TOKEN) {
    json(res, 401, { ok: false, error: 'No autorizado.' })
    return false
  }
  return true
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (!checkAuth(req, res)) return
  const sb = getClient()
  if (!sb) return json(res, 500, { ok: false, error: 'Supabase no configurado.' })

  try {
    if (req.method === 'GET') {
      const { data, error } = await sb
        .from('products')
        .select('*')
        .order('region_id', { ascending: true })
        .order('sort_order', { ascending: true })
      if (error) return json(res, 500, { ok: false, error: error.message })
      return json(res, 200, { ok: true, items: data as DbProduct[] })
    }

    if (req.method === 'POST' || req.method === 'PUT') {
      const body = (await readBody(req)) as Partial<DbProduct> | null
      if (!body || !body.id) {
        return json(res, 400, { ok: false, error: 'Falta id del producto.' })
      }
      const row: DbProduct = {
        id: body.id,
        name: body.name ?? body.id.toUpperCase(),
        region_id: body.region_id ?? 'pulpa-retazo',
        category: body.category ?? 'otros',
        default_unit: body.default_unit === 'kg' ? 'kg' : 'piezas',
        photo_url: body.photo_url ?? null,
        sort_order: Number(body.sort_order ?? 0),
        is_active: body.is_active !== false,
        description: body.description ?? null,
      }
      const { data, error } = await sb
        .from('products')
        .upsert(row, { onConflict: 'id' })
        .select()
        .single()
      if (error) return json(res, 500, { ok: false, error: error.message })
      return json(res, 200, { ok: true, item: data })
    }

    if (req.method === 'DELETE') {
      const id = String(req.query.id ?? '')
      if (!id) return json(res, 400, { ok: false, error: 'Falta id.' })
      const { error } = await sb.from('products').delete().eq('id', id)
      if (error) return json(res, 500, { ok: false, error: error.message })
      return json(res, 200, { ok: true })
    }

    return json(res, 405, { ok: false, error: 'Método no permitido.' })
  } catch (e) {
    return json(res, 500, {
      ok: false,
      error: e instanceof Error ? e.message : 'Error inesperado.',
    })
  }
}
