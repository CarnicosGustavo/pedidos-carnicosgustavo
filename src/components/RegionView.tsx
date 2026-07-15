import { REGION_BY_ID, REGION_COLOR_CLASS, type RegionId } from '../data/regions'
import { productsByRegion, type Product, type Unit } from '../data/products'
import { ProductRow } from './ProductRow'

type Props = {
  regionId: RegionId
  onBack: () => void
  getQuantity: (productId: string) => number
  getItem: (productId: string) => { productId: string; name: string; quantity: number; unit: Unit } | undefined
  onAdd: (product: Product) => void
  onIncrement: (productId: string) => void
  onDecrement: (productId: string) => void
  onSetUnit: (productId: string, unit: Unit) => void
  onSetQuantity: (productId: string, qty: number) => void
}

export function RegionView({
  regionId,
  onBack,
  getQuantity,
  getItem,
  onAdd,
  onIncrement,
  onDecrement,
  onSetUnit,
  onSetQuantity,
}: Props) {
  const region = REGION_BY_ID[regionId]
  const products = productsByRegion(regionId)
  const colors = REGION_COLOR_CLASS[region.color]

  return (
    <div className="px-4 pb-3">
      {/* Breadcrumb / back */}
      <div className="sticky top-[120px] z-20 -mx-4 mb-3 flex items-center gap-2 border-b border-line/10 bg-bg/95 px-4 py-2 backdrop-blur">
        <button
          type="button"
          onClick={onBack}
          className="cg-tap flex h-9 w-9 items-center justify-center rounded-full border border-line/15 bg-paper text-ink active:bg-paper2"
          aria-label="Volver a regiones"
        >
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <div className="flex min-w-0 flex-1 items-center gap-2">
          <span className="text-xl leading-none" aria-hidden="true">{region.emoji}</span>
          <div className="min-w-0">
            <div className={`truncate text-[15px] font-extrabold ${colors.text}`}>{region.name}</div>
            <div className="truncate text-[11px] font-medium text-ink-soft">
              {products.length} {products.length === 1 ? 'producto' : 'productos'}
            </div>
          </div>
        </div>
      </div>

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
    </div>
  )
}
