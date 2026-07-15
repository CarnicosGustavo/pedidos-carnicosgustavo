-- seed.sql
-- Datos iniciales del catálogo (10 regiones, 69 productos, sinónimos base).
-- Idempotente: se puede correr varias veces sin duplicar.
-- Si quieres resetear, ejecuta primero:
--   truncate product_synonyms, frequent_products, products, regions restart identity cascade;

-- ──────────────────────────────────────────────────────────────────────
-- Regiones
-- ──────────────────────────────────────────────────────────────────────
insert into public.regions (id, name, short_name, emoji, color, sort_order) values
  ('canal',            'Canal completo',    'Canal',  '🐖', 'stone',  0),
  ('pierna-jamon',     'Pierna y Jamón',    'Pierna', '🍖', 'amber',  1),
  ('lomo-espaldilla',  'Lomo y Espaldilla', 'Lomo',   '🥩', 'red',    2),
  ('panza-pecho',      'Panza y Pecho',     'Panza',  '🥓', 'pink',   3),
  ('costillar-hueso',  'Costillar y Hueso', 'Hueso',  '🦴', 'stone2', 4),
  ('cabeza-cachete',   'Cabeza y Cachete',  'Cabeza', '🐷', 'rose',   5),
  ('cuero',            'Cuero',             'Cuero',  '🟫', 'orange', 6),
  ('pulpa-retazo',     'Pulpa y Retazo',    'Pulpa',  '🟥', 'red',    7),
  ('grasa-manteca',    'Grasa y Manteca',   'Grasa',  '🟨', 'amber2', 8),
  ('rabos',            'Rabos',             'Rabos',  '🟢', 'teal',   9)
on conflict (id) do update set
  name = excluded.name,
  short_name = excluded.short_name,
  emoji = excluded.emoji,
  color = excluded.color,
  sort_order = excluded.sort_order,
  updated_at = now();

-- ──────────────────────────────────────────────────────────────────────
-- Productos
-- ──────────────────────────────────────────────────────────────────────
insert into public.products
  (id, name, region_id, category, default_unit, sort_order) values
  -- canal
  ('canal',                   'CANAL',                         'canal',           'canales',  'piezas', 1),
  ('canal-americano',         'CANAL AMERICANO',               'canal',           'canales',  'piezas', 2),
  ('canal-nacional-lomo',     'CANAL NACIONAL LADO LOMO',      'canal',           'canales',  'piezas', 3),
  ('canal-nacional-espilomo', 'CANAL NACIONAL LADO ESPILOMO',  'canal',           'canales',  'piezas', 4),

  -- pierna-jamon
  ('jamon',                   'JAMON',                         'pierna-jamon',    'jamones',  'piezas', 1),
  ('jamon-cg',                'JAMON C/G',                     'pierna-jamon',    'jamones',  'piezas', 2),
  ('jamon-pinto',             'JAMON PINTO',                   'pierna-jamon',    'jamones',  'piezas', 3),
  ('jamon-sh',                'JAMON S/H',                     'pierna-jamon',    'jamones',  'piezas', 4),
  ('pierna',                  'PIERNA',                        'pierna-jamon',    'jamones',  'piezas', 5),

  -- lomo-espaldilla
  ('lomo',                    'LOMO',                          'lomo-espaldilla', 'lomos',    'piezas', 1),
  ('lomo-completo-americano', 'LOMO COMPLETO AMERICANO',       'lomo-espaldilla', 'lomos',    'piezas', 2),
  ('lomo-completo-np',        'LOMO COMPLETO N/P',             'lomo-espaldilla', 'lomos',    'piezas', 3),
  ('lomo-usa',                'LOMO USA',                      'lomo-espaldilla', 'lomos',    'piezas', 4),
  ('lomo-s-cabeza',           'LOMO S/CABEZA',                 'lomo-espaldilla', 'lomos',    'piezas', 5),
  ('lomo-pinto',              'LOMO PINTO',                    'lomo-espaldilla', 'lomos',    'piezas', 6),
  ('c-lomo',                  'C/LOMO',                        'lomo-espaldilla', 'lomos',    'piezas', 7),
  ('c-lomo-ch',               'C/LOMO C/H',                    'lomo-espaldilla', 'lomos',    'piezas', 8),
  ('espilomo',                'ESPILOMO',                      'lomo-espaldilla', 'lomos',    'piezas', 9),
  ('filete',                  'FILETE',                        'lomo-espaldilla', 'lomos',    'piezas', 10),
  ('espaldilla',              'ESPALDILLA',                    'lomo-espaldilla', 'otros',    'piezas', 11),

  -- panza-pecho
  ('barriga',                 'BARRIGA',                       'panza-pecho',     'otros',    'piezas', 1),
  ('barriga-cc',              'BARRIGA C/C',                   'panza-pecho',     'otros',    'piezas', 2),
  ('pecho',                   'PECHO',                         'panza-pecho',     'otros',    'piezas', 3),
  ('pecho-c-cuero',           'PECHO C/CUERO',                 'panza-pecho',     'otros',    'piezas', 4),
  ('tocino',                  'TOCINO',                        'panza-pecho',     'otros',    'piezas', 5),
  ('tocino-azul',             'TOCINO AZUL',                   'panza-pecho',     'otros',    'piezas', 6),
  ('sancocho',                'SANCOCHO',                      'panza-pecho',     'otros',    'kg',     7),
  ('prensa-molida',           'PRENSA MOLIDA',                 'panza-pecho',     'otros',    'kg',     8),

  -- costillar-hueso
  ('hueso-americano',         'HUESO AMERICANO',               'costillar-hueso', 'huesos',   'kg',     1),
  ('espinazo',                'ESPINAZO',                      'costillar-hueso', 'huesos',   'kg',     2),
  ('costillar',               'COSTILLAR',                     'costillar-hueso', 'huesos',   'piezas', 3),
  ('codillo',                 'CODILLO',                       'costillar-hueso', 'huesos',   'piezas', 4),
  ('canas',                   'CAÑA',                          'costillar-hueso', 'huesos',   'kg',     5),
  ('manos',                   'MANOS',                         'costillar-hueso', 'huesos',   'piezas', 6),
  ('patas',                   'PATAS',                         'costillar-hueso', 'huesos',   'piezas', 7),

  -- cabeza-cachete
  ('cabeza',                  'CABEZA',                        'cabeza-cachete',  'otros',    'piezas', 1),
  ('cachete',                 'CACHETE',                       'cabeza-cachete',  'otros',    'piezas', 2),
  ('mascara',                 'MASCARA',                       'cabeza-cachete',  'otros',    'piezas', 3),
  ('mascara-completa',        'MASCARA COMPLETA',              'cabeza-cachete',  'otros',    'piezas', 4),
  ('mascara-recorte',         'RECORTE DE MASCARA',            'cabeza-cachete',  'otros',    'piezas', 5),
  ('papada',                  'PAPADA',                        'cabeza-cachete',  'otros',    'piezas', 6),
  ('orejas',                  'OREJAS',                        'cabeza-cachete',  'otros',    'piezas', 7),
  ('trompa',                  'TROMPA',                        'cabeza-cachete',  'otros',    'piezas', 8),
  ('lengua',                  'LENGUA',                        'cabeza-cachete',  'visceras', 'piezas', 9),
  ('sesos',                   'SESOS',                         'cabeza-cachete',  'visceras', 'piezas', 10),
  ('nana',                    'NANA',                          'cabeza-cachete',  'visceras', 'piezas', 11),
  ('buche',                   'BUCHE',                         'cabeza-cachete',  'visceras', 'piezas', 12),
  ('rinon',                   'RIÑON',                         'cabeza-cachete',  'visceras', 'piezas', 13),
  ('tripas',                  'TRIPAS',                        'cabeza-cachete',  'visceras', 'kg',     14),

  -- cuero
  ('cuero',                   'CUERO',                         'cuero',           'cueros',   'kg',     1),
  ('cuero-recorte',           'CUERO RECORTE',                 'cuero',           'cueros',   'kg',     2),
  ('cuero-cuadrado',          'CUERO CUADRADO',                'cuero',           'cueros',   'kg',     3),
  ('cueros-c-panza',          'CUEROS C/PANZA',                'cuero',           'cueros',   'kg',     4),
  ('cueros-s-panza',          'CUEROS S/PANZA',                'cuero',           'cueros',   'kg',     5),

  -- pulpa-retazo
  ('pulpa',                   'PULPA',                         'pulpa-retazo',    'pulpas',   'kg',     1),
  ('pulpa-cg',                'PULPA C/G',                     'pulpa-retazo',    'pulpas',   'kg',     2),
  ('pulpa-espaldilla',        'PULPA DE ESPALDILLA',           'pulpa-retazo',    'pulpas',   'kg',     3),
  ('pulpa-jamon',             'PULPA DE JAMON',                'pulpa-retazo',    'pulpas',   'kg',     4),
  ('retazo',                  'RETAZO',                        'pulpa-retazo',    'pulpas',   'kg',     5),
  ('prensa-natural',          'PRENSA NATURAL',                'pulpa-retazo',    'otros',    'kg',     6),

  -- grasa-manteca
  ('manteca',                 'MANTECA',                       'grasa-manteca',   'otros',    'kg',     1),
  ('grasa',                   'GRASA',                         'grasa-manteca',   'otros',    'kg',     2),
  ('lardo',                   'LARDO',                         'grasa-manteca',   'otros',    'kg',     3),
  ('capote',                  'CAPOTE',                        'grasa-manteca',   'otros',    'kg',     4),
  ('corbatas',                'CORBATA',                       'grasa-manteca',   'otros',    'kg',     5),
  ('desgrase',                'DESGRASE',                      'grasa-manteca',   'otros',    'kg',     6),

  -- rabos
  ('ahumada',                 'AHUMADA',                       'rabos',           'otros',    'piezas', 1),
  ('rabos-carnudos',          'RABOS CARNUDOS',                'rabos',           'otros',    'piezas', 2),
  ('rabos-pelones',           'RABOS PELONES',                 'rabos',           'otros',    'piezas', 3)
on conflict (id) do update set
  name = excluded.name,
  region_id = excluded.region_id,
  category = excluded.category,
  default_unit = excluded.default_unit,
  sort_order = excluded.sort_order,
  updated_at = now();

-- ──────────────────────────────────────────────────────────────────────
-- Sinónimos iniciales (espejo de src/data/synonyms.ts)
-- ──────────────────────────────────────────────────────────────────────
insert into public.product_synonyms (product_id, term) values
  -- chuletas / lomos
  ('lomo',                       'chuleta'),
  ('costillar',                  'chuleta'),
  ('lomo-usa',                   'chuleta'),
  ('ahumada',                    'chuleta ahumada'),
  ('lomo',                       'chuleton'),
  ('lomo-completo-americano',    'chuleton'),
  ('lomo-usa',                   'chuleton'),
  ('ahumada',                    'lomo ahumado'),
  -- chicharrón / pancita
  ('barriga',                    'chicharron'),
  ('barriga-cc',                 'chicharron'),
  ('tocino',                     'chicharron'),
  ('tocino-azul',                'chicharron'),
  ('barriga',                    'chicharron de cerdo'),
  ('barriga-cc',                 'chicharron de cerdo'),
  ('cuero',                      'chicharron de cerdo'),
  ('barriga',                    'pancita'),
  ('barriga-cc',                 'pancita'),
  ('barriga',                    'panza'),
  ('barriga-cc',                 'panza'),
  ('cueros-c-panza',             'panza'),
  ('cueros-s-panza',             'panza'),
  -- molida
  ('prensa-natural',             'molida'),
  ('prensa-molida',              'molida'),
  ('prensa-natural',             'carne molida'),
  ('prensa-molida',              'carne molida'),
  ('prensa-natural',             'carne picada'),
  ('prensa-molida',              'carne picada'),
  ('prensa-natural',             'hamburguesa'),
  ('prensa-molida',              'hamburguesa'),
  -- tamal
  ('cuero',                      'tamal'),
  ('cuero-recorte',              'tamal'),
  ('cuero-cuadrado',             'tamal'),
  ('cuero',                      'tamalon'),
  ('cuero-recorte',              'tamalon'),
  -- cabeza / cachete
  ('cabeza',                     'cabeza'),
  ('cachete',                    'cabeza'),
  ('mascara',                    'cabeza'),
  ('mascara-completa',           'cabeza'),
  ('sesos',                      'cabeza'),
  ('lengua',                     'cabeza'),
  ('papada',                     'cabeza'),
  ('orejas',                     'cabeza'),
  ('trompa',                     'cabeza'),
  ('sesos',                      'sesos'),
  ('cachete',                    'cachete'),
  ('cabeza',                     'cachete'),
  ('trompa',                     'trompa'),
  ('cabeza',                     'trompa'),
  ('mascara',                    'mascara'),
  ('mascara-completa',           'mascara'),
  ('mascara-recorte',            'mascara'),
  -- manos / patas
  ('manos',                      'manita'),
  ('patas',                      'manita'),
  ('patas',                      'patitas'),
  ('manos',                      'patitas'),
  -- hueso
  ('hueso-americano',            'hueso'),
  ('espinazo',                   'hueso'),
  ('codillo',                    'hueso'),
  ('canas',                      'hueso'),
  ('hueso-americano',            'hueso para caldo'),
  ('espinazo',                   'hueso para caldo'),
  ('codillo',                    'hueso para caldo'),
  ('canas',                      'hueso para caldo'),
  ('hueso-americano',            'caldo'),
  ('espinazo',                   'caldo'),
  ('codillo',                    'caldo'),
  ('canas',                      'caldo'),
  -- manteca
  ('manteca',                    'manteca'),
  ('grasa',                      'manteca'),
  ('lardo',                      'manteca'),
  ('grasa',                      'grasa'),
  ('manteca',                    'grasa'),
  ('lardo',                      'grasa'),
  ('capote',                     'grasa'),
  -- longaniza / chorizo
  ('tripas',                     'longaniza'),
  ('tripas',                     'chorizo'),
  ('tripas',                     'tripa'),
  -- cola / rabo
  ('rabos-carnudos',             'cola'),
  ('rabos-pelones',              'cola'),
  ('ahumada',                    'cola'),
  ('rabos-carnudos',             'rabo'),
  ('rabos-pelones',              'rabo'),
  ('rabos-carnudos',             'rabos'),
  ('rabos-pelones',              'rabos')
on conflict (product_id, term) do nothing;
