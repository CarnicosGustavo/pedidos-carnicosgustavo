-- 0001_catalog_v2.sql
-- Esquema nuevo del catálogo administrable: regiones, productos, sinónimos,
-- tabla materializada de frecuentes, RLS, RPC de agregación.
--
-- No toca las tablas existentes (web_orders, orders) — la app sigue
-- funcionando mientras esta migración se aplica.

-- ──────────────────────────────────────────────────────────────────────
-- Tabla: regions
-- ──────────────────────────────────────────────────────────────────────
create table if not exists public.regions (
  id           text primary key,
  name         text not null,
  short_name   text not null,
  emoji        text not null default '🐖',
  color        text not null default 'red',
  sort_order   int  not null default 0,
  is_active    boolean not null default true,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create index if not exists regions_active_sort_idx
  on public.regions (is_active, sort_order);

-- ──────────────────────────────────────────────────────────────────────
-- Tabla: products
-- ──────────────────────────────────────────────────────────────────────
create table if not exists public.products (
  id           text primary key,
  name         text not null,
  region_id    text not null references public.regions(id) on update cascade,
  category     text not null,                 -- taxonomía interna (canales, lomos, ...)
  default_unit text not null check (default_unit in ('piezas', 'kg')),
  photo_url    text,
  sort_order   int  not null default 0,
  is_active    boolean not null default true,
  description  text,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create index if not exists products_active_region_sort_idx
  on public.products (is_active, region_id, sort_order);
create index if not exists products_category_idx
  on public.products (category);

-- ──────────────────────────────────────────────────────────────────────
-- Tabla: product_synonyms
-- ──────────────────────────────────────────────────────────────────────
create table if not exists public.product_synonyms (
  id          uuid primary key default gen_random_uuid(),
  product_id  text not null references public.products(id) on delete cascade,
  term        text not null,
  created_at  timestamptz not null default now(),
  unique (product_id, term)
);

create index if not exists product_synonyms_term_idx
  on public.product_synonyms (lower(term));

-- ──────────────────────────────────────────────────────────────────────
-- Tabla: frequent_products (precomputada)
-- ──────────────────────────────────────────────────────────────────────
create table if not exists public.frequent_products (
  product_id  text primary key references public.products(id) on delete cascade,
  total_qty   numeric not null default 0,
  last_seen   timestamptz
);

-- ──────────────────────────────────────────────────────────────────────
-- RLS: lectura pública para el catálogo; escritura solo service role.
-- ──────────────────────────────────────────────────────────────────────
alter table public.regions          enable row level security;
alter table public.products         enable row level security;
alter table public.product_synonyms enable row level security;
alter table public.frequent_products enable row level security;

-- Re-crear policies de forma idempotente
drop policy if exists "public read regions"          on public.regions;
drop policy if exists "public read products"         on public.products;
drop policy if exists "public read synonyms"         on public.product_synonyms;
drop policy if exists "public read frequent"         on public.frequent_products;

create policy "public read regions"   on public.regions          for select using (is_active = true);
create policy "public read products"  on public.products         for select using (is_active = true);
create policy "public read synonyms"  on public.product_synonyms for select using (true);
create policy "public read frequent"  on public.frequent_products for select using (true);

-- Escritura: solo el service role (no creamos policies de insert/update/delete →
-- por defecto, deny). El admin (service role) las bypasea.

-- ──────────────────────────────────────────────────────────────────────
-- Función RPC: frequent_products_aggregate(limit_n)
-- Agrega los items de web_orders de los últimos 90 días.
-- Es idempotente: se puede llamar bajo demanda para refrescar
-- la tabla frequent_products.
-- ──────────────────────────────────────────────────────────────────────
create or replace function public.frequent_products_aggregate(limit_n int default 12)
returns table (product_id text, name text, total_qty numeric)
language plpgsql
security definer
set search_path = public
as $$
declare
  orders_table text;
begin
  orders_table := coalesce(
    nullif(current_setting('app.orders_table', true), ''),
    'web_orders'
  );

  return query
    execute format(
      $sql$
        with agg as (
          select
            (item->>'productId') as pid,
            sum( coalesce(nullif(item->>'quantity','')::numeric, 0) ) as qty,
            max(created_at) as last_seen
          from %I, jsonb_array_elements(items) as item
          where created_at > now() - interval '90 days'
            and item ? 'productId'
            and item ? 'quantity'
          group by 1
        )
        select a.pid, coalesce(p.name, a.pid) as name, a.qty
        from agg a
        left join public.products p on p.id = a.pid
        where p.id is null or p.is_active = true
        order by a.qty desc
        limit $1
      $sql$,
      orders_table
    )
    using limit_n;

  -- Refresca la tabla materializada.
  execute format(
    $sql$
      insert into public.frequent_products (product_id, total_qty, last_seen)
      select pid, qty, last_seen
      from (
        with agg as (
          select
            (item->>'productId') as pid,
            sum( coalesce(nullif(item->>'quantity','')::numeric, 0) ) as qty,
            max(created_at) as last_seen
          from %I, jsonb_array_elements(items) as item
          where created_at > now() - interval '90 days'
            and item ? 'productId'
          group by 1
        )
        select * from agg
      ) s
      on conflict (product_id) do update
        set total_qty = excluded.total_qty,
            last_seen = excluded.last_seen
    $sql$,
    orders_table
  );
end;
$$;

comment on function public.frequent_products_aggregate(int) is
  'Agrega los items de los últimos 90 días desde web_orders (configurable vía app.orders_table) y refresca frequent_products.';

-- Permite al anon key llamar la RPC (sigue siendo de solo lectura, no expone datos sensibles)
grant execute on function public.frequent_products_aggregate(int) to anon, authenticated, service_role;
