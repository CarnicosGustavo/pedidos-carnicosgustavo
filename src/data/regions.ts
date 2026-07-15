export type RegionId =
  | 'canal'
  | 'pierna-jamon'
  | 'lomo-espaldilla'
  | 'panza-pecho'
  | 'costillar-hueso'
  | 'cabeza-cachete'
  | 'cuero'
  | 'pulpa-retazo'
  | 'grasa-manteca'
  | 'rabos'

export type Region = {
  id: RegionId
  name: string
  shortName: string
  emoji: string
  color: 'red' | 'amber' | 'orange' | 'pink' | 'purple' | 'stone' | 'teal' | 'rose' | 'amber2' | 'stone2'
  sortOrder: number
}

export const REGIONS: Region[] = [
  { id: 'canal',            name: 'Canal completo',       shortName: 'Canal',    emoji: '🐖', color: 'stone',  sortOrder: 0 },
  { id: 'pierna-jamon',     name: 'Pierna y Jamón',       shortName: 'Pierna',   emoji: '🍖', color: 'amber',  sortOrder: 1 },
  { id: 'lomo-espaldilla',  name: 'Lomo y Espaldilla',    shortName: 'Lomo',     emoji: '🥩', color: 'red',    sortOrder: 2 },
  { id: 'panza-pecho',      name: 'Panza y Pecho',        shortName: 'Panza',    emoji: '🥓', color: 'pink',   sortOrder: 3 },
  { id: 'costillar-hueso',  name: 'Costillar y Hueso',    shortName: 'Hueso',    emoji: '🦴', color: 'stone2', sortOrder: 4 },
  { id: 'cabeza-cachete',   name: 'Cabeza y Cachete',     shortName: 'Cabeza',   emoji: '🐷', color: 'rose',   sortOrder: 5 },
  { id: 'cuero',            name: 'Cuero',                shortName: 'Cuero',    emoji: '🟫', color: 'orange', sortOrder: 6 },
  { id: 'pulpa-retazo',     name: 'Pulpa y Retazo',       shortName: 'Pulpa',    emoji: '🟥', color: 'red',    sortOrder: 7 },
  { id: 'grasa-manteca',    name: 'Grasa y Manteca',      shortName: 'Grasa',    emoji: '🟨', color: 'amber2', sortOrder: 8 },
  { id: 'rabos',            name: 'Rabos',                shortName: 'Rabos',    emoji: '🟢', color: 'teal',   sortOrder: 9 },
]

export const REGION_BY_ID: Record<RegionId, Region> = REGIONS.reduce(
  (acc, r) => ({ ...acc, [r.id]: r }),
  {} as Record<RegionId, Region>,
)

export const REGION_COLOR_CLASS: Record<Region['color'], { bg: string; text: string; border: string; ring: string }> = {
  red:    { bg: 'bg-red-600',     text: 'text-red-600',     border: 'border-red-300',     ring: 'ring-red-500' },
  amber:  { bg: 'bg-amber-500',   text: 'text-amber-600',   border: 'border-amber-300',   ring: 'ring-amber-500' },
  amber2: { bg: 'bg-amber-400',   text: 'text-amber-700',   border: 'border-amber-300',   ring: 'ring-amber-500' },
  orange: { bg: 'bg-orange-500',  text: 'text-orange-600',  border: 'border-orange-300',  ring: 'ring-orange-500' },
  pink:   { bg: 'bg-pink-600',    text: 'text-pink-600',    border: 'border-pink-300',    ring: 'ring-pink-500' },
  purple: { bg: 'bg-purple-600',  text: 'text-purple-600',  border: 'border-purple-300',  ring: 'ring-purple-500' },
  stone:  { bg: 'bg-stone-600',   text: 'text-stone-600',   border: 'border-stone-300',   ring: 'ring-stone-500' },
  stone2: { bg: 'bg-stone-500',   text: 'text-stone-600',   border: 'border-stone-300',   ring: 'ring-stone-500' },
  teal:   { bg: 'bg-teal-600',    text: 'text-teal-600',    border: 'border-teal-300',    ring: 'ring-teal-500' },
  rose:   { bg: 'bg-rose-600',    text: 'text-rose-600',    border: 'border-rose-300',    ring: 'ring-rose-500' },
}
