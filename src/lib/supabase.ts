import { createClient, type SupabaseClient } from '@supabase/supabase-js'

const url = (import.meta.env.VITE_SUPABASE_URL as string | undefined)?.trim() || ''
const anon = (import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined)?.trim() || ''

/**
 * Cliente Supabase del frontend. Solo lectura pública (catálogo, regiones,
 * sinónimos) — la escritura a la BD se hace desde /api/* con service role.
 *
 * Si faltan variables de entorno, `getSupabase()` devuelve `null` y la app
 * cae a los datos locales de `src/data/*` (ver `catalog.ts`).
 */
let _client: SupabaseClient | null = null

export function getSupabase(): SupabaseClient | null {
  if (!url || !anon) return null
  if (_client) return _client
  _client = createClient(url, anon, {
    auth: { persistSession: false },
  })
  return _client
}

export function isSupabaseConfigured(): boolean {
  return Boolean(url && anon)
}
