import { useEffect, useState } from 'react'

import { Logo } from '../components/Logo'
import { isSupabaseConfigured } from '../lib/supabase'
import { PRODUCTS as LOCAL_PRODUCTS } from '../data/products'
import { REGIONS as LOCAL_REGIONS, type Region, type RegionId } from '../data/regions'
import type { Product, Unit } from '../data/products'

const SESSION_KEY = 'cg_admin_session_v1'

function getAdminPassword(): string {
  return (import.meta.env.VITE_ADMIN_PASSWORD as string | undefined)?.trim() || ''
}

function readSession(): boolean {
  try {
    return sessionStorage.getItem(SESSION_KEY) === '1'
  } catch {
    return false
  }
}

function writeSession(v: boolean) {
  try {
    if (v) sessionStorage.setItem(SESSION_KEY, '1')
    else sessionStorage.removeItem(SESSION_KEY)
  } catch {
    /* ignore */
  }
}

async function adminFetch<T>(path: string, init: RequestInit = {}): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'x-admin-token': getAdminPassword(),
    ...(init.headers as Record<string, string> | undefined),
  }
  const resp = await fetch(path, { ...init, headers })
  if (!resp.ok) {
    let msg = `HTTP ${resp.status}`
    try {
      const j = (await resp.json()) as { error?: string }
      if (j?.error) msg = j.error
    } catch {
      /* ignore */
    }
    throw new Error(msg)
  }
  return (await resp.json()) as T
}

export function AdminApp() {
  const [authed, setAuthed] = useState<boolean>(() => readSession())
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const expected = getAdminPassword()

  if (!expected) {
    return (
      <Center>
        <Logo size={64} className="mb-4" />
        <h1 className="text-xl font-extrabold text-ink">Admin no configurado</h1>
        <p className="mt-2 max-w-sm text-center text-sm text-ink-soft">
          Define la variable <code className="rounded bg-paper2 px-1.5 py-0.5 font-mono text-xs">VITE_ADMIN_PASSWORD</code> en
          el entorno y vuelve a desplegar.
        </p>
      </Center>
    )
  }

  if (!isSupabaseConfigured()) {
    return (
      <Center>
        <Logo size={64} className="mb-4" />
        <h1 className="text-xl font-extrabold text-ink">Supabase no conectado</h1>
        <p className="mt-2 max-w-sm text-center text-sm text-ink-soft">
          Define <code className="rounded bg-paper2 px-1.5 py-0.5 font-mono text-xs">VITE_SUPABASE_URL</code> y
          <code className="rounded bg-paper2 px-1.5 py-0.5 font-mono text-xs">VITE_SUPABASE_ANON_KEY</code>.
        </p>
      </Center>
    )
  }

  if (!authed) {
    return (
      <Center>
        <Logo size={64} className="mb-4" />
        <h1 className="text-xl font-extrabold text-ink">Cárnicos Gustavo · Admin</h1>
        <form
          className="mt-6 w-full max-w-xs"
          onSubmit={(e) => {
            e.preventDefault()
            if (password === expected) {
              writeSession(true)
              setAuthed(true)
              setError('')
            } else {
              setError('Contraseña incorrecta.')
            }
          }}
        >
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Contraseña"
            autoFocus
            className="w-full rounded-xl border-2 border-line/15 bg-paper2 px-4 py-3 text-sm font-bold text-ink outline-none focus:border-red"
          />
          {error && <div className="mt-2 text-xs font-bold text-red">{error}</div>}
          <button
            type="submit"
            className="mt-3 w-full rounded-xl bg-red px-4 py-3 text-sm font-extrabold text-white active:bg-red-dark"
          >
            Entrar
          </button>
        </form>
      </Center>
    )
  }

  return <AdminDashboard onLogout={() => { writeSession(false); setAuthed(false) }} />
}

function AdminDashboard({ onLogout }: { onLogout: () => void }) {
  const [tab, setTab] = useState<'products' | 'regions' | 'synonyms'>('products')
  const [products, setProducts] = useState<Product[]>(LOCAL_PRODUCTS)
  const [regions, setRegions] = useState<Region[]>(LOCAL_REGIONS)
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<string>('')
  const [error, setError] = useState<string>('')

  useEffect(() => {
    void loadAll(setProducts, setRegions, setLoading, setError)
  }, [])

  return (
    <div className="min-h-svh bg-bg">
      <header className="sticky top-0 z-30 flex items-center justify-between gap-3 border-b border-line/10 bg-chrome px-4 py-3 text-chrome-fg">
        <div className="flex items-center gap-2">
          <Logo size={28} colorVar="var(--chrome-fg)" />
          <div>
            <div className="text-[10px] font-semibold uppercase tracking-[0.2em] text-red">Cárnicos</div>
            <div className="font-display text-base leading-none">Admin</div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => { window.location.href = '/' }}
            className="rounded-full border border-white/20 px-3 py-1.5 text-xs font-bold"
          >
            Ver tienda
          </button>
          <button
            type="button"
            onClick={onLogout}
            className="rounded-full border border-white/20 px-3 py-1.5 text-xs font-bold"
          >
            Salir
          </button>
        </div>
      </header>

      <div className="mx-auto w-full max-w-5xl px-4 py-4">
        <div className="mb-3 flex gap-2">
          <TabBtn active={tab === 'products'} onClick={() => setTab('products')}>Productos ({products.length})</TabBtn>
          <TabBtn active={tab === 'regions'}  onClick={() => setTab('regions')}>Regiones ({regions.length})</TabBtn>
          <TabBtn active={tab === 'synonyms'} onClick={() => setTab('synonyms')}>Sinónimos</TabBtn>
        </div>

        {message && (
          <div className="mb-3 rounded-xl border border-green/40 bg-green-wash px-3 py-2 text-xs font-bold text-ink">
            {message}
          </div>
        )}
        {error && (
          <div className="mb-3 rounded-xl border border-red/30 bg-red/10 px-3 py-2 text-xs font-bold text-red">
            {error}
          </div>
        )}

        {loading ? (
          <div className="py-10 text-center text-sm text-ink-soft">Cargando…</div>
        ) : tab === 'products' ? (
          <ProductsTable
            products={products}
            regions={regions}
            saving={saving}
            onSave={async (p) => {
              setSaving(true); setError('')
              try {
                await saveProduct(p)
                setProducts((prev) => {
                  const i = prev.findIndex((x) => x.id === p.id)
                  if (i < 0) return [...prev, p]
                  const next = [...prev]
                  next[i] = p
                  return next
                })
                setMessage(`Guardado: ${p.id}`)
                setTimeout(() => setMessage(''), 2000)
              } catch (e) {
                setError(e instanceof Error ? e.message : 'Error al guardar.')
              }
              setSaving(false)
            }}
          />
        ) : tab === 'regions' ? (
          <RegionsTable
            regions={regions}
            saving={saving}
            onSave={async (r) => {
              setSaving(true); setError('')
              try {
                await saveRegion(r)
                setRegions((prev) => {
                  const i = prev.findIndex((x) => x.id === r.id)
                  if (i < 0) return [...prev, r]
                  const next = [...prev]
                  next[i] = r
                  return next
                })
                setMessage(`Guardado: ${r.id}`)
                setTimeout(() => setMessage(''), 2000)
              } catch (e) {
                setError(e instanceof Error ? e.message : 'Error al guardar.')
              }
              setSaving(false)
            }}
          />
        ) : (
          <SynonymsEditor
            products={products}
            onError={setError}
            onMessage={setMessage}
          />
        )}
      </div>
    </div>
  )
}

function TabBtn({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        'rounded-full px-4 py-2 text-xs font-bold transition-colors',
        active ? 'bg-red text-white' : 'border border-line/15 bg-paper text-ink-soft',
      ].join(' ')}
    >
      {children}
    </button>
  )
}

function ProductsTable({
  products,
  regions,
  saving,
  onSave,
}: {
  products: Product[]
  regions: Region[]
  saving: boolean
  onSave: (p: Product) => Promise<void> | void
}) {
  return (
    <div className="overflow-hidden rounded-2xl border border-line/10 bg-paper">
      <div className="grid grid-cols-12 gap-2 border-b border-line/10 bg-paper2 px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-ink-soft">
        <div className="col-span-1">ID</div>
        <div className="col-span-3">Nombre</div>
        <div className="col-span-3">Región</div>
        <div className="col-span-2">Unidad</div>
        <div className="col-span-1">Orden</div>
        <div className="col-span-1">Activo</div>
        <div className="col-span-1"></div>
      </div>
      <div className="max-h-[70svh] overflow-y-auto">
        {products.map((p) => (
          <ProductRowEditor
            key={p.id}
            product={p}
            regions={regions}
            disabled={saving}
            onSave={onSave}
          />
        ))}
      </div>
    </div>
  )
}

function ProductRowEditor({
  product,
  regions,
  disabled,
  onSave,
}: {
  product: Product
  regions: Region[]
  disabled: boolean
  onSave: (p: Product) => Promise<void> | void
}) {
  const [p, setP] = useState<Product>(product)
  const [dirty, setDirty] = useState(false)

  function patch<K extends keyof Product>(k: K, v: Product[K]) {
    setP((prev) => ({ ...prev, [k]: v }))
    setDirty(true)
  }

  return (
    <div className="grid grid-cols-12 items-center gap-2 border-b border-line/5 px-3 py-2 text-xs">
      <div className="col-span-1 truncate font-mono text-[10px] text-ink-soft">{p.id}</div>
      <input
        value={p.name}
        onChange={(e) => patch('name', e.target.value)}
        className="col-span-3 rounded-md border border-line/15 bg-paper2 px-2 py-1 font-bold uppercase text-ink outline-none focus:border-red"
      />
      <select
        value={p.regionId}
        onChange={(e) => patch('regionId', e.target.value as RegionId)}
        className="col-span-3 rounded-md border border-line/15 bg-paper2 px-2 py-1 text-ink outline-none focus:border-red"
      >
        {regions.map((r) => (
          <option key={r.id} value={r.id}>{r.shortName}</option>
        ))}
      </select>
      <select
        value={p.defaultUnit}
        onChange={(e) => patch('defaultUnit', e.target.value as Unit)}
        className="col-span-2 rounded-md border border-line/15 bg-paper2 px-2 py-1 text-ink outline-none focus:border-red"
      >
        <option value="piezas">piezas</option>
        <option value="kg">kg</option>
      </select>
      <input
        type="number"
        value={p.sortOrder}
        onChange={(e) => patch('sortOrder', Number(e.target.value) || 0)}
        className="col-span-1 w-full rounded-md border border-line/15 bg-paper2 px-2 py-1 text-center font-mono text-ink outline-none focus:border-red"
      />
      <label className="col-span-1 flex justify-center">
        <input
          type="checkbox"
          checked={p.is_active ?? true}
          onChange={(e) => setP((prev) => ({ ...prev, is_active: e.target.checked }))}
        />
      </label>
      <div className="col-span-1">
        <button
          type="button"
          disabled={!dirty || disabled}
          onClick={() => { onSave(p); setDirty(false) }}
          className="w-full rounded-md bg-red px-2 py-1 text-[11px] font-extrabold text-white disabled:opacity-40"
        >
          Guardar
        </button>
      </div>
    </div>
  )
}

function RegionsTable({
  regions,
  saving,
  onSave,
}: {
  regions: Region[]
  saving: boolean
  onSave: (r: Region) => Promise<void> | void
}) {
  return (
    <div className="overflow-hidden rounded-2xl border border-line/10 bg-paper">
      <div className="grid grid-cols-12 gap-2 border-b border-line/10 bg-paper2 px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-ink-soft">
        <div className="col-span-2">ID</div>
        <div className="col-span-4">Nombre</div>
        <div className="col-span-2">Corto</div>
        <div className="col-span-1">Emoji</div>
        <div className="col-span-1">Color</div>
        <div className="col-span-1">Orden</div>
        <div className="col-span-1"></div>
      </div>
      <div>
        {regions.map((r) => (
          <RegionRowEditor key={r.id} region={r} disabled={saving} onSave={onSave} />
        ))}
      </div>
    </div>
  )
}

function RegionRowEditor({
  region,
  disabled,
  onSave,
}: {
  region: Region
  disabled: boolean
  onSave: (r: Region) => Promise<void> | void
}) {
  const [r, setR] = useState<Region>(region)
  const [dirty, setDirty] = useState(false)

  return (
    <div className="grid grid-cols-12 items-center gap-2 border-b border-line/5 px-3 py-2 text-xs">
      <div className="col-span-2 truncate font-mono text-[10px] text-ink-soft">{r.id}</div>
      <input
        value={r.name}
        onChange={(e) => { setR((p) => ({ ...p, name: e.target.value })); setDirty(true) }}
        className="col-span-4 rounded-md border border-line/15 bg-paper2 px-2 py-1 text-ink outline-none focus:border-red"
      />
      <input
        value={r.shortName}
        onChange={(e) => { setR((p) => ({ ...p, shortName: e.target.value })); setDirty(true) }}
        className="col-span-2 rounded-md border border-line/15 bg-paper2 px-2 py-1 text-ink outline-none focus:border-red"
      />
      <input
        value={r.emoji}
        onChange={(e) => { setR((p) => ({ ...p, emoji: e.target.value })); setDirty(true) }}
        className="col-span-1 rounded-md border border-line/15 bg-paper2 px-2 py-1 text-center text-ink outline-none focus:border-red"
      />
      <input
        value={r.color}
        onChange={(e) => { setR((p) => ({ ...p, color: e.target.value as Region['color'] })); setDirty(true) }}
        className="col-span-1 rounded-md border border-line/15 bg-paper2 px-2 py-1 text-ink outline-none focus:border-red"
      />
      <input
        type="number"
        value={r.sortOrder}
        onChange={(e) => { setR((p) => ({ ...p, sortOrder: Number(e.target.value) || 0 })); setDirty(true) }}
        className="col-span-1 w-full rounded-md border border-line/15 bg-paper2 px-2 py-1 text-center font-mono text-ink outline-none focus:border-red"
      />
      <div className="col-span-1">
        <button
          type="button"
          disabled={!dirty || disabled}
          onClick={() => { onSave(r); setDirty(false) }}
          className="w-full rounded-md bg-red px-2 py-1 text-[11px] font-extrabold text-white disabled:opacity-40"
        >
          Guardar
        </button>
      </div>
    </div>
  )
}

function SynonymsEditor({
  products,
  onError,
  onMessage,
}: {
  products: Product[]
  onError: (s: string) => void
  onMessage: (s: string) => void
}) {
  const [productId, setProductId] = useState(products[0]?.id ?? '')
  const [terms, setTerms] = useState<{ id: string; term: string }[]>([])
  const [newTerm, setNewTerm] = useState('')
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!productId) return
    setLoading(true)
    loadSynonyms(productId)
      .then(setTerms)
      .catch((e) => onError(e instanceof Error ? e.message : 'Error al cargar.'))
      .finally(() => setLoading(false))
  }, [productId, onError])

  return (
    <div className="rounded-2xl border border-line/10 bg-paper p-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <label className="text-xs font-bold text-ink-soft">Producto</label>
        <select
          value={productId}
          onChange={(e) => setProductId(e.target.value)}
          className="flex-1 rounded-md border border-line/15 bg-paper2 px-2 py-1.5 text-sm text-ink outline-none focus:border-red"
        >
          {products.map((p) => (
            <option key={p.id} value={p.id}>{p.id} — {p.name}</option>
          ))}
        </select>
      </div>

      <div className="mt-3 flex gap-2">
        <input
          value={newTerm}
          onChange={(e) => setNewTerm(e.target.value)}
          placeholder="Nuevo sinónimo (ej. pancita)"
          className="flex-1 rounded-md border border-line/15 bg-paper2 px-2 py-1.5 text-sm text-ink outline-none focus:border-red"
        />
        <button
          type="button"
          disabled={!newTerm.trim() || saving}
          onClick={async () => {
            setSaving(true)
            try {
              const row = await addSynonym(productId, newTerm.trim())
              setTerms((prev) => (prev.some((t) => t.id === row.id) ? prev : [...prev, row]))
              setNewTerm('')
              onMessage('Sinónimo agregado.')
              setTimeout(() => onMessage(''), 1500)
            } catch (e) {
              onError(e instanceof Error ? e.message : 'Error al agregar.')
            }
            setSaving(false)
          }}
          className="rounded-md bg-red px-3 py-1.5 text-xs font-extrabold text-white disabled:opacity-40"
        >
          Agregar
        </button>
      </div>

      <div className="mt-3">
        {loading ? (
          <div className="py-6 text-center text-xs text-ink-soft">Cargando…</div>
        ) : terms.length === 0 ? (
          <div className="py-6 text-center text-xs text-ink-faint">Sin sinónimos aún.</div>
        ) : (
          <ul className="flex flex-wrap gap-2">
            {terms.map((t) => (
              <li
                key={t.id}
                className="flex items-center gap-1.5 rounded-full border border-line/15 bg-paper2 px-3 py-1 text-xs font-bold text-ink"
              >
                {t.term}
                <button
                  type="button"
                  onClick={async () => {
                    try {
                      await deleteSynonym(t.id)
                      setTerms((prev) => prev.filter((x) => x.id !== t.id))
                    } catch (e) {
                      onError(e instanceof Error ? e.message : 'Error al eliminar.')
                    }
                  }}
                  className="text-ink-faint active:text-red"
                  aria-label={`Eliminar ${t.term}`}
                >
                  ✕
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}

// ──────────────────────────────────────────────────────────────────────
// Data access (via /api/admin/* — el backend usa el service role).
// ──────────────────────────────────────────────────────────────────────

async function loadAll(
  setProducts: (p: Product[]) => void,
  setRegions: (r: Region[]) => void,
  setLoading: (b: boolean) => void,
  setError: (s: string) => void,
) {
  setLoading(true)
  try {
    const [p, r] = await Promise.all([
      adminFetch<{ ok: boolean; items: Product[] }>('/api/admin/products'),
      adminFetch<{ ok: boolean; items: Region[] }>('/api/admin/regions'),
    ])
    if (p.items) setProducts(p.items)
    if (r.items) setRegions(r.items)
  } catch (e) {
    setError(e instanceof Error ? e.message : 'Error al cargar.')
  }
  setLoading(false)
}

function saveProduct(p: Product) {
  return adminFetch<{ ok: boolean }>('/api/admin/products', {
    method: 'PUT',
    body: JSON.stringify({
      id: p.id,
      name: p.name,
      region_id: p.regionId,
      category: p.category ?? 'otros',
      default_unit: p.defaultUnit,
      photo_url: p.photo ?? null,
      sort_order: p.sortOrder,
      is_active: p.is_active ?? true,
      description: p.description ?? null,
    }),
  })
}

function saveRegion(r: Region) {
  return adminFetch<{ ok: boolean }>('/api/admin/regions', {
    method: 'PUT',
    body: JSON.stringify({
      id: r.id,
      name: r.name,
      short_name: r.shortName,
      emoji: r.emoji,
      color: r.color,
      sort_order: r.sortOrder,
      is_active: true,
    }),
  })
}

function loadSynonyms(productId: string) {
  return adminFetch<{ ok: boolean; items: { id: string; term: string }[] }>(
    `/api/admin/synonyms?productId=${encodeURIComponent(productId)}`,
  ).then((r) => r.items ?? [])
}

function addSynonym(productId: string, term: string) {
  return adminFetch<{ ok: boolean; item: { id: string; term: string } }>(
    '/api/admin/synonyms',
    { method: 'POST', body: JSON.stringify({ productId, term }) },
  ).then((r) => r.item)
}

function deleteSynonym(id: string) {
  return adminFetch<{ ok: boolean }>(`/api/admin/synonyms?id=${encodeURIComponent(id)}`, {
    method: 'DELETE',
  })
}

function Center({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-svh flex-col items-center justify-center bg-bg px-6 py-10 text-center">
      {children}
    </div>
  )
}
