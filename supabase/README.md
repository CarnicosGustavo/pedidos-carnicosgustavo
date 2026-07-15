# Supabase · Migraciones y seed

## Cómo aplicar la migración inicial

1. **Dashboard de Supabase** → proyecto `carnicosgustavo` → `SQL Editor` → `New query`.
2. Pega el contenido de [`migrations/0001_catalog_v2.sql`](./migrations/0001_catalog_v2.sql) y corre.
3. `New query` → pega el contenido de [`seed.sql`](../seed.sql) y corre.

Verifica que las tablas existen:

```sql
select count(*) from public.regions;          -- 10
select count(*) from public.products;         -- 69
select count(*) from public.product_synonyms; -- ~50
```

## Storage

Para habilitar subida de fotos:

1. `Storage` → `New bucket` → nombre `products` → marcar **Public bucket**.
2. Listo. El endpoint `/api/admin/upload` usa este bucket.

## RLS

Las policies creadas son:

- `public read regions`   — solo lectura si `is_active = true`
- `public read products`  — solo lectura si `is_active = true`
- `public read synonyms`  — solo lectura
- `public read frequent`  — solo lectura

No hay policies de `insert/update/delete` en ninguna tabla: las escrituras
las hace el service role desde `/api/admin/*` con header `x-admin-token`.

## RPC

`frequent_products_aggregate(limit_n int)` agrega los items de los últimos
90 días desde `web_orders` (configurable via `app.orders_table`) y refresca
la tabla `frequent_products`. Se invoca:

- En background después de cada `POST /api/orders`.
- En `GET /api/frequent?limit=N` cuando la cache de 1h expira.

Para probarla manualmente:

```sql
select * from frequent_products_aggregate(20);
```
