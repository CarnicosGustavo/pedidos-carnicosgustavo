import { useEffect, useState } from 'react'

import { Logo } from '../components/Logo'
import { getSupabase, isSupabaseConfigured } from '../lib/supabase'
import { PRODUCTS as LOCAL_PRODUCTS } from '../data/products'
import { REGIONS as LOCAL_REGIONS, type Region, type RegionId } from '../data/regions'
import type { Product, Unit } from '../data/products'

const SESSION_KEY = 'cg_admin_session_v1'

function getPassword(): string {
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

export function AdminApp() {
  const [authed, setAuthed] = useState<boolean>(() => readSession())
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const expected = getPassword()

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

  useEffect(() => {
    void loadAll(setProducts, setRegions, setLoading)
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

        {loading ? (
          <div className="py-10 text-center text-sm text-ink-soft">Cargando…</div>
        ) : tab === 'products' ? (
          <ProductsTable
            products={products}
            regions={regions}
            saving={saving}
            onSave={async (p) => {
              setSaving(true)
              await saveProduct(p, () => {
                setProducts((prev) => {
                  const i = prev.findIndex((x) => x.id === p.id)
                  if (i < 0) return [...prev, p]
                  const next = [...prev]
                  next[i] = p
                  return next
                })
                setMessage(`Guardado: ${p.id}`)
                setTimeout(() => setMessage(''), 2000)
              })
              setSaving(false)
            }}
          />
        ) : tab === 'regions' ? (
          <RegionsTable
            regions={regions}
            saving={saving}
            onSave={async (r) => {
              setSaving(true)
              await saveRegion(r, () => {
                setRegions((prev) => {
                  const i = prev.findIndex((x) => x.id === r.id)
                  if (i < 0) return [...prev, r]
                  const next = [...prev]
                  next[i] = r
                  return next
                })
                setMessage(`Guardado: ${r.id}`)
                setTimeout(() => setMessage(''), 2000)
              })
              setSaving(false)
            }}
          />
        ) : (
          <SynonymsEditor products={products} />
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
          onChange={(e) => setP((prev) => ({ ...prev, is_active: e.target.checked } as Product))}
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

function SynonymsEditor({ products }: { products: Product[] }) {
  const [productId, setProductId] = useState(products[0]?.id ?? '')
  const [terms, setTerms] = useState<{ id: string; term: string }[]>([])
  const [newTerm, setNewTerm] = useState('')
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')

  useEffect(() => {
    if (!productId) return
    setLoading(true)
    loadSynonyms(productId).then((rows) => {
      setTerms(rows)
      setLoading(false)
    })
  }, [productId])

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
            await addSynonym(productId, newTerm.trim(), (row) => {
              setTerms((prev) => [...prev, row])
              setNewTerm('')
              setMessage('Sinónimo agregado.')
              setTimeout(() => setMessage(''), 1500)
            })
            setSaving(false)
          }}
          className="rounded-md bg-red px-3 py-1.5 text-xs font-extrabold text-white disabled:opacity-40"
        >
          Agregar
        </button>
      </div>

      {message && (
        <div className="mt-2 text-xs font-bold text-green">{message}</div>
      )}

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
                    await deleteSynonym(t.id)
                    setTerms((prev) => prev.filter((x) => x.id !== t.id))
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
// Data access (admin: usa anon key con bypass de RLS vía service role NO,
// o el admin debería usar una API. Por ahora, intentamos con anon key y
// policies permisivas para authenticated. Si no hay policy de write, se
// debe crear una y dar acceso al usuario con el password.
// ──────────────────────────────────────────────────────────────────────

async function loadAll(
  setProducts: (p: Product[]) => void,
  setRegions: (r: Region[]) => void,
  setLoading: (b: boolean) => void,
) {
  const sb = getSupabase()
  if (!sb) return
  setLoading(true)
  const [pr, rr] = await Promise.all([
    sb.from('products').select('*').order('sort_order'),
    sb.from('regions').select('*').order('sort_order'),
  ])
  if (pr.data) setProducts(pr.data as unknown as Product[])
  if (rr.data) setRegions(rr.data as unknown as Region[])
  setLoading(false)
}

async function saveProduct(p: Product, done: () => void) {
  const sb = getSupabase()
  if (!sb) return done()
  await sb.from('products').upsert(p)
  done()
}

async function saveRegion(r: Region, done: () => void) {
  const sb = getSupabase()
  if (!sb) return done()
  await sb.from('regions').upsert(r)
  done()
}

async function loadSynonyms(productId: string): Promise<{ id: string; term: string }[]> {
  const sb = getSupabase()
  if (!sb) return []
  const { data } = await sb
    .from('product_synonyms')
    .select('id, term')
    .eq('product_id', productId)
    .order('term')
  return (data ?? []) as { id: string; term: string }[]
}

async function addSynonym(productId: string, term: string, done: (row: { id: string; term: string }) => void) {
  const sb = getSupabase()
  if (!sb) return
  const { data } = await sb
    .from('product_synonyms')
    .insert({ product_id: productId, term })
    .select('id, term')
    .single()
  if (data) done(data as { id: string; term: string })
}

async function deleteSynonym(id: string) {
  const sb = getSupabase()
  if (!sb) return
  await sb.from('product_synonyms').delete().eq('id', id)
}

function Center({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-svh flex-col items-center justify-center bg-bg px-6 py-10 text-center">
      {children}
    </div>
  )
}
