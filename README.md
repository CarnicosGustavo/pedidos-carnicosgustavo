# Cárnicos Gustavo · App de Pedidos

App web para que clientes del CEDIS (carnicerías, revendedores, restaurantes, hoteles) armen su pedido desde el celular o el escritorio. El pedido se guarda en Supabase y se envía al CEDIS por WhatsApp.

Rama de desarrollo: **`feature/catalog-v2`** (catálogo rediseñado: navegación por regiones, búsqueda con sinónimos, panel de administración, productos frecuentes automáticos).

---

## Stack

- **Vite 5** + **React 19** + **TypeScript** + **Tailwind 3**
- Funciones serverless en **Vercel** (`api/`, runtime Node)
- **Supabase** (Postgres + Storage)
- Deploy: Vercel, rama `main` → `app.carnicosgustavo.com`

## Estructura

```
api/
  orders.ts            POST   crea pedido en web_orders
  last-order.ts        GET    último pedido del cliente (reconocimiento)
  frequent.ts          GET    productos más pedidos (últimos 90 días)
  admin/
    products.ts        CRUD   productos (service role)
    regions.ts         CRUD   regiones
    synonyms.ts        CRUD   sinónimos de búsqueda
    upload.ts          POST   sube foto a Supabase Storage

src/
  data/
    products.ts        69 productos (id, name, regionId, defaultUnit, sortOrder)
    regions.ts         10 regiones anatómicas
    synonyms.ts        diccionario de búsqueda tolerante
  lib/
    supabase.ts        cliente anon-key con guard de env
    catalog.ts         carga catálogo (Supabase → fallback local) con cache 5 min
    recognition.ts     lookup de cliente por WhatsApp
  components/
    Welcome.tsx        pantalla de bienvenida (?phone= prefill)
    RegionGrid.tsx     grid de regiones (nivel 1)
    RegionView.tsx     subvista de una región (nivel 2)
    ProductRow.tsx     tarjeta de producto con foto/glifo
    CartSheet.tsx      hoja inferior del pedido
    SearchBar.tsx      buscador
  admin/
    AdminApp.tsx       CRUD admin en /admin (password-gated)
  App.tsx              navegación principal

supabase/
  migrations/
    0001_catalog_v2.sql   tablas + RLS + RPC frequent_products_aggregate
  seed.sql                  10 regiones + 69 productos + sinónimos base
  README.md                 cómo aplicar migración y seed
```

## Comandos

```bash
npm install
npm run dev      # puerto 5174
npm run build    # tsc -b && vite build
npm run preview
```

## Variables de entorno

Vercel → Settings → Environment Variables (rama `main` y `feature/catalog-v2`):

| Variable | Server | Client | Descripción |
|---|:---:|:---:|---|
| `VITE_WHATSAPP_PHONE` |  | ✅ | Número del CEDIS E.164 |
| `VITE_LOCATION_LABEL` |  | ✅ | Etiqueta de ubicación |
| `VITE_SUPABASE_URL` |  | ✅ | URL del proyecto Supabase |
| `VITE_SUPABASE_ANON_KEY` |  | ✅ | Anon key (lectura pública) |
| `VITE_ADMIN_PASSWORD` |  | ✅ | Password para entrar a /admin |
| `SUPABASE_URL` | ✅ |  | Mismo que VITE_SUPABASE_URL |
| `SUPABASE_SERVICE_ROLE_KEY` | ✅ |  | Service role (no exponer al cliente) |
| `SUPABASE_ORDERS_TABLE` | ✅ |  | Por defecto `web_orders` |
| `ADMIN_TOKEN` | ✅ |  | Token para /api/admin/* (igual al VITE_ADMIN_PASSWORD) |
| `SUPABASE_PRODUCTS_BUCKET` | ✅ |  | Por defecto `products` (debe existir y ser público) |

Tras cambiar variables: **Redeploy** en Vercel.

## URLs

- `https://app.carnicosgustavo.com/` — Tienda
- `https://app.carnicosgustavo.com/?phone=525543287020` — Con WhatsApp prellenado
- `https://app.carnicosgustavo.com/admin` — Panel de administración

## Operación

### Agregar / editar un producto
1. Entrar a `/admin` con la password.
2. Tab "Productos" → editar inline → "Guardar".
3. La app se actualiza al recargar (cache 5 min en localStorage).

### Subir una foto
1. En `/admin`, tab "Productos" → columna foto (próxima iteración: input file).
2. Mientras tanto, subir vía SQL editor o API:
   ```bash
   curl -X POST https://app.carnicosgustavo.com/api/admin/upload \
     -H "x-admin-token: $ADMIN_TOKEN" \
     -H "Content-Type: application/json" \
     -d '{"productId":"lomo","imageBase64":"<base64>","ext":"webp"}'
   ```
3. La URL devuelta se pega en la columna `photo_url` de `products`.

### Agregar un sinónimo
1. `/admin` → tab "Sinónimos" → seleccionar producto → escribir término → "Agregar".
2. También directo en SQL: `insert into product_synonyms (product_id, term) values (...)`.

## Deploy

```bash
git push origin feature/catalog-v2   # Vercel crea preview URL automática
# Validar en preview
gh pr create --base main              # PR a main (cuando esté validado)
git push origin main                  # Despliegue a producción
```

## Convenciones

- `src/cgapp.tsx` (mencionado en CLAUDE.md antiguo) **ya no existe**; la UI activa vive en `src/App.tsx` + `src/components/`.
- Nunca exponer `SUPABASE_SERVICE_ROLE_KEY` al cliente. Solo `api/`.
- El token `ADMIN_TOKEN` debe ser igual a `VITE_ADMIN_PASSWORD` (la UI lo manda como `x-admin-token`).
