# CLAUDE.md — Cárnicos Gustavo · App de Pedidos

Guía para trabajar en este repositorio. App web de pedidos para el CEDIS de
Cárnicos Gustavo: el cliente arma su pedido y se envía al CEDIS (se guarda en
Supabase y se confirma por WhatsApp).

## Estado actual

Rama principal de desarrollo: **`feature/catalog-v2`** (rediseño de catálogo:
navegación por regiones, búsqueda con sinónimos, admin, frecuentes).

La rama `main` sigue siendo la versión de producción hasta que se fusione.

## Stack

- **Vite 5** + **React 19** + **TypeScript** + **Tailwind 3**.
- Funciones serverless de **Vercel** en `api/` (runtime Node).
- **Supabase** (Postgres + Storage). Deploy en **Vercel** (rama `main` → producción `app.carnicosgustavo.com`).

## Estructura

- `src/main.tsx` — punto de entrada; decide entre `App` (tienda) y `AdminApp` (admin).
- `src/App.tsx` — UI de la tienda: bienvenida, navegación por regiones, búsqueda, carrito, éxito.
- `src/admin/AdminApp.tsx` — panel `/admin` (CRUD productos, regiones, sinónimos).
- `src/components/` — `RegionGrid`, `RegionView`, `ProductRow`, `SearchBar`, `Welcome`, `CartSheet`, `Logo`, `QtyInput`.
- `src/data/` — `products.ts` (catálogo), `regions.ts` (10 regiones), `synonyms.ts` (búsqueda tolerante).
- `src/lib/` — `supabase.ts` (cliente), `catalog.ts` (carga con fallback), `recognition.ts`, `whatsapp.ts`.
- `api/orders.ts` — crea pedido en `web_orders` y refresca frecuentes en background.
- `api/last-order.ts` — último pedido del cliente (reconocimiento).
- `api/frequent.ts` — productos más pedidos.
- `api/admin/{products,regions,synonyms,upload}.ts` — CRUD con service role y `x-admin-token`.
- `supabase/migrations/0001_catalog_v2.sql` — esquema de catálogo + RPC.
- `supabase/seed.sql` — 10 regiones + 69 productos + sinónimos base.

## Flujo de un pedido

1. Cliente entra con WhatsApp (o `?phone=` lo prellena) → lookup de cliente reconocido.
2. Pantalla "Haz tu pedido" → grid de regiones o "Frecuentes" o búsqueda con sinónimos.
3. Toca región → subvista con productos de esa región → "+ Agregar" (o +/- si ya está).
4. Búsqueda con sinónimos: "chuleta ahumada" → "AHUMADA", "pancita" → "BARRIGA", "molida" → "PRENSA NATURAL".
5. FAB "Ver pedido" → CartSheet con items + form de contacto (Contacto / WhatsApp obligatorios, Negocio y CP opcionales).
6. "Enviar por WhatsApp" → `POST /api/orders` → trigger crea fila en `orders` → abre `wa.me/...` con el pedido.

## Variables de entorno (Vercel → Settings → Environment Variables)

| Variable | Tipo | Descripción |
|---|---|---|
| `VITE_WHATSAPP_PHONE` | client | Número del CEDIS E.164. Fallback `525543287020` |
| `VITE_LOCATION_LABEL` | client | Etiqueta de ubicación. Fallback `Naucalpan, Estado de México` |
| `VITE_SUPABASE_URL` | client | URL del proyecto Supabase |
| `VITE_SUPABASE_ANON_KEY` | client | Anon key (lectura pública) |
| `VITE_ADMIN_PASSWORD` | client | Password para entrar a `/admin` |
| `SUPABASE_URL` | server | Igual a VITE_SUPABASE_URL |
| `SUPABASE_SERVICE_ROLE_KEY` | server | Service role. **Nunca** exponer al cliente |
| `SUPABASE_ORDERS_TABLE` | server | Por defecto `web_orders` |
| `ADMIN_TOKEN` | server | Debe coincidir con `VITE_ADMIN_PASSWORD` |
| `SUPABASE_PRODUCTS_BUCKET` | server | Por defecto `products` |

> Tras cambiar variables en Vercel, hay que **Redeploy** para que tomen efecto.

## Supabase

- Tabla `web_orders`: source, business_name, contact_name, phone, delivery_address, notes, location_label, items (jsonb), items_count, user_agent, whatsapp_message.
- Tabla `orders`: un trigger crea la orden del dashboard ligada por `web_order_id`.
- Tabla `regions` (catálogo v2): 10 regiones anatómicas.
- Tabla `products` (catálogo v2): 69 productos con `region_id`, `default_unit`, `photo_url`, `sort_order`, `is_active`.
- Tabla `product_synonyms` (catálogo v2): términos coloquiales → product_id.
- Tabla `frequent_products` (catálogo v2): agregación precomputada para `/api/frequent`.
- RLS: lectura pública, escritura solo service role.

## Diseño (Cálida v2)

- Fuentes: **Anton** (display), **Archivo** (UI), **JetBrains Mono** (cantidades).
- Acentos: rojo ladrillo (`#9E3326` claro / `#DA5742` oscuro), verde WhatsApp `#25D366`,
  verde tinta `#21302A` (botón "Empezar pedido" y campos válidos).
- **Modo claro/oscuro automático** según `prefers-color-scheme` (en vivo).
- Íconos con `lucide-react`.
- **Navegación**: grid de regiones con emoji + color; subvista con breadcrumb.
- **Búsqueda tolerante** con sinónimos (acentos, parcial, multi-palabra).

## Comandos

```bash
npm install
npm run dev      # Vite puerto 5174
npm run build    # tsc -b && vite build (debe pasar antes de subir)
npm run preview
```

## Deploy

- Push a `main` → Vercel despliega automáticamente a `app.carnicosgustavo.com`.
- Push a `feature/catalog-v2` → preview URL de Vercel (para validar antes de promover).
- Verifica siempre `npm run build` localmente antes de hacer push.

## Convenciones

- TypeScript estricto en todo `src/` y `api/`.
- El admin usa el **anon key** para login (validación de password) y el
  **service role** (via `/api/admin/*`) para escritura. Header `x-admin-token`.
- El frontend NUNCA escribe directo a Supabase — siempre vía `/api/admin/*`.
- Si la migración no se ha aplicado, la app sigue funcionando con el
  fallback local (`src/data/*`) y los endpoints devuelven respuestas
  vacías o fail-soft.
