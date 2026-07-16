import { CATEGORY_META } from '../data/products'
import type { Product } from '../data/products'
import type { Unit } from '../hooks/useOrder'
import { QtyInput } from './QtyInput'

type Props = {
  product: Product
  quantity: number
  unit: Unit
  onAdd: () => void
  onIncrement: () => void
  onDecrement: () => void
  onSetUnit: (unit: Unit) => void
  onSetQuantity: (qty: number) => void
}

export function ProductRow({
  product,
  quantity,
  unit,
  onAdd,
  onIncrement,
  onDecrement,
  onSetUnit,
  onSetQuantity,
}: Props) {
  const inOrder = quantity > 0
  const meta = CATEGORY_META[product.category]

  return (
    <div
      className={[
        'rounded-2xl border bg-paper px-3 py-3 transition-colors sm:px-3.5',
        inOrder ? 'border-red/45' : 'border-line/10',
      ].join(' ')}
    >
      <div className="flex items-start gap-2.5">
        {/* Foto o glifo de categoría */}
        <ProductThumb product={product} />

        <div className="flex min-w-0 flex-1 items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <div className="break-words text-[14px] font-extrabold uppercase leading-tight tracking-tight text-ink sm:text-[15px]">
              {product.name}
            </div>
            {product.description && (
              <div className="mt-0.5 line-clamp-2 text-[11px] font-medium leading-snug text-ink-soft">
                {product.description}
              </div>
            )}
          </div>

          {!inOrder ? (
            <button
              type="button"
              onClick={onAdd}
              className={`cg-tap shrink-0 rounded-xl px-3 py-2 text-[13px] font-bold shadow-soft sm:px-4 sm:text-sm ${meta.solid}`}
            >
              + Agregar
            </button>
          ) : (
            <div className="flex shrink-0 items-center gap-1">
              <button
                type="button"
                onClick={onDecrement}
                className={`cg-tap flex h-8 w-8 items-center justify-center rounded-lg text-base font-bold sm:h-9 sm:w-9 sm:text-lg ${meta.outline}`}
                aria-label="Quitar uno"
              >
                −
              </button>
              <QtyInput
                value={quantity}
                onChange={onSetQuantity}
                className="h-8 w-12 rounded-lg border border-line/15 bg-paper2 text-center font-mono text-[13px] font-bold text-ink outline-none focus:border-red sm:h-9 sm:w-14 sm:text-sm"
              />
              <button
                type="button"
                onClick={onIncrement}
                className={`cg-tap flex h-8 w-8 items-center justify-center rounded-lg text-base font-bold sm:h-9 sm:w-9 sm:text-lg ${meta.solid}`}
                aria-label="Agregar uno"
              >
                +
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Selector de unidad: solo visible cuando el producto esta en el pedido */}
      {inOrder && (
        <div className="mt-2.5 flex items-center justify-between gap-2">
          <span className="text-[11px] font-semibold text-ink-soft">Pedir en</span>
          <div className="inline-flex overflow-hidden rounded-lg border border-line/15">
            <button
              type="button"
              onClick={() => onSetUnit('piezas')}
              className={[
                'px-3 py-1 text-xs font-bold transition-colors',
                unit === 'piezas' ? 'bg-red text-white' : 'bg-paper text-ink-soft',
              ].join(' ')}
            >
              Piezas
            </button>
            <button
              type="button"
              onClick={() => onSetUnit('kg')}
              className={[
                'px-3 py-1 text-xs font-bold transition-colors',
                unit === 'kg' ? 'bg-red text-white' : 'bg-paper text-ink-soft',
              ].join(' ')}
            >
              Kg
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

function ProductThumb({ product }: { product: Product }) {
  const meta = CATEGORY_META[product.category]
  if (product.photo) {
    return (
      <div className="relative h-11 w-11 shrink-0 overflow-hidden rounded-xl bg-paper2 sm:h-12 sm:w-12">
        <img
          src={product.photo}
          alt={product.name}
          loading="lazy"
          className="h-full w-full object-cover"
          onError={(e) => {
            // Si la foto falla al cargar, la ocultamos y mostramos el glifo
            ;(e.target as HTMLImageElement).style.display = 'none'
          }}
        />
      </div>
    )
  }
  return (
    <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${meta.solid} bg-opacity-15 sm:h-12 sm:w-12`}>
      <CategoryGlyph category={product.category} />
    </div>
  )
}

/** Glifo simple por categoría. Colorea según el color de la categoría. */
function CategoryGlyph({ category }: { category: Product['category'] }) {
  const cls = CATEGORY_META[category]
  const colorClass = cls.solid.replace('bg-', 'text-').split(' ')[0] // ej "text-rose-600"
  const common = 'h-5 w-5 sm:h-6 sm:w-6'
  switch (category) {
    case 'canales':
      return (
        <svg className={`${common} ${colorClass}`} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
          <path d="M12 3c-3 0-6 2-6 5 0 2 1 3 1 5l-1 4c0 1 1 2 2 2h8c1 0 2-1 2-2l-1-4c0-2 1-3 1-5 0-3-3-5-6-5z" />
        </svg>
      )
    case 'lomos':
      return (
        <svg className={`${common} ${colorClass}`} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
          <path d="M5 7c-1 1-2 3-2 5s1 4 2 5h14c1-1 2-3 2-5s-1-4-2-5H5z" />
        </svg>
      )
    case 'jamones':
      return (
        <svg className={`${common} ${colorClass}`} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
          <ellipse cx="12" cy="13" rx="7" ry="8" />
          <circle cx="12" cy="9" r="2" fill="white" opacity="0.4" />
        </svg>
      )
    case 'cueros':
      return (
        <svg className={`${common} ${colorClass}`} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
          <rect x="3" y="6" width="18" height="12" rx="2" />
          <rect x="6" y="9" width="12" height="6" rx="1" fill="white" opacity="0.3" />
        </svg>
      )
    case 'pulpas':
      return (
        <svg className={`${common} ${colorClass}`} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
          <path d="M4 8c0-2 2-4 4-4h8c2 0 4 2 4 4v8c0 2-2 4-4 4H8c-2 0-4-2-4-4V8z" />
        </svg>
      )
    case 'visceras':
      return (
        <svg className={`${common} ${colorClass}`} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
          <path d="M5 5c-2 3-2 8 0 11 1 1 3 1 4 0 1-1 1-3 0-4-1-1-1-3 0-4 1-1 3-1 4 0 1 1 1 3 0 4-1 1-1 3 0 4 1 1 3 1 4 0 2-3 2-8 0-11-2-2-5-3-8-3s-6 1-8 3z" />
        </svg>
      )
    case 'huesos':
      return (
        <svg className={`${common} ${colorClass}`} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
          <path d="M7 3c-1 0-2 1-2 2 0 1 1 2 2 2 0 1-1 2-1 4s1 3 2 4c1 1 1 2 1 3 0 1 1 2 2 2s2-1 2-2c0-1 0-2 1-3 1-1 2-2 2-4s-1-3-1-4c1 0 2-1 2-2 0-1-1-2-2-2-2 0-3 1-4 3-1-2-2-3-4-3z" />
        </svg>
      )
    case 'otros':
    default:
      return (
        <svg className={`${common} ${colorClass}`} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
          <circle cx="12" cy="12" r="8" />
        </svg>
      )
  }
}
