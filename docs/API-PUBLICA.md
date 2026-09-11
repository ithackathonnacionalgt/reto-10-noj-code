# API de la Plataforma Nacional de Trámites

Documentación para desarrolladores. Esta API permite consultar el catálogo
nacional de trámites del Estado de Guatemala (instituciones, categorías,
trámites, requisitos, pasos, ubicaciones) desde cualquier aplicación.

- **Estado:** beta. Los contratos pueden cambiar; se avisará en el changelog.
- **Formato:** JSON en todas las respuestas.
- **Zona horaria:** todas las fechas son UTC en formato ISO 8601.

---

## 1. URL base

```
https://<tu-dominio>/api/v1
```

En desarrollo local: `http://localhost:3001/api/v1`

La versión va en la ruta (`/api/v1`). Una nueva versión mayor se publicará como
`/api/v2` sin romper `/api/v1`.

---

## 2. Autenticación

### 2.1 Endpoints abiertos (sin credenciales)

Todo el **catálogo público** se puede leer sin API key:

```
GET /api/v1/procedures
GET /api/v1/procedures/{slug}
GET /api/v1/institutions
GET /api/v1/categories
GET /api/v1/departments
```

Enviar una API key es **opcional** en estos endpoints. Si la envías, se aplica
tu límite de tasa y podés usar tus scopes; si no, la petición es anónima.

### 2.2 Obtener una API key

Recomendado para producción: identifica tu aplicación, te da un límite de tasa
propio y podés revocarla si se filtra.

**Paso 1 — Crear una cuenta de desarrollador**

```bash
curl -X POST https://<dominio>/api/v1/auth/registro \
  -H 'Content-Type: application/json' \
  -d '{
    "email": "dev@ejemplo.com",
    "password": "una-clave-segura",
    "nombres": "Nombre",
    "apellidos": "Apellido"
  }'
```

Devuelve un `accessToken` (JWT, dura 15 min) y un `refreshToken`.

**Paso 2 — Iniciar sesión** (si ya tenés cuenta)

```bash
curl -X POST https://<dominio>/api/v1/auth/login \
  -H 'Content-Type: application/json' \
  -d '{ "email": "dev@ejemplo.com", "password": "una-clave-segura" }'
```

```json
{
  "data": {
    "accessToken": "eyJhbGciOi...",
    "refreshToken": "aVeryLongRandomString",
    "tokenType": "Bearer",
    "expiresIn": 900
  }
}
```

Renovar el access token cuando expire:

```bash
curl -X POST https://<dominio>/api/v1/auth/refrescar \
  -H 'Content-Type: application/json' \
  -d '{ "refreshToken": "aVeryLongRandomString" }'
```

**Paso 3 — Crear la API key** (usando el `accessToken`)

```bash
curl -X POST https://<dominio>/api/v1/api-keys \
  -H 'Authorization: Bearer <accessToken>' \
  -H 'Content-Type: application/json' \
  -d '{
    "nombre": "Mi aplicacion",
    "nombreDesarrollador": "Equipo X",
    "scopes": ["procedures:read", "institutions:read", "categories:read"]
  }'
```

```json
{
  "data": {
    "id": "8f3b...-...",
    "nombre": "Mi aplicacion",
    "prefijo": "pnt_vWe_ICmO",
    "scopes": ["categories:read", "institutions:read", "procedures:read"],
    "estado": "activa",
    "limiteTasa": 120,
    "expiraEn": null,
    "creadaEn": "2026-09-10T18:00:00.000Z",
    "llaveCompleta": "pnt_vWe_ICmO2u...clave-secreta-completa..."
  }
}
```

> ⚠️ **`llaveCompleta` se muestra una sola vez.** Guardala en un lugar seguro.
> La plataforma solo almacena un hash; si la perdés, regenerá la key.

### 2.3 Usar la API key

Enviá la key en el header **`X-API-Key`** en cada petición:

```bash
curl https://<dominio>/api/v1/procedures \
  -H 'X-API-Key: pnt_vWe_ICmO2u...'
```

Verificar que tu key funciona:

```bash
curl https://<dominio>/api/v1/api-keys/uso -H 'X-API-Key: pnt_...'
```

```json
{
  "data": {
    "nombre": "Mi aplicacion",
    "scopes": ["procedures:read", "institutions:read"],
    "limiteTasa": 120
  }
}
```

### 2.4 Scopes

Consultá el catálogo actualizado en `GET /api/v1/api-keys/scopes`.

| Scope | Permite |
|---|---|
| `procedures:read` | Leer el catálogo de trámites y su detalle |
| `institutions:read` | Leer instituciones |
| `categories:read` | Leer categorías |
| `translations:read` | Leer traducciones publicadas |
| `accessibility:read` | Leer recursos de accesibilidad (LENSEGUA, etc.) |
| `statistics:read` | Leer estadísticas agregadas del catálogo |
| `submissions:write` | Crear solicitudes en nombre de un ciudadano |

Si no indicás `scopes` al crear la key, se asignan todos los de **solo lectura**
(nunca `submissions:write` por defecto).

### 2.5 Gestionar tus API keys

Todas requieren `Authorization: Bearer <accessToken>` (JWT), no la API key.

| Método | Ruta | Descripción |
|---|---|---|
| `GET` | `/api/v1/api-keys` | Lista tus keys (sin el secreto ni el hash) |
| `GET` | `/api/v1/api-keys/{id}` | Detalle de una key |
| `POST` | `/api/v1/api-keys/{id}/regenerar` | Nuevo secreto; el anterior deja de funcionar al instante |
| `POST` | `/api/v1/api-keys/{id}/revocar` | Desactiva la key (queda en el historial) |
| `DELETE` | `/api/v1/api-keys/{id}` | Elimina la key por completo |

---

## 3. Formato de respuesta

**Recurso único:**

```json
{ "data": { ... } }
```

**Colección (paginada):**

```json
{
  "data": [ { ... }, { ... } ],
  "meta": { "page": 1, "limit": 20, "total": 137, "totalPaginas": 7 }
}
```

---

## 4. Errores

```json
{
  "error": {
    "code": "NOT_FOUND",
    "message": "Tramite no encontrado",
    "requestId": "c7cefc97-cfb6-4ec9-9d85-4ebd5a8fa196"
  }
}
```

Incluí el `requestId` si reportás un problema.

| HTTP | `code` | Cuándo |
|---|---|---|
| 400 | `BAD_REQUEST` | Parámetro con formato inválido (UUID, enum, rango) |
| 401 | `UNAUTHORIZED` | Falta el JWT o es inválido |
| 401 | `API_KEY_INVALIDA` | La API key no existe, fue revocada o expiró |
| 403 | `FORBIDDEN` | La API key no tiene el scope necesario |
| 404 | `NOT_FOUND` | El recurso no existe |
| 409 | `CONFLICT` | Conflicto de estado (ej. slug duplicado) |
| 429 | `RATE_LIMIT_EXCEDIDO` | Superaste el límite de peticiones |
| 500 | `INTERNAL_ERROR` | Error del servidor |

Los parámetros de query **no reconocidos se ignoran** (no producen 400).

---

## 5. Paginación

Colecciones: `?page=<n>&limit=<n>` — `page` empieza en 1, `limit` máximo 100
(por defecto 20). El bloque `meta` trae `total` y `totalPaginas`.

```
GET /api/v1/procedures?page=2&limit=50
```

---

## 6. Límite de tasa (rate limiting)

Solo aplica cuando enviás una API key. Ventana de **60 segundos**.

| Header | Significado |
|---|---|
| `X-RateLimit-Limit` | Máximo de peticiones por minuto de tu key |
| `X-RateLimit-Remaining` | Peticiones restantes en la ventana actual |
| `X-RateLimit-Reset` | Epoch (segundos) en que se reinicia la ventana |

Al superarlo: `429` con header `Retry-After` (segundos a esperar).
Límite por defecto: **120 req/min**. Las peticiones anónimas no tienen límite
por ahora (puede cambiar).

---

## 7. Referencia de endpoints

### 7.1 Trámites

#### `GET /api/v1/procedures`

Listado de trámites **publicados**, paginado.

**Parámetros de query** (todos opcionales):

| Parámetro | Tipo | Descripción |
|---|---|---|
| `q` | string | Búsqueda por texto (nombre, descripción, código). Tolera coincidencias parciales |
| `institucionId` | uuid | Filtrar por institución |
| `categoriaId` | uuid | Filtrar por categoría |
| `modalidad` | enum | `en_linea` \| `presencial` \| `mixto` |
| `modoEjecucion` | enum | `solo_informacion` \| `enlace_externo` \| `formulario_en_linea` \| `totalmente_digital` \| `hibrido` |
| `tipoCosto` | enum | `gratuito` \| `fijo` \| `variable` \| `desconocido` |
| `disponibleEnLinea` | bool | `true` / `false` |
| `departamentoId` | uuid | Filtrar por departamento |
| `municipioId` | uuid | Filtrar por municipio |
| `orden` | enum | `recientes` (default) \| `nombre` \| `populares` |
| `page`, `limit` | int | Paginación |

**Ejemplo de item (`data[i]`):**

```json
{
  "id": "e8c97c8f-...",
  "publicId": "TR-82DC658AC3",
  "slug": "registro-de-empresa-mercantil",
  "codigo": null,
  "nombre": "Registro de empresa mercantil",
  "descripcionCorta": "Inscripción de una empresa mercantil individual.",
  "estado": "publicado",
  "modoEjecucion": "enlace_externo",
  "modalidad": "en_linea",
  "disponibleEnLinea": true,
  "tipoCosto": "fijo",
  "costo": 50,
  "moneda": "GTQ",
  "tiempoRespuesta": { "valor": 3, "unidad": "dias_habiles", "texto": null },
  "calidadDatos": "parcial",
  "urlExterna": "https://minegocio.gt/registro",
  "urlFuenteOficial": "https://www.mineco.gob.gt/...",
  "institucion": {
    "id": "01c40736-...",
    "slug": "ministerio-de-economia",
    "nombre": "Ministerio de Economia",
    "siglas": "MINECO",
    "urlLogo": null
  },
  "categorias": [
    { "id": "cc93...", "slug": "economia", "nombre": "Economia", "esPrincipal": true }
  ],
  "publicadoEn": "2026-09-10T18:11:08.497Z",
  "actualizadoEn": "2026-09-10T18:25:11.542Z"
}
```

> **`urlExterna`** es la página oficial donde se realiza el trámite fuera de esta
> plataforma. **`urlFuenteOficial`** es la página institucional que lo describe.
> Cualquiera de las dos puede ser `null`.

#### `GET /api/v1/procedures/{slug}`

Detalle de un trámite. Acepta el `slug` o el `publicId` (`TR-XXXXXXXX`).
Devuelve todo lo del listado **más**: `descripcion`, `resultado`, `dirigidoA`,
`vigencia`, `fuente`, `vistas`, y los arreglos `requisitos`, `pasos`,
`normativas`, `enlaces`, `costos`, `tiempos`.

```bash
curl https://<dominio>/api/v1/procedures/registro-de-empresa-mercantil
```

Devuelve `404 NOT_FOUND` si no existe o no está publicado.

### 7.2 Instituciones

```
GET /api/v1/institutions?q=&page=&limit=
GET /api/v1/institutions/{slug}
```

### 7.3 Categorías

```
GET /api/v1/categories?q=&page=&limit=
GET /api/v1/categories/{slug}
```

### 7.4 Ubicaciones

```
GET /api/v1/departments
GET /api/v1/departments/{id}/municipalities
GET /api/v1/municipalities?departmentId={id}
```

Devuelven un arreglo simple: `{ "data": [ { "id": "...", "nombre": "..." } ] }`.

### 7.5 Metadatos de la API

```
GET /api/v1/health              # estado del servicio
GET /api/v1/api-keys/scopes     # scopes disponibles (público)
```

---

## 8. Ejemplos

### cURL

```bash
API="https://<dominio>/api/v1"
KEY="pnt_..."

# Buscar trámites de una institución, disponibles en línea
curl -s "$API/procedures?q=licencia&disponibleEnLinea=true" -H "X-API-Key: $KEY"

# Detalle
curl -s "$API/procedures/licencia-de-caza" -H "X-API-Key: $KEY"
```

### JavaScript (fetch)

```js
const API = "https://<dominio>/api/v1";
const KEY = process.env.PNT_API_KEY;

async function buscarTramites(params = {}) {
  const qs = new URLSearchParams(params).toString();
  const res = await fetch(`${API}/procedures?${qs}`, {
    headers: { "X-API-Key": KEY },
  });
  if (!res.ok) {
    const { error } = await res.json();
    throw new Error(`${error.code}: ${error.message}`);
  }
  return res.json(); // { data: [...], meta: {...} }
}

const { data, meta } = await buscarTramites({ q: "pasaporte", limit: 10 });
console.log(`${meta.total} resultados`, data);
```

### Python (requests)

```python
import os, requests

API = "https://<dominio>/api/v1"
HEADERS = {"X-API-Key": os.environ["PNT_API_KEY"]}

def buscar_tramites(**params):
    r = requests.get(f"{API}/procedures", headers=HEADERS, params=params)
    r.raise_for_status()
    return r.json()

resp = buscar_tramites(q="registro", modalidad="en_linea", limit=20)
print(resp["meta"]["total"], "resultados")
for t in resp["data"]:
    print("-", t["nombre"], "->", t["urlExterna"] or "sin enlace")
```

---

## 9. Buenas prácticas

- Guardá la API key en variables de entorno, **nunca** en el código ni en el
  frontend/cliente. Si vas a consumir la API desde un navegador, hacelo a través
  de tu propio backend.
- Cacheá el catálogo: cambia con poca frecuencia. Respetá `X-RateLimit-*`.
- Manejá el `429` con reintento respetando `Retry-After`.
- Un trámite puede tener información incompleta (`calidadDatos`, campos `null`).
  No asumas que todos los campos vienen llenos.

---

## 10. Changelog

| Fecha | Cambio |
|---|---|
| 2026-09-10 | Versión inicial: catálogo (trámites, instituciones, categorías, ubicaciones), búsqueda, cuentas de desarrollador y API keys con scopes y límite de tasa. |
