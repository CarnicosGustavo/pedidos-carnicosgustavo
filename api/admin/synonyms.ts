import { createClient } from '@supabase/supabase-js'
import type { VercelRequest, VercelResponse } from '@vercel/node'

/**
 * Admin CRUD para sinónimos.
 *
 *   GET    /api/admin/synonyms?productId=xxx   (si se omite, devuelve todos)
 *   POST   /api/admin/synonyms                 body: { productId, term }
 *   DELETE /api/admin/synonyms?id=xxx
 */

type DbSynonym = {
  id: string
  product_id: string
  term: string
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
      const productId = String(req.query.productId ?? '')
      let q = sb.from('product_synonyms').select('*').order('term', { ascending: true })
      if (productId) q = q.eq('product_id', productId)
      const { data, error } = await q
      if (error) return json(res, 500, { ok: false, error: error.message })
      return json(res, 200, { ok: true, items: data as DbSynonym[] })
    }

    if (req.method === 'POST') {
      const body = (await readBody(req)) as { productId?: string; term?: string } | null
      const productId = body?.productId?.trim()
      const term = body?.term?.trim().toLowerCase()
      if (!productId || !term) {
        return json(res, 400, { ok: false, error: 'Falta productId o term.' })
      }
      const { data, error } = await sb
        .from('product_synonyms')
        .upsert({ product_id: productId, term }, { onConflict: 'product_id,term' })
        .select()
        .single()
      if (error) return json(res, 500, { ok: false, error: error.message })
      return json(res, 200, { ok: true, item: data })
    }

    if (req.method === 'DELETE') {
      const id = String(req.query.id ?? '')
      if (!id) return json(res, 400, { ok: false, error: 'Falta id.' })
      const { error } = await sb.from('product_synonyms').delete().eq('id', id)
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
