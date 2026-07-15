import { createClient } from '@supabase/supabase-js'

type OrderItem = {
  productId: string
  name: string
  quantity: number
  unit: 'piezas' | 'kg'
}

type ApiRequest = AsyncIterable<Uint8Array> & {
  method?: string
  body?: unknown
  headers?: Record<string, string | string[] | undefined>
}

type ApiResponse = {
  statusCode: number
  setHeader: (name: string, value: string) => void
  end: (body?: string) => void
}

function json(res: ApiResponse, status: number, body: unknown) {
  res.statusCode = status
  res.setHeader('Content-Type', 'application/json; charset=utf-8')
  res.end(JSON.stringify(body))
}

async function readBody(req: ApiRequest): Promise<unknown> {
  if (req.body !== undefined) return req.body
  const chunks: Uint8Array[] = []
  for await (const chunk of req) {
    chunks.push(chunk)
  }
  const raw = Buffer.concat(chunks).toString('utf-8')
  if (!raw) return {}
  try {
    return JSON.parse(raw)
  } catch {
    return {}
  }
}

function asString(value: unknown) {
  return typeof value === 'string' ? value : ''
}

function asItems(value: unknown): OrderItem[] {
  if (!Array.isArray(value)) return []
  return value
    .map((it) => {
      if (!it || typeof it !== 'object') return null
      const o = it as Record<string, unknown>
      const productId = asString(o.productId).trim()
      const name = asString(o.name).trim()
      const qtyRaw = o.quantity
      const quantity =
        typeof qtyRaw === 'number' ? qtyRaw : typeof qtyRaw === 'string' ? Number(qtyRaw) : NaN
      if (!productId || !name) return null
      if (!Number.isFinite(quantity) || quantity <= 0) return null
      const unit: 'piezas' | 'kg' = o.unit === 'kg' ? 'kg' : 'piezas'
      // Conserva decimales (kg/gramos), máx 3 decimales
      return { productId, name, quantity: Math.round(quantity * 1000) / 1000, unit }
    })
    .filter((x): x is OrderItem => Boolean(x))
}

export default async function handler(req: ApiRequest, res: ApiResponse) {
  if (req.method === 'OPTIONS') {
    res.statusCode = 204
    res.end()
    return
  }

  if (req.method !== 'POST') {
    json(res, 405, { ok: false, error: 'Method not allowed' })
    return
  }

  const supabaseUrl = process.env.SUPABASE_URL?.trim()
  const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim()
  const table = (process.env.SUPABASE_ORDERS_TABLE?.trim() || 'web_orders').trim()

  if (!supabaseUrl || !supabaseServiceRoleKey) {
    json(res, 500, { ok: false, error: 'Supabase not configured' })
    return
  }

  const body = (await readBody(req)) as Record<string, unknown>

  const businessNameRaw = asString(body.businessName).trim()
  const contactName = asString(body.contactName).trim()
  const phone = asString(body.phone).trim()
  const deliveryAddress = asString(body.deliveryAddress).trim()
  const notes = asString(body.notes).trim()
  const locationLabel = asString(body.locationLabel).trim()
  const items = asItems(body.items)

  const businessName = businessNameRaw || contactName
  if (!contactName || !phone || items.length === 0) {
    json(res, 400, { ok: false, error: 'Missing required fields' })
    return
  }

  const supabase = createClient(supabaseUrl, supabaseServiceRoleKey, {
    auth: { persistSession: false },
  })

  const payload = {
    source: 'pedidos-app',
    business_name: businessName,
    contact_name: contactName,
    phone,
    delivery_address: deliveryAddress || null,
    notes: notes || null,
    location_label: locationLabel || null,
    items,
    // Número de productos (líneas), no la suma de cantidades: la columna es
    // integer y las cantidades pueden ser decimales (kg/gramos).
    items_count: items.length,
    user_agent: asString(req.headers?.['user-agent']) || null,
    whatsapp_message: null,
  }

  const { data, error } = await supabase.from(table).insert(payload).select('id').single()

  if (error) {
    json(res, 500, { ok: false, error: error.message })
    return
  }

  // El trigger crea la orden del dashboard al instante. Recuperamos su número
  // (id secuencial) para mostrarlo al cliente y en el mensaje de WhatsApp.
  let orderNumber: number | null = null
  if (data?.id) {
    const { data: ord } = await supabase
      .from('orders')
      .select('id')
      .eq('web_order_id', data.id)
      .maybeSingle()
    orderNumber = (ord?.id as number) ?? null
  }

  json(res, 200, { ok: true, id: data?.id, orderNumber })

  // Refresca la tabla de frecuentes en background (no bloquea la respuesta).
  // Si la RPC no existe aún, falla silenciosamente — el admin la puede
  // disparar manualmente o se refrescará en el próximo /api/frequent.
  void supabase
    .rpc('frequent_products_aggregate', { limit_n: 50 })
    .then(({ error: rpcErr }) => {
      if (rpcErr && !/Could not find the function/i.test(rpcErr.message)) {
        // eslint-disable-next-line no-console
        console.warn('[orders] refresh frequent_products failed:', rpcErr.message)
      }
    })
    .catch(() => {
      /* swallow */
    })
}
