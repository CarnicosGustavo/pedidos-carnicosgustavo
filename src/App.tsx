import { useEffect, useMemo, useState } from 'react'

import { CartSheet } from './components/CartSheet'
import { Logo } from './components/Logo'
import { ProductRow } from './components/ProductRow'
import { RegionGrid } from './components/RegionGrid'
import { RegionView } from './components/RegionView'
import { SearchBar } from './components/SearchBar'
import { Welcome } from './components/Welcome'
import { fallbackCatalog, loadCatalog, type CatalogData } from './lib/catalog'
import { BUSINESS } from './config'
import { type Product, type Unit } from './data/products'
import { type RegionId } from './data/regions'
import { matchProducts, normalize } from './data/synonyms'
import { useOrder } from './hooks/useOrder'
import type { Recognized } from './lib/recognition'
import { useTheme } from './theme'

type Screen = 'welcome' | 'catalog'
type View = { type: 'regions' } | { type: 'region'; regionId: RegionId } | { type: 'frequent' }

function App() {
  const order = useOrder()
  const { theme, toggle } = useTheme()
  const [screen, setScreen] = useState<Screen>(() => (order.items.length > 0 ? 'catalog' : 'welcome'))
  const [recognized, setRecognized] = useState<Recognized | null>(null)
  const [phone, setPhone] = useState('')
  const [cartOpen, setCartOpen] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const [search, setSearch] = useState('')
  const [view, setView] = useState<View>({ type: 'regions' })

  // Catálogo: primero fallback síncrono (sin parpadeo), después remoto en background.
  const [catalog, setCatalog] = useState<CatalogData>(() => fallbackCatalog())
  useEffect(() => {
    let cancelled = false
    loadCatalog().then((c) => {
      if (!cancelled) setCatalog(c)
    })
    return () => {
      cancelled = true
    }
  }, [])

  function enter(p: string, r: Recognized | null) {
    setPhone(p)
    setRecognized(r)
    setScreen('catalog')
  }

  function handleNewOrder() {
    if (order.items.length > 0 && !window.confirm('¿Empezar un pedido nuevo? Se borrará el pedido actual.')) return
    order.clear()
    setSearch('')
    setView({ type: 'regions' })
    setCartOpen(false)
    window.scrollTo({ top: 0 })
  }

  // Búsqueda con sinónimos. Si hay query, filtramos y bloqueamos la vista de región.
  const searchResults = useMemo(() => {
    const q = normalize(search)
    if (!q) return null
    const ids = matchProducts(q, catalog.products.map((p) => p.id))
    if (!ids) return null
    return catalog.products.filter((p) => ids.includes(p.id))
  }, [search, catalog])

  const showSearchResults = searchResults !== null

  function handleAdd(product: Product) {
    order.add(product.id, product.name, product.defaultUnit)
    if (navigator.vibrate) navigator.vibrate(10)
  }

  if (screen === 'welcome') {
    return <Welcome onEnter={enter} />
  }

  return (
    <div className="flex min-h-svh flex-col bg-bg pb-24">
      {/* Header CEDIS */}
      <header className="sticky top-0 z-30 border-b border-line/10 bg-chrome">
        <div className="mx-auto w-full max-w-6xl">
          <div className="flex items-center gap-3 px-4 py-3">
            <Logo size={34} colorVar="var(--chrome-fg)" />
            <div className="min-w-0 flex-1 text-center">
              <div className="text-[10px] font-semibold uppercase tracking-[0.22em] text-red">Cárnicos</div>
              <div className="font-display text-lg leading-none text-chrome-fg">GUSTAVO</div>
            </div>
            <button
              type="button"
              onClick={() => setCartOpen(true)}
              className="relative cg-tap flex h-9 items-center gap-2 rounded-full bg-red px-3.5 text-xs font-bold text-white"
              title="Ver pedido"
            >
              Ver pedido
              {order.totalItems > 0 && (
                <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-white px-1 font-mono text-[11px] font-bold text-red">
                  {order.totalItems}
                </span>
              )}
            </button>
            <div className="relative shrink-0">
              <button
                type="button"
                onClick={() => setMenuOpen((o) => !o)}
                className={[
                  'cg-tap flex h-9 w-9 items-center justify-center rounded-full border',
                  menuOpen ? 'border-red bg-red text-white' : 'border-white/15 text-chrome-fg',
                ].join(' ')}
                aria-label="Ajustes"
                title="Ajustes"
              >
                <svg className="h-[18px] w-[18px]" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <circle cx="12" cy="12" r="3" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 11-2.83 2.83l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 11-4 0v-.09a1.65 1.65 0 00-1-1.51 1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 11-2.83-2.83l.06-.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-1.51-1H3a2 2 0 110-4h.09a1.65 1.65 0 001.51-1 1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 112.83-2.83l.06.06a1.65 1.65 0 001.82.33H9a1.65 1.65 0 001-1.51V3a2 2 0 114 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 112.83 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V9c.2.61.74 1.05 1.39 1.1H21a2 2 0 110 4h-.09a1.65 1.65 0 00-1.51 1z" />
                </svg>
              </button>
              {menuOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setMenuOpen(false)} />
                  <div className="cg-fade absolute right-0 top-11 z-50 w-60 rounded-2xl border border-line/12 bg-paper p-1.5 shadow-soft">
                    <div className="mb-1 flex items-center gap-2.5 border-b border-line/12 px-2.5 pb-2.5 pt-1.5">
                      <span className="flex h-9 w-9 items-center justify-center rounded-full bg-paper2 text-red">
                        <svg className="h-[18px] w-[18px]" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><circle cx="12" cy="12" r="4" /><path strokeLinecap="round" d="M16 12v1.5a2.5 2.5 0 005 0V12a9 9 0 10-3.5 7.1" /></svg>
                      </span>
                      <div className="min-w-0">
                        <div className="truncate text-[13.5px] font-extrabold text-ink">{recognized ? recognized.businessName : 'Tu cuenta'}</div>
                        <div className="text-[11px] font-medium text-ink-soft">{recognized ? recognized.contactName || 'Cliente reconocido' : 'Invitado'}</div>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => { setMenuOpen(false); handleNewOrder() }}
                      className="flex w-full items-center gap-2.5 rounded-xl px-2.5 py-2 text-left text-[13px] font-bold text-ink active:bg-paper2"
                    >
                      <span className="flex h-6 w-6 items-center justify-center rounded-md bg-red text-base font-bold leading-none text-white">+</span>
                      Pedido nuevo
                    </button>
                    <button
                      type="button"
                      onClick={() => { setMenuOpen(false); toggle() }}
                      className="flex w-full items-center gap-2.5 rounded-xl px-2.5 py-2 text-left text-[13px] font-bold text-ink active:bg-paper2"
                    >
                      <span className="flex h-6 w-6 items-center justify-center rounded-md bg-paper2 text-ink-soft">{theme === 'dark' ? '☀' : '☾'}</span>
                      Tema: {theme === 'dark' ? 'Claro' : 'Oscuro'}
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>

          <div className="bg-bg px-4 pb-1 pt-3">
            <h1 className="font-display text-[27px] leading-none text-ink">Haz tu pedido</h1>
            <p className="mt-1.5 text-[13px] font-medium text-ink-soft">
              {recognized ? (
                <>
                  Hola, <span className="text-[16px] font-extrabold text-ink">{recognized.businessName || 'qué gusto verte'}</span>. Elige tus cortes y mándalos al CEDIS.
                </>
              ) : (
                `Elige tus cortes y mándalos al CEDIS de ${BUSINESS.locationLabel}.`
              )}
            </p>
          </div>
          <div className="bg-bg">
            <SearchBar value={search} onChange={setSearch} />
          </div>
        </div>
      </header>

      {/* Lista */}
      <main className="relative flex-1">
        {/* Logo grande de fondo (se desvanece al abrir el carrito) */}
        <div
          className="pointer-events-none absolute bottom-[18%] right-[-6%] transition-opacity duration-300"
          style={{ opacity: cartOpen ? 0 : 0.04 }}
        >
          <Logo size={280} />
        </div>

        <div className="relative mx-auto w-full max-w-6xl py-3">
          {/* Búsqueda con resultados en línea */}
          {showSearchResults && (
            <SearchResults
              products={searchResults!}
              getQuantity={order.getQuantity}
              getItem={order.getItem}
              onAdd={handleAdd}
              onIncrement={order.increment}
              onDecrement={order.decrement}
              onSetUnit={order.setUnit}
              onSetQuantity={order.setQuantity}
              query={search}
            />
          )}

          {/* Sin búsqueda: navegación por regiones */}
          {!showSearchResults && view.type === 'regions' && (
            <RegionGrid
              activeRegion={null}
              onSelectRegion={(id) => setView({ type: 'region', regionId: id })}
              onSelectFrequent={() => {
                setView({ type: 'frequent' })
                window.scrollTo({ top: 0 })
              }}
              showFrequentTab
            />
          )}

          {!showSearchResults && view.type === 'region' && (
            <RegionView
              regionId={view.regionId}
              onBack={() => {
                setView({ type: 'regions' })
                window.scrollTo({ top: 0 })
              }}
              getQuantity={order.getQuantity}
              getItem={order.getItem}
              onAdd={handleAdd}
              onIncrement={order.increment}
              onDecrement={order.decrement}
              onSetUnit={order.setUnit}
              onSetQuantity={order.setQuantity}
            />
          )}

          {!showSearchResults && view.type === 'frequent' && (
            <FrequentView
              catalog={catalog}
              onBack={() => {
                setView({ type: 'regions' })
                window.scrollTo({ top: 0 })
              }}
              getQuantity={order.getQuantity}
              getItem={order.getItem}
              onAdd={handleAdd}
              onIncrement={order.increment}
              onDecrement={order.decrement}
              onSetUnit={order.setUnit}
              onSetQuantity={order.setQuantity}
            />
          )}

          {!showSearchResults && (
            <div className="mt-2 px-4 pb-4 text-center text-xs text-ink-faint">
              {catalog.products.length} productos en {catalog.regions.length} regiones
              {!catalog.fromRemote && ' · modo local'}
            </div>
          )}
        </div>
      </main>

      {/* Botón flotante del carrito */}
      {order.totalItems > 0 && !cartOpen && (
        <div className="fixed inset-x-0 bottom-0 z-40 px-4 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
          <button
            type="button"
            onClick={() => setCartOpen(true)}
            className="cg-tap mx-auto flex w-full max-w-md items-center justify-between rounded-2xl bg-red px-5 py-4 shadow-soft"
          >
            <div className="flex items-center gap-3">
              <div className="flex h-7 w-7 items-center justify-center rounded-full bg-white/20 font-mono text-sm font-bold text-white">
                {order.totalItems}
              </div>
              <span className="text-sm font-bold text-white">Ver pedido</span>
            </div>
            <span className="text-sm font-bold text-white/80">{order.items.length} productos</span>
          </button>
        </div>
      )}

      <CartSheet
        open={cartOpen}
        items={order.items}
        initialPhone={phone}
        recognized={recognized}
        onClose={() => setCartOpen(false)}
        onIncrement={order.increment}
        onDecrement={order.decrement}
        onRemove={order.remove}
        onClear={order.clear}
        onSetUnit={order.setUnit}
        onSetQuantity={order.setQuantity}
        onReplaceAll={order.replaceAll}
      />
    </div>
  )
}

/** Bloque de resultados de búsqueda, reutilizado por la búsqueda global. */
function SearchResults({
  products,
  query,
  getQuantity,
  getItem,
  onAdd,
  onIncrement,
  onDecrement,
  onSetUnit,
  onSetQuantity,
}: {
  products: Product[]
  query: string
  getQuantity: (id: string) => number
  getItem: (id: string) => { productId: string; name: string; quantity: number; unit: Unit } | undefined
  onAdd: (p: Product) => void
  onIncrement: (id: string) => void
  onDecrement: (id: string) => void
  onSetUnit: (id: string, u: Unit) => void
  onSetQuantity: (id: string, q: number) => void
}) {
  return (
    <div className="px-4 pb-3">
      <div className="mb-2 flex items-center justify-between">
        <div className="text-[11px] font-bold uppercase tracking-wider text-ink-faint">
          Resultados para “{query}”
        </div>
        <div className="text-[11px] font-medium text-ink-soft">
          {products.length} {products.length === 1 ? 'producto' : 'productos'}
        </div>
      </div>
      {products.length === 0 ? (
        <div className="mt-8 text-center text-sm text-ink-soft">
          No encontramos ese corte. Prueba con otro nombre (ej. “chicharrón”, “pancita”, “molida”).
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {products.map((product) => (
            <ProductRow
              key={product.id}
              product={product}
              quantity={getQuantity(product.id)}
              unit={getItem(product.id)?.unit ?? product.defaultUnit}
              onAdd={() => onAdd(product)}
              onIncrement={() => onIncrement(product.id)}
              onDecrement={() => onDecrement(product.id)}
              onSetUnit={(u) => onSetUnit(product.id, u)}
              onSetQuantity={(q) => onSetQuantity(product.id, q)}
            />
          ))}
        </div>
      )}
    </div>
  )
}

export default App

/** Vista "Frecuentes": productos más pedidos en los últimos 90 días. */
function FrequentView({
  catalog,
  onBack,
  getQuantity,
  getItem,
  onAdd,
  onIncrement,
  onDecrement,
  onSetUnit,
  onSetQuantity,
}: {
  catalog: CatalogData
  onBack: () => void
  getQuantity: (id: string) => number
  getItem: (id: string) => { productId: string; name: string; quantity: number; unit: Unit } | undefined
  onAdd: (p: Product) => void
  onIncrement: (id: string) => void
  onDecrement: (id: string) => void
  onSetUnit: (id: string, u: Unit) => void
  onSetQuantity: (id: string, q: number) => void
}) {
  const [frequent, setFrequent] = useState<Product[] | null>(null)
  const [note, setNote] = useState<string>('')

  useEffect(() => {
    let cancelled = false
    fetch('/api/frequent?limit=12')
      .then((r) => r.json())
      .then((data: { ok: boolean; items: { productId: string; name: string; count: number }[]; note?: string }) => {
        if (cancelled) return
        if (data.note) setNote(data.note)
        if (data.ok && data.items.length > 0) {
          const byId = new Map(catalog.products.map((p) => [p.id, p]))
          const ps = data.items
            .map((it) => byId.get(it.productId))
            .filter((p): p is Product => Boolean(p))
          setFrequent(ps)
        }
      })
      .catch(() => {
        if (!cancelled) setFrequent([])
      })
    return () => { cancelled = true }
  }, [catalog])

  // Si no hay datos remotos, fallback: top productos por sortOrder de las
  // primeras 3 regiones (lomo, pierna, cabeza son las más típicas).
  const display = useMemo(() => {
    if (frequent) return frequent
    const topRegions: RegionId[] = ['lomo-espaldilla', 'pierna-jamon', 'cabeza-cachete', 'panza-pecho', 'costillar-hueso']
    const ps: Product[] = []
    for (const r of topRegions) {
      const items = catalog.products.filter((p) => p.regionId === r).sort((a, b) => a.sortOrder - b.sortOrder)
      ps.push(...items.slice(0, 2))
      if (ps.length >= 12) break
    }
    return ps.slice(0, 12)
  }, [frequent, catalog])

  return (
    <div className="px-4 pb-3">
      <div className="sticky top-[120px] z-20 -mx-4 mb-3 flex items-center gap-2 border-b border-line/10 bg-bg/95 px-4 py-2 backdrop-blur">
        <button
          type="button"
          onClick={onBack}
          className="cg-tap flex h-9 w-9 items-center justify-center rounded-full border border-line/15 bg-paper text-ink active:bg-paper2"
          aria-label="Volver"
        >
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <div className="flex min-w-0 flex-1 items-center gap-2">
          <span className="text-xl leading-none" aria-hidden="true">⭐</span>
          <div className="min-w-0">
            <div className="truncate text-[15px] font-extrabold text-amber-700">Frecuentes</div>
            <div className="truncate text-[11px] font-medium text-ink-soft">
              {note ? 'Sin datos aún — los clientes aún no piden.' : 'Lo que más se pide'}
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {display.map((product) => (
          <ProductRow
            key={product.id}
            product={product}
            quantity={getQuantity(product.id)}
            unit={getItem(product.id)?.unit ?? product.defaultUnit}
            onAdd={() => onAdd(product)}
            onIncrement={() => onIncrement(product.id)}
            onDecrement={() => onDecrement(product.id)}
            onSetUnit={(u) => onSetUnit(product.id, u)}
            onSetQuantity={(q) => onSetQuantity(product.id, q)}
          />
        ))}
      </div>
    </div>
  )
}
