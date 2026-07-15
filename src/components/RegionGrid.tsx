import { REGION_COLOR_CLASS, REGIONS, type RegionId } from '../data/regions'
import { productsByRegion } from '../data/products'

type Props = {
  activeRegion: RegionId | null
  onSelectRegion: (id: RegionId) => void
  onSelectFrequent?: () => void
  showFrequentTab?: boolean
}

export function RegionGrid({ activeRegion, onSelectRegion, onSelectFrequent, showFrequentTab }: Props) {
  return (
    <div className="px-4 pb-3">
      {showFrequentTab && onSelectFrequent && (
        <button
          type="button"
          onClick={onSelectFrequent}
          className="mb-3 flex w-full items-center justify-between rounded-2xl border border-line/12 bg-paper px-4 py-3 text-left active:scale-[0.99] transition-transform"
        >
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-100 text-xl">⭐</span>
            <div>
              <div className="text-[15px] font-extrabold text-ink">Frecuentes</div>
              <div className="text-[11px] font-medium text-ink-soft">Lo que más se pide</div>
            </div>
          </div>
          <svg className="h-5 w-5 text-ink-soft" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      )}

      <div className="mb-2 px-1 text-[11px] font-bold uppercase tracking-wider text-ink-faint">
        Explorar por región
      </div>

      <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-4">
        {REGIONS.map((r) => {
          const isActive = activeRegion === r.id
          const colors = REGION_COLOR_CLASS[r.color]
          const count = productsByRegion(r.id).length
          return (
            <button
              key={r.id}
              type="button"
              onClick={() => onSelectRegion(r.id)}
              className={[
                'flex flex-col items-start gap-1.5 rounded-2xl border-2 p-3 text-left transition-all active:scale-[0.98]',
                isActive
                  ? `${colors.bg} text-white border-transparent shadow-soft`
                  : `bg-paper ${colors.border} hover:border-current`,
              ].join(' ')}
            >
              <div className="flex w-full items-center justify-between">
                <span className="text-2xl leading-none" aria-hidden="true">{r.emoji}</span>
                <span
                  className={[
                    'rounded-full px-2 py-0.5 text-[10px] font-bold',
                    isActive ? 'bg-white/25 text-white' : 'bg-paper2 text-ink-soft',
                  ].join(' ')}
                >
                  {count}
                </span>
              </div>
              <div className="min-w-0">
                <div className="truncate text-[13.5px] font-extrabold uppercase leading-tight">
                  {r.shortName}
                </div>
                <div
                  className={[
                    'truncate text-[10.5px] font-medium',
                    isActive ? 'text-white/85' : 'text-ink-soft',
                  ].join(' ')}
                >
                  {r.name}
                </div>
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}
