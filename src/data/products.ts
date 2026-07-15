import type { RegionId } from './regions'

export type Category =
  | 'canales'
  | 'lomos'
  | 'jamones'
  | 'cueros'
  | 'pulpas'
  | 'visceras'
  | 'huesos'
  | 'otros'

export type Unit = 'piezas' | 'kg'

export type Product = {
  id: string
  name: string
  category: Category
  regionId: RegionId
  defaultUnit: Unit
  /** URL pública (Supabase Storage). Opcional: si falta, se muestra glifo. */
  photo?: string
  /** Orden dentro de la región (1-based, menor = primero). */
  sortOrder: number
  /** Descripción corta opcional, visible como tooltip / bajo el nombre. */
  description?: string
  /** Activo en el catálogo (admin). */
  is_active?: boolean
}

export const PRODUCTS: Product[] = [
  // ── canal ─────────────────────────────────────────────────────────
  { id: 'canal',                  name: 'CANAL',                          regionId: 'canal',           defaultUnit: 'piezas', sortOrder: 1,  category: 'canales'  },
  { id: 'canal-americano',        name: 'CANAL AMERICANO',                regionId: 'canal',           defaultUnit: 'piezas', sortOrder: 2,  category: 'canales'  },
  { id: 'canal-nacional-lomo',    name: 'CANAL NACIONAL LADO LOMO',       regionId: 'canal',           defaultUnit: 'piezas', sortOrder: 3,  category: 'canales'  },
  { id: 'canal-nacional-espilomo',name: 'CANAL NACIONAL LADO ESPILOMO',   regionId: 'canal',           defaultUnit: 'piezas', sortOrder: 4,  category: 'canales'  },

  // ── pierna-jamon ──────────────────────────────────────────────────
  { id: 'jamon',                  name: 'JAMON',                          regionId: 'pierna-jamon',    defaultUnit: 'piezas', sortOrder: 1,  category: 'jamones'  },
  { id: 'jamon-cg',               name: 'JAMON C/G',                      regionId: 'pierna-jamon',    defaultUnit: 'piezas', sortOrder: 2,  category: 'jamones'  },
  { id: 'jamon-pinto',            name: 'JAMON PINTO',                    regionId: 'pierna-jamon',    defaultUnit: 'piezas', sortOrder: 3,  category: 'jamones'  },
  { id: 'jamon-sh',               name: 'JAMON S/H',                      regionId: 'pierna-jamon',    defaultUnit: 'piezas', sortOrder: 4,  category: 'jamones'  },
  { id: 'pierna',                 name: 'PIERNA',                         regionId: 'pierna-jamon',    defaultUnit: 'piezas', sortOrder: 5,  category: 'jamones'  },

  // ── lomo-espaldilla ───────────────────────────────────────────────
  { id: 'lomo',                   name: 'LOMO',                           regionId: 'lomo-espaldilla', defaultUnit: 'piezas', sortOrder: 1,  category: 'lomos'    },
  { id: 'lomo-completo-americano',name: 'LOMO COMPLETO AMERICANO',        regionId: 'lomo-espaldilla', defaultUnit: 'piezas', sortOrder: 2,  category: 'lomos'    },
  { id: 'lomo-completo-np',       name: 'LOMO COMPLETO N/P',              regionId: 'lomo-espaldilla', defaultUnit: 'piezas', sortOrder: 3,  category: 'lomos'    },
  { id: 'lomo-usa',               name: 'LOMO USA',                       regionId: 'lomo-espaldilla', defaultUnit: 'piezas', sortOrder: 4,  category: 'lomos'    },
  { id: 'lomo-s-cabeza',          name: 'LOMO S/CABEZA',                  regionId: 'lomo-espaldilla', defaultUnit: 'piezas', sortOrder: 5,  category: 'lomos'    },
  { id: 'lomo-pinto',             name: 'LOMO PINTO',                     regionId: 'lomo-espaldilla', defaultUnit: 'piezas', sortOrder: 6,  category: 'lomos'    },
  { id: 'c-lomo',                 name: 'C/LOMO',                         regionId: 'lomo-espaldilla', defaultUnit: 'piezas', sortOrder: 7,  category: 'lomos'    },
  { id: 'c-lomo-ch',              name: 'C/LOMO C/H',                     regionId: 'lomo-espaldilla', defaultUnit: 'piezas', sortOrder: 8,  category: 'lomos'    },
  { id: 'espilomo',               name: 'ESPILOMO',                       regionId: 'lomo-espaldilla', defaultUnit: 'piezas', sortOrder: 9,  category: 'lomos'    },
  { id: 'filete',                 name: 'FILETE',                         regionId: 'lomo-espaldilla', defaultUnit: 'piezas', sortOrder: 10, category: 'lomos'    },
  { id: 'espaldilla',             name: 'ESPALDILLA',                     regionId: 'lomo-espaldilla', defaultUnit: 'piezas', sortOrder: 11, category: 'otros'    },

  // ── panza-pecho ───────────────────────────────────────────────────
  { id: 'barriga',                name: 'BARRIGA',                        regionId: 'panza-pecho',     defaultUnit: 'piezas', sortOrder: 1,  category: 'otros'    },
  { id: 'barriga-cc',             name: 'BARRIGA C/C',                    regionId: 'panza-pecho',     defaultUnit: 'piezas', sortOrder: 2,  category: 'otros'    },
  { id: 'pecho',                  name: 'PECHO',                          regionId: 'panza-pecho',     defaultUnit: 'piezas', sortOrder: 3,  category: 'otros'    },
  { id: 'pecho-c-cuero',          name: 'PECHO C/CUERO',                  regionId: 'panza-pecho',     defaultUnit: 'piezas', sortOrder: 4,  category: 'otros'    },
  { id: 'tocino',                 name: 'TOCINO',                         regionId: 'panza-pecho',     defaultUnit: 'piezas', sortOrder: 5,  category: 'otros'    },
  { id: 'tocino-azul',            name: 'TOCINO AZUL',                    regionId: 'panza-pecho',     defaultUnit: 'piezas', sortOrder: 6,  category: 'otros'    },
  { id: 'sancocho',               name: 'SANCOCHO',                       regionId: 'panza-pecho',     defaultUnit: 'kg',     sortOrder: 7,  category: 'otros'    },
  { id: 'prensa-molida',          name: 'PRENSA MOLIDA',                  regionId: 'panza-pecho',     defaultUnit: 'kg',     sortOrder: 8,  category: 'otros'    },

  // ── costillar-hueso ───────────────────────────────────────────────
  { id: 'hueso-americano',        name: 'HUESO AMERICANO',                regionId: 'costillar-hueso', defaultUnit: 'kg',     sortOrder: 1,  category: 'huesos'   },
  { id: 'espinazo',               name: 'ESPINAZO',                       regionId: 'costillar-hueso', defaultUnit: 'kg',     sortOrder: 2,  category: 'huesos'   },
  { id: 'costillar',              name: 'COSTILLAR',                      regionId: 'costillar-hueso', defaultUnit: 'piezas', sortOrder: 3,  category: 'huesos'   },
  { id: 'codillo',                name: 'CODILLO',                        regionId: 'costillar-hueso', defaultUnit: 'piezas', sortOrder: 4,  category: 'huesos'   },
  { id: 'canas',                  name: 'CAÑA',                           regionId: 'costillar-hueso', defaultUnit: 'kg',     sortOrder: 5,  category: 'huesos'   },
  { id: 'manos',                  name: 'MANOS',                          regionId: 'costillar-hueso', defaultUnit: 'piezas', sortOrder: 6,  category: 'huesos'   },
  { id: 'patas',                  name: 'PATAS',                          regionId: 'costillar-hueso', defaultUnit: 'piezas', sortOrder: 7,  category: 'huesos'   },

  // ── cabeza-cachete ────────────────────────────────────────────────
  { id: 'cabeza',                 name: 'CABEZA',                         regionId: 'cabeza-cachete',  defaultUnit: 'piezas', sortOrder: 1,  category: 'otros'    },
  { id: 'cachete',                name: 'CACHETE',                        regionId: 'cabeza-cachete',  defaultUnit: 'piezas', sortOrder: 2,  category: 'otros'    },
  { id: 'mascara',                name: 'MASCARA',                        regionId: 'cabeza-cachete',  defaultUnit: 'piezas', sortOrder: 3,  category: 'otros'    },
  { id: 'mascara-completa',       name: 'MASCARA COMPLETA',               regionId: 'cabeza-cachete',  defaultUnit: 'piezas', sortOrder: 4,  category: 'otros'    },
  { id: 'mascara-recorte',        name: 'RECORTE DE MASCARA',             regionId: 'cabeza-cachete',  defaultUnit: 'piezas', sortOrder: 5,  category: 'otros'    },
  { id: 'papada',                 name: 'PAPADA',                         regionId: 'cabeza-cachete',  defaultUnit: 'piezas', sortOrder: 6,  category: 'otros'    },
  { id: 'orejas',                 name: 'OREJAS',                         regionId: 'cabeza-cachete',  defaultUnit: 'piezas', sortOrder: 7,  category: 'otros'    },
  { id: 'trompa',                 name: 'TROMPA',                         regionId: 'cabeza-cachete',  defaultUnit: 'piezas', sortOrder: 8,  category: 'otros'    },
  { id: 'lengua',                 name: 'LENGUA',                         regionId: 'cabeza-cachete',  defaultUnit: 'piezas', sortOrder: 9,  category: 'visceras' },
  { id: 'sesos',                  name: 'SESOS',                          regionId: 'cabeza-cachete',  defaultUnit: 'piezas', sortOrder: 10, category: 'visceras' },
  { id: 'nana',                   name: 'NANA',                           regionId: 'cabeza-cachete',  defaultUnit: 'piezas', sortOrder: 11, category: 'visceras' },
  { id: 'buche',                  name: 'BUCHE',                          regionId: 'cabeza-cachete',  defaultUnit: 'piezas', sortOrder: 12, category: 'visceras' },
  { id: 'rinon',                  name: 'RIÑON',                          regionId: 'cabeza-cachete',  defaultUnit: 'piezas', sortOrder: 13, category: 'visceras' },
  { id: 'tripas',                 name: 'TRIPAS',                         regionId: 'cabeza-cachete',  defaultUnit: 'kg',     sortOrder: 14, category: 'visceras' },

  // ── cuero ─────────────────────────────────────────────────────────
  { id: 'cuero',                  name: 'CUERO',                          regionId: 'cuero',           defaultUnit: 'kg',     sortOrder: 1,  category: 'cueros'   },
  { id: 'cuero-recorte',          name: 'CUERO RECORTE',                  regionId: 'cuero',           defaultUnit: 'kg',     sortOrder: 2,  category: 'cueros'   },
  { id: 'cuero-cuadrado',         name: 'CUERO CUADRADO',                 regionId: 'cuero',           defaultUnit: 'kg',     sortOrder: 3,  category: 'cueros'   },
  { id: 'cueros-c-panza',         name: 'CUEROS C/PANZA',                 regionId: 'cuero',           defaultUnit: 'kg',     sortOrder: 4,  category: 'cueros'   },
  { id: 'cueros-s-panza',         name: 'CUEROS S/PANZA',                 regionId: 'cuero',           defaultUnit: 'kg',     sortOrder: 5,  category: 'cueros'   },

  // ── pulpa-retazo ──────────────────────────────────────────────────
  { id: 'pulpa',                  name: 'PULPA',                          regionId: 'pulpa-retazo',    defaultUnit: 'kg',     sortOrder: 1,  category: 'pulpas'   },
  { id: 'pulpa-cg',               name: 'PULPA C/G',                      regionId: 'pulpa-retazo',    defaultUnit: 'kg',     sortOrder: 2,  category: 'pulpas'   },
  { id: 'pulpa-espaldilla',       name: 'PULPA DE ESPALDILLA',            regionId: 'pulpa-retazo',    defaultUnit: 'kg',     sortOrder: 3,  category: 'pulpas'   },
  { id: 'pulpa-jamon',            name: 'PULPA DE JAMON',                 regionId: 'pulpa-retazo',    defaultUnit: 'kg',     sortOrder: 4,  category: 'pulpas'   },
  { id: 'retazo',                 name: 'RETAZO',                         regionId: 'pulpa-retazo',    defaultUnit: 'kg',     sortOrder: 5,  category: 'pulpas'   },
  { id: 'prensa-natural',         name: 'PRENSA NATURAL',                 regionId: 'pulpa-retazo',    defaultUnit: 'kg',     sortOrder: 6,  category: 'otros'    },

  // ── grasa-manteca ─────────────────────────────────────────────────
  { id: 'manteca',                name: 'MANTECA',                        regionId: 'grasa-manteca',   defaultUnit: 'kg',     sortOrder: 1,  category: 'otros'    },
  { id: 'grasa',                  name: 'GRASA',                          regionId: 'grasa-manteca',   defaultUnit: 'kg',     sortOrder: 2,  category: 'otros'    },
  { id: 'lardo',                  name: 'LARDO',                          regionId: 'grasa-manteca',   defaultUnit: 'kg',     sortOrder: 3,  category: 'otros'    },
  { id: 'capote',                 name: 'CAPOTE',                         regionId: 'grasa-manteca',   defaultUnit: 'kg',     sortOrder: 4,  category: 'otros'    },
  { id: 'corbatas',               name: 'CORBATA',                        regionId: 'grasa-manteca',   defaultUnit: 'kg',     sortOrder: 5,  category: 'otros'    },
  { id: 'desgrase',               name: 'DESGRASE',                       regionId: 'grasa-manteca',   defaultUnit: 'kg',     sortOrder: 6,  category: 'otros'    },

  // ── rabos ─────────────────────────────────────────────────────────
  { id: 'ahumada',                name: 'AHUMADA',                        regionId: 'rabos',           defaultUnit: 'piezas', sortOrder: 1,  category: 'otros'    },
  { id: 'rabos-carnudos',         name: 'RABOS CARNUDOS',                 regionId: 'rabos',           defaultUnit: 'piezas', sortOrder: 2,  category: 'otros'    },
  { id: 'rabos-pelones',          name: 'RABOS PELONES',                  regionId: 'rabos',           defaultUnit: 'piezas', sortOrder: 3,  category: 'otros'    },
]

/** Acceso rápido por ID. */
export const PRODUCT_BY_ID: Record<string, Product> = PRODUCTS.reduce(
  (acc, p) => ({ ...acc, [p.id]: p }),
  {} as Record<string, Product>,
)

/** Productos por región, ordenados por sortOrder. */
export function productsByRegion(regionId: string): Product[] {
  return PRODUCTS.filter((p) => p.regionId === regionId).sort((a, b) => a.sortOrder - b.sortOrder)
}
