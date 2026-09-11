# Importación del Catálogo Nacional de Trámites (15 dic 2023)

## Fuentes

1. **`catalogo-de-tramites-al-15-dic-2023-dpdl.csv`** (copiado a
   `backend/src/database/seed/fuentes/`) — export del Catálogo Nacional de
   Trámites. Solo trae: `id, institución, nombre, categoría, descripción, enlace`.
2. **Páginas oficiales `https://tramites.gob.gt/servicio/<id>/`** — de ahí se
   extraen **requisitos, pasos, normativa, costo y tiempo de respuesta reales**.
   Nada se inventa (CLAUDE.md §47); lo que la fuente no publica, queda vacío.

## Resultado en la base de datos

| | |
|---|---|
| Trámites publicados | **1305** (1303 importados + 2 de ejemplo del seed) |
| `calidad_datos = completo` (con requisitos **y** pasos) | **1131** |
| `calidad_datos = parcial` | 97 |
| `calidad_datos = necesita_revision` | 78 |
| Requisitos insertados | ~6 974 |
| Pasos insertados | ~8 165 |
| Normativas (base legal) insertadas | ~1 134 |
| Instituciones | 14 → 19 con las del seed |
| Categorías | 13 → 10 del seed + 3 nuevas (`salud`, `inscripciones-y-registros`, `servicios-de-migracion`) |

Cada trámite importado:

- `estado = publicado`, `tipo_fuente = oficial`
- `modo_ejecucion = enlace_externo` · `url_externa` + `source_url` = el enlace de la fuente
- `codigo = CAT-<id original>` (clave para reimportar sin duplicar) · `importado_en`
- `tipo_costo` / `costo` / `moneda` y `tiempo_respuesta_texto` (+ `valor`/`unidad`
  si es un valor simple) parseados de la página oficial
- `calidad_datos`:
  - `completo` si la página oficial trae requisitos **y** pasos
  - `parcial` si trae uno de los dos
  - `necesita_revision` si no tiene página oficial o no publica nada

## Archivos

| Archivo | Qué es |
|---|---|
| `backend/src/database/seed/catalogo-2023.json` | Datos base normalizados (instituciones, categorías, 1303 trámites) |
| `backend/src/database/seed/enriquecer-catalogo.mjs` | Descarga y parsea las 1303 páginas oficiales |
| `backend/src/database/seed/catalogo-2023-enriquecido.json` | Requisitos/pasos/normativa/costo/tiempo extraídos (1138 con datos) |
| `backend/src/database/seed/importar-catalogo.ts` | Importador idempotente (crea nuevos + backfill de los existentes) |
| `backend/src/database/seed/fuentes/…csv` | CSV original, para reproducibilidad |
| `docs/catalogo-2023-revisar.csv` | Los **172** trámites sin requisitos/pasos completos |

## Cómo (re)generar e importar

```bash
cd backend

# 1. (opcional) regenerar catalogo-2023.json desde el CSV — ver script en el repo
# 2. descargar/parsear las páginas oficiales (reanudable, ~4 min, concurrencia 6)
node src/database/seed/enriquecer-catalogo.mjs

# 3. importar / backfill a la BD (idempotente)
npm run import:catalogo          # local  (lee backend/.env)
npm run import:catalogo:prod     # Render / CI (lee process.env)
```

`import:catalogo` es idempotente:
- trámite nuevo → se crea con todos sus datos;
- trámite existente → se actualizan costo/tiempo/calidad, y se agregan
  requisitos/pasos/normativa **solo si no los tenía**.

## Los 172 sin requisitos/pasos completos

Ver `docs/catalogo-2023-revisar.csv` (código, institución, nombre, motivo, enlace).

| Motivo | Cant. |
|---|---|
| sin página oficial (solo enlace `bit.ly` / genérico) | 165 |
| tiene requisitos pero no pasos | 6 |
| la página oficial no publica requisitos ni pasos | 1 |

Por institución: MARN 68 · MINGOB 67 · MSPAS 13 · MICIVI 11 · MINDEF 10 · resto 3.

Estos 165 nunca tuvieron página individual en tramites.gob.gt (su enlace en el
catálogo es un acortador o un formulario genérico). Quedan visibles con
`calidad_datos = necesita_revision` y `url_externa` al sitio oficial (§46);
completarlos requiere entrada humana o una fuente oficial estructurada.

---

## Segunda fuente: `tramites-extraidos.json` (extracción asistida)

83 trámites de instituciones que **no** estaban en el catálogo CSV (RENAP, SAT,
UDEVIPO, Contraloría, INSIVUMEH, DIGECAM, PNC, OJ, Correos…). Solo trae
requisitos (texto asistido, algo ruidoso), sin pasos.

`npm run import:extraidos` (idempotente, `codigo = EXT-<id>`):

1. **Limpia duplicados previos** de la BD: agrupa por `(institución, nombre
   normalizado)`; si hay más de uno, deja el que tenga más datos y borra el
   resto. → se eliminaron **5** (venían del propio CSV).
2. **Salta** cualquier trámite del JSON cuyo nombre ya exista para esa
   institución (exacto o por contención). → **5 saltados**.
3. **Dedup entre instituciones**: si un `EXT-*` tiene el mismo nombre exacto que
   un `CAT-*` oficial (p. ej. UDEVIPO es una unidad de MICIVI), gana el oficial
   (tiene pasos) y se borra el `EXT-*`. → se eliminaron **5**.
4. Reutiliza instituciones y categorías existentes (mapea siglas y agrupa las
   ~67 categorías fragmentadas del JSON en las canónicas).

Resultado: **73 trámites nuevos**, `tipo_fuente = aportada_usuario`,
`calidad_datos = necesita_revision`.

### Estado final de la BD

- **1374 trámites** · 33 instituciones · 17 categorías
- Duplicados `(institución + nombre)`: **0**
- Mismo nombre en distintas instituciones: **1** grupo — *"Solicitud de Acceso a
  la Información Pública"* (MARN / MINTRABAJO). Es legítimo: cada institución
  tiene el suyo.
