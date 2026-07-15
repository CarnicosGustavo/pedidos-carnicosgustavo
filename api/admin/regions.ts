import { createClient } from '@supabase/supabase-js'
import type { VercelRequest, VercelResponse } from '@vercel/node'

/**
 * Admin CRUD para regiones. Mismo patrón que admin/products.ts.
 *
 *   GET    /api/admin/regions
 *   POST   /api/admin/regions
 *   PUT    /api/admin/regions
 *   DELETE /api/admin/regions?id=xxx
 */

type DbRegion = {
  id: string
  name: string
  short_name: string
  emoji: string
  color: string
  sort_order: number
  is_active: boolean
}

function json(res: VercelResponse, status: number, body: unknown) {
  res.status(status).json(body)
}

async function readBody(req: VercelRequest): Promise<unknown> {
  if (req.body && typeof req.body === 'object') return req.body
  if (typeof req.body === 'string') {
    try { return JSON.parse(req.body) } catch { return null }
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
        .from('regions')
        .select('*')
        .order('sort_order', { ascending: true })
      if (error) return json(res, 500, { ok: false, error: error.message })
      return json(res, 200, { ok: true, items: data as DbRegion[] })
    }

    if (req.method === 'POST' || req.method === 'PUT') {
      const body = (await readBody(req)) as Partial<DbRegion> | null
      if (!body || !body.id) return json(res, 400, { ok: false, error: 'Falta id de la región.' })
      const row: DbRegion = {
        id: body.id,
        name: body.name ?? body.id,
        short_name: body.short_name ?? body.id,
        emoji: body.emoji ?? '🐖',
        color: body.color ?? 'red',
        sort_order: Number(body.sort_order ?? 0),
        is_active: body.is_active !== false,
      }
      const { data, error } = await sb
        .from('regions')
        .upsert(row, { onConflict: 'id' })
        .select()
        .single()
      if (error) return json(res, 500, { ok: false, error: error.message })
      return json(res, 200, { ok: true, item: data })
    }

    if (req.method === 'DELETE') {
      const id = String(req.query.id ?? '')
      if (!id) return json(res, 400, { ok: false, error: 'Falta id.' })
      const { error } = await sb.from('regions').delete().eq('id', id)
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
