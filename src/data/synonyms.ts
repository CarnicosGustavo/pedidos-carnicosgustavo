/**
 * Diccionario de sinónimos / términos coloquiales que los clientes usan al
 * pedir por WhatsApp pero que no aparecen en el `name` del producto.
 *
 * Clave: término que escribe el cliente (lowercase, sin acentos, una palabra
 *        o frase corta).
 * Valor: lista de `productId` que debe devolver la búsqueda cuando el
 *        cliente escribe ese término.
 *
 * Cuando la app se conecte a Supabase, estos sinónimos se leen desde la
 * tabla `product_synonyms` — este archivo queda como fallback offline y
 * como fuente de la primera versión.
 */
export const SEARCH_SYNONYMS: Record<string, string[]> = {
  // Chuletas / lomos
  'chuleta':              ['lomo', 'costillar', 'lomo-usa'],
  'chuleta ahumada':      ['ahumada'],
  'chuleton':             ['lomo', 'lomo-completo-americano', 'lomo-usa'],
  'lomo ahumado':         ['ahumada'],

  // Chicharrón / pancita
  'chicharron':           ['barriga', 'barriga-cc', 'tocino', 'tocino-azul'],
  'chicharron de cerdo':  ['barriga', 'barriga-cc', 'cuero'],
  'pancita':              ['barriga', 'barriga-cc'],
  'panza':                ['barriga', 'barriga-cc', 'cueros-c-panza', 'cueros-s-panza'],

  // Carne molida
  'molida':               ['prensa-natural', 'prensa-molida'],
  'carne molida':         ['prensa-natural', 'prensa-molida'],
  'carne picada':         ['prensa-natural', 'prensa-molida'],
  'hamburguesa':          ['prensa-natural', 'prensa-molida'],

  // Tamal
  'tamal':                ['cuero', 'cuero-recorte', 'cuero-cuadrado'],
  'tamalon':              ['cuero', 'cuero-recorte'],

  // Cabeza / cachete
  'cabeza':               ['cabeza', 'cachete', 'mascara', 'mascara-completa', 'sesos', 'lengua', 'papada', 'orejas', 'trompa'],
  'sesos':                ['sesos'],
  'cachete':              ['cachete', 'cabeza'],
  'trompa':               ['trompa', 'cabeza'],
  'mascara':              ['mascara', 'mascara-completa', 'mascara-recorte'],

  // Patas / manos
  'manita':               ['manos', 'patas'],
  'patitas':              ['patas', 'manos'],

  // Hueso
  'hueso':                ['hueso-americano', 'espinazo', 'codillo', 'canas'],
  'hueso para caldo':     ['hueso-americano', 'espinazo', 'codillo', 'canas'],
  'caldo':                ['hueso-americano', 'espinazo', 'codillo', 'canas'],

  // Manteca / grasa
  'manteca':              ['manteca', 'grasa', 'lardo'],
  'grasa':                ['grasa', 'manteca', 'lardo', 'capote'],

  // Longaniza / chorizo (materia prima)
  'longaniza':            ['tripas'],
  'chorizo':              ['tripas'],
  'tripa':                ['tripas'],

  // Cola / rabo
  'cola':                 ['rabos-carnudos', 'rabos-pelones', 'ahumada'],
  'rabo':                 ['rabos-carnudos', 'rabos-pelones'],
  'rabos':                ['rabos-carnudos', 'rabos-pelones'],
}

/** Quita acentos y pasa a minúsculas para matching consistente. */
export function normalize(s: string): string {
  return s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
}

/**
 * Dado un query y la lista de productos, devuelve los IDs que matchean.
 * Reglas (en orden):
 *   1. Si el query matchea una clave de SEARCH_SYNONYMS → devuelve esos IDs.
 *   2. Si matchea el `name` (o parte) de algún producto → devuelve esos.
 *   3. Combina ambos sin duplicar.
 *
 * Si el query es vacío → devuelve null (señal de "sin filtro de texto").
 */
export function matchProducts(
  query: string,
  allIds: string[],
): string[] | null {
  const q = normalize(query)
  if (!q) return null

  const bySynonym = SEARCH_SYNONYMS[q] ?? []
  const partialSynonym = Object.entries(SEARCH_SYNONYMS)
    .filter(([k]) => normalize(k).includes(q))
    .flatMap(([, ids]) => ids)

  const byName = allIds.filter((id) => normalize(id).includes(q))

  const set = new Set<string>([...bySynonym, ...partialSynonym, ...byName])
  return [...set]
}
