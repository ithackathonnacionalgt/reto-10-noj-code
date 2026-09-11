# Verificación del proyecto

Guía para levantar el proyecto y verificar que todo funciona, antes de cada
commit importante y antes de desplegar.

---

## 1. Puertos (convención)

| App | Puerto | URL |
|---|---|---|
| API (backend NestJS) | **3001** | http://localhost:3001/api/v1 |
| Frontend (Next.js) | **3000** | http://localhost:3000 |

- `backend/.env` → `PORT=3001`, `CORS_ORIGINS=http://localhost:3000`
- `frontend/.env.local` → `NEXT_PUBLIC_API_URL=http://localhost:3001/api/v1`

---

## 2. Levantar en local

```bash
# Terminal 1 — API
cd backend
npm install
npm run start:dev          # queda escuchando en :3001

# Terminal 2 — Frontend
cd frontend
npm install
npm run dev                # queda escuchando en :3000
```

Abrir http://localhost:3000/tramites

---

## 3. Verificación rápida (automática)

Con la API corriendo:

```bash
./scripts/smoke.sh
# o contra un deploy:
./scripts/smoke.sh https://reto10-api.onrender.com/api/v1
```

Debe terminar con `TODO OK (33 checks)` y código de salida 0.
Cubre: health, listado y búsqueda de trámites (full-text + trigram), filtros,
validación (400/404), catálogos, auth (login, perfil, RBAC 401/200) y **API keys**
(crear, listar sin exponer el hash, usar con `X-API-Key`, headers de rate limit,
`/api-keys/uso`, key inválida/revocada → 401, anónimo sigue funcionando).

---

## 4. Verificación manual de la API

```bash
B=http://localhost:3001/api/v1

curl -s $B/health
curl -s "$B/procedures" | jq                       # { data:[...], meta:{...} }
curl -s "$B/procedures?q=licencia" | jq '.meta'    # full-text
curl -s "$B/procedures?q=empres"   | jq '.meta'    # trigram (parcial)
curl -s "$B/procedures?disponibleEnLinea=true&orden=nombre" | jq '.meta'
curl -s "$B/procedures/<slug-o-publicId>" | jq     # detalle
curl -s "$B/institutions" | jq '.meta.total'       # 6
curl -s "$B/categories"   | jq '.meta.total'       # 10
curl -s "$B/departments"  | jq 'length'            # 22

# Errores esperados
curl -s -o /dev/null -w '%{http_code}\n' "$B/procedures?institucionId=abc"   # 400
curl -s -o /dev/null -w '%{http_code}\n' "$B/procedures/no-existe"           # 404

# Auth
TOK=$(curl -s -X POST $B/auth/login -H 'Content-Type: application/json' \
  -d '{"email":"admin@tramites.gob.gt","password":"CambiaEstaClave123!"}' | jq -r .data.accessToken)
curl -s $B/auth/perfil -H "Authorization: Bearer $TOK" | jq
curl -s -o /dev/null -w '%{http_code}\n' $B/admin/procedures                 # 401
curl -s -o /dev/null -w '%{http_code}\n' $B/admin/procedures -H "Authorization: Bearer $TOK"  # 200
```

**Forma del item de listado** (`data[i]`): `id, publicId, slug, codigo, nombre,
descripcionCorta, estado, modoEjecucion, modalidad, disponibleEnLinea, tipoCosto,
costo, moneda, tiempoRespuesta{valor,unidad,texto}, calidadDatos, urlExterna,
urlFuenteOficial, institucion{...}, categorias[...], publicadoEn, actualizadoEn`.

---

## 5. Verificación del frontend

- http://localhost:3000/tramites → muestra tarjetas con datos reales.
- Buscar en la barra → la URL cambia a `?q=...` y los resultados se filtran.
- Cambiar filtros del panel → la URL acumula `?institucionId=...&modalidad=...`.
- Un trámite con `urlExterna` muestra el botón **"Ir al trámite ↗"**.
- Probar `http://localhost:3000/tramites?institucionId=basura` → **NO** debe
  mostrar el panel de error; ignora el filtro inválido y sigue listando.

---

## 6. Antes de commitear

```bash
cd backend  && npm run build && npm run lint && npm test
cd ../frontend && npm run build && npm run lint
./scripts/smoke.sh
```

Todo debe pasar.

---

## 7. Base de datos (Supabase)

- Proveedor: Supabase PostgreSQL. Conexión por **Session pooler** (`...pooler.supabase.com:5432`).
  **NO** usar el puerto 6543 (transaction pooler) → rompe las migraciones de TypeORM.
- Verificar migraciones aplicadas:
  ```bash
  cd backend && npm run migration:show      # ambas deben salir con [X]
  ```
- Migraciones: `EsquemaInicial` (48 tablas) y `BusquedaEIndices` (pg_trgm + índices
  de búsqueda + columna generada `busqueda_tsv`). Esta última tiene timestamp alto
  a propósito para correr siempre al final.
- Re-sembrar datos base (idempotente): `npm run seed`.
- Catálogo real (1303 trámites, 15 dic 2023): `node src/database/seed/enriquecer-catalogo.mjs`
  (descarga las páginas oficiales) y luego `npm run import:catalogo`. Detalle en
  `docs/CATALOGO-2023.md`. Esperado en BD: ~1131 `completo`, ~172 sin pasos completos.

---

## 8. Despliegue en Render

Ver `render.yaml` en la raíz. Resumen:

1. `git push` con `render.yaml` incluido.
2. Render → New + → **Blueprint** → elegir el repo.
3. Cargar las variables `sync: false` de `reto10-api`:
   `DB_HOST`, `DB_USER`, `DB_PASSWORD` (del Session pooler de Supabase).
   `DB_PORT=5432`, `DB_NAME=postgres`, `DB_SSL=true`, `JWT_SECRET`/`API_KEY_PEPPER`
   se autogeneran.
4. Primer deploy. Anotar las URLs `*.onrender.com`.
5. Completar las 2 URLs cruzadas y redeployar:
   - `reto10-api` → `CORS_ORIGINS = https://reto10-web.onrender.com`
   - `reto10-web` → `NEXT_PUBLIC_API_URL = https://reto10-api.onrender.com/api/v1`
     (⚠️ redeploy con **Clear build cache**: las `NEXT_PUBLIC_*` se hornean en el build)
6. Verificar: `./scripts/smoke.sh https://reto10-api.onrender.com/api/v1`

### Notas Render
- Plan free: los servicios **duermen tras ~15 min** sin tráfico (cold start ~30-50s).
- El `startCommand` del backend corre `migration:run:prod` antes de arrancar
  (idempotente: si no hay migraciones nuevas, no hace nada).
- Build usa `--include=dev` porque Render pone `NODE_ENV=production` y si no,
  `npm install` omite `@nestjs/cli` (backend) y `typescript`/`eslint` (frontend).

---

## 9. Gotchas conocidos

- **Proceso viejo escuchando el puerto.** Si cambiás código y no se refleja, o si
  los POST dan 500 raros de `iconv-lite`, hay un `node dist/main` / `nest start`
  viejo (posiblemente de antes de mover la carpeta) ocupando :3001. Matarlo:
  ```bash
  lsof -tiTCP:3001 -sTCP:LISTEN | xargs kill -9
  ```
  y volver a arrancar. `pkill -f 'dist/main'` a veces no lo agarra si el path cambió.
- **`NEXT_PUBLIC_*` se hornea en build.** Cambiar `NEXT_PUBLIC_API_URL` exige
  rebuild del frontend (local: reiniciar `npm run dev`; Render: redeploy con clear cache).
- **CORS solo afecta llamadas del navegador.** La página `/tramites` hace fetch
  desde el server (Server Component), así que funciona aunque `CORS_ORIGINS` esté mal.
  El login (client-side) sí necesita `CORS_ORIGINS` correcto.

---

## 9.b API para desarrolladores

Ver **`docs/API-PUBLICA.md`** (documentación completa para publicar en una página).
Flujo: `POST /auth/registro` → `POST /auth/login` → `POST /api-keys` (con JWT) →
usar `X-API-Key` en las llamadas. Scopes en `GET /api-keys/scopes`.

Verificar a mano:
```bash
TOK=$(curl -s -X POST $B/auth/login -H 'Content-Type: application/json' \
  -d '{"email":"admin@tramites.gob.gt","password":"CambiaEstaClave123!"}' | jq -r .data.accessToken)
K=$(curl -s -X POST $B/api-keys -H "Authorization: Bearer $TOK" -H 'Content-Type: application/json' \
  -d '{"nombre":"prueba"}' | jq -r .data.llaveCompleta)
curl -s -D - -o /dev/null $B/procedures -H "X-API-Key: $K" | grep -i x-ratelimit
curl -s $B/api-keys/uso -H "X-API-Key: $K" | jq
```

---

## 10. Limitaciones conocidas (deuda técnica, no bugs)

- **Rotación de refresh token** no es transaccional: dos requests de refresh
  idénticos y simultáneos podrían generar 2 tokens válidos. La detección de reuso
  (token ya revocado → mata la sesión) sí funciona.
- **Snapshot de versión** al publicar un trámite se escribe fuera de la transacción
  del cambio de estado.
- **Sin rate limiting** (`@nestjs/throttler` aún no soporta NestJS 12).
- **Búsqueda sin `unaccent`**: es case-insensitive con `lower()` pero no ignora
  tildes. El proyecto usa texto sin tildes, así que en la práctica no molesta.
- **`/institutions` y `/categories` públicos** devuelven algunos campos internos
  (`creadoPor`, `fechaCreacion`…). No expone secretos; conviene un mapper público.
- **`page` sin tope**: `?page=9999` devuelve lista vacía (no error).
- **Rate limiter de API keys en memoria** (fixed window): no se comparte entre
  instancias (OK con 1 instancia en Render Free) y el `Map` no se purga.
- **Validación de API key = 1 query por petición con key** (lookup por hash). Sin
  caché por ahora.
- **Petición anónima sin límite de tasa.** Solo se limita cuando hay `X-API-Key`.
