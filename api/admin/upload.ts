import { createClient } from '@supabase/supabase-js'
import type { VercelRequest, VercelResponse } from '@vercel/node'

/**
 * Sube una imagen de producto a Supabase Storage y devuelve la URL pública.
 *
 *   POST /api/admin/upload
 *     Headers: x-admin-token, Content-Type: application/json
 *     Body: { productId: string, imageBase64: string, ext?: 'jpg'|'png'|'webp' }
 *     → { ok: true, url: string }
 *
 * El bucket debe llamarse "products" y ser público.
 * Si no existe, este endpoint falla con un mensaje claro.
 */

const ADMIN_TOKEN = (process.env.ADMIN_TOKEN ?? '').trim()
const BUCKET = (process.env.SUPABASE_PRODUCTS_BUCKET ?? 'products').trim()
const MAX_BYTES = 800 * 1024 // 800 KB

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
  if (req.method !== 'POST') {
    return json(res, 405, { ok: false, error: 'Método no permitido.' })
  }

  const sb = getClient()
  if (!sb) return json(res, 500, { ok: false, error: 'Supabase no configurado.' })

  const body = (await readBody(req)) as
    | { productId?: string; imageBase64?: string; ext?: string }
    | null

  const productId = body?.productId?.trim()
  const b64 = body?.imageBase64?.trim()
  const ext = (body?.ext ?? 'jpg').toLowerCase()
  if (!productId || !b64) {
    return json(res, 400, { ok: false, error: 'Falta productId o imageBase64.' })
  }
  if (!/^jpe?g|png|webp$/.test(ext)) {
    return json(res, 400, { ok: false, error: 'Extensión no soportada.' })
  }

  const cleanB64 = b64.replace(/^data:[^;]+;base64,/, '')
  const bytes = Buffer.from(cleanB64, 'base64')
  if (bytes.length === 0) {
    return json(res, 400, { ok: false, error: 'Imagen vacía.' })
  }
  if (bytes.length > MAX_BYTES) {
    return json(res, 413, { ok: false, error: 'Imagen mayor a 800 KB.' })
  }

  const path = `${productId}/${Date.now()}.${ext === 'jpeg' ? 'jpg' : ext}`
  const contentType = ext === 'png' ? 'image/png' : ext === 'webp' ? 'image/webp' : 'image/jpeg'

  const { error: upErr } = await sb.storage.from(BUCKET).upload(path, bytes, {
    contentType,
    upsert: true,
    cacheControl: '31536000',
  })
  if (upErr) {
    return json(res, 500, { ok: false, error: `Storage: ${upErr.message}` })
  }

  const { data: pub } = sb.storage.from(BUCKET).getPublicUrl(path)
  return json(res, 200, { ok: true, url: pub.publicUrl, path })
}
