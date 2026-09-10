# web — Frontend Angular

Frontend del Reto 10 (Catálogo de Trámites como dato abierto). Angular 21 en modo
standalone y zoneless, desplegado en Cloudflare Workers como SPA estático.

---

## Poner en marcha

```bash
npm install
npm start           # http://localhost:4200
```

No hace falta levantar el backend: por defecto `ng serve` redirige `/api` a la API
desplegada. Para trabajar contra el backend local:

```bash
cd ../backend && npm run start:dev      # en otra terminal
API_PROXY=http://localhost:3001 npm start
```

En ambos casos el navegador habla siempre con su mismo origen — igual que en
producción — así que no hay peticiones cross-origin ni que tocar `CORS_ORIGINS`.
Ver `proxy.conf.mjs`.

| Script | Qué hace |
|---|---|
| `npm start` | Servidor de desarrollo con proxy a la API |
| `npm run build` | Build de producción → `dist/web/browser` |
| `npm run preview` | Build + Worker local (`wrangler dev`) |
| `npm run deploy` | Build + publicación en Cloudflare |
| `npm run check:worker` | Chequeo de tipos del Worker |
| `npm test` | Pruebas unitarias |

---

## Cómo está organizado

```
src/app/
├── core/          Servicios singleton y contratos. Sin componentes.
│   ├── api/         Cliente HTTP tipado + interceptor de errores
│   ├── models/      Interfaces y enumerados del contrato de la API
│   ├── config/      Token de entorno
│   ├── accesibilidad/  Store de preferencias
│   └── asistente/   Servicio del chat
├── layout/        Cascarón: cabecera (accesibilidad + tema + asistente), pie, chat
├── shared/        Piezas reutilizables y sin estado de negocio
│   ├── ui/          buscador, tarjeta-tramite, paginacion, aviso
│   └── formato/     pipes de costo y tiempo
└── features/      Una carpeta por funcionalidad, con carga diferida
    ├── catalogo/     pantalla principal + chips de categoría y filtros avanzados
    ├── tramites/     ficha de detalle
    └── no-encontrado/
```

**La raíz es el catálogo.** No hay portada de bienvenida: buscador arriba,
etiquetas de categoría debajo y los trámites de inmediato. `/tramites` redirige
a `/` porque quedaron enlaces publicados apuntando ahí.

**Los filtros están en dos niveles.** Las categorías son etiquetas siempre
visibles (un clic); el resto —institución, departamento, modalidad, costo,
disponibilidad en línea y orden— vive plegado en un panel al lado del buscador,
con un contador de filtros activos para que nunca queden puestos sin que la
persona lo sepa.

**Regla de dependencias:** `features` → `shared` → `core`. Nunca al revés, y una
feature no importa de otra. Si dos features necesitan lo mismo, sube a `shared`
(si es visual) o a `core` (si es estado o acceso a datos).

### Convenciones

- **Standalone + signals + zoneless.** Nada de NgModules ni `zone.js`.
- **`ChangeDetectionStrategy.OnPush`** en todos los componentes.
- **Control de flujo nuevo**: `@if`, `@for`, `@switch`, `@let`. Nunca `*ngIf`.
- **`inject()`** en lugar de inyección por constructor.
- Los componentes de `shared/ui` son presentacionales: reciben `input()` y emiten
  `output()`. No inyectan servicios de datos ni navegan.
- Estado de una petición como unión discriminada (`cargando | listo | error`), no
  como booleanos sueltos que pueden contradecirse.
- Todo color, radio, sombra y capa sale de un token en `src/styles.scss`.

---

## Sistema de diseño

Dirección: **cívico moderno**. Azul profundo (`#1d4ed8`) como acento, celeste
guatemalteco (`#4997d0`) como secundario decorativo, mucho aire y profundidad
sutil. Tipografía **Inter Variable**, servida desde el propio dominio: sin CDN
externo, sin salto de layout, sin filtrar visitas a un tercero.

**Todo valor visual es un token en `src/styles.scss`** — color, espaciado,
tipografía, radios, sombras y capas. Ningún componente trae un hex, un `px`
suelto ni un `z-index` inventado. Cambiar la identidad visual es editar ese
archivo, no recorrer 20 SCSS.

| Grupo | Tokens |
|---|---|
| Espacio | `--e-1` … `--e-8` (escala de 4px) |
| Texto | `--texto-xs` … `--texto-4xl` (escala modular ~1.25) |
| Forma | `--radio-sm/-/-lg/-xl/-full` |
| Elevación | `--sombra-1/2/3`, `--sombra-acento` |
| Capas | `--z-cabecera`, `--z-flotante` |

### Tema claro y oscuro

La paleta oscura se declara **una sola vez** en el mixin `tokens-oscuros` y se
aplica en dos sitios: bajo `prefers-color-scheme: dark` (salvo que se haya
elegido claro a mano) y bajo `:root[data-tema='oscuro']`. Sin el mixin habría
que mantener la paleta duplicada y se desincronizaría a la primera.

No es la paleta clara invertida. Sobre fondo oscuro los azules saturados vibran
y los grises medios desaparecen, así que el acento se aclara y **las superficies
suben en luminosidad respecto del fondo**: en oscuro la elevación se lee por luz,
no por sombra.

`TemaStore` maneja tres estados —`claro`, `oscuro`, `sistema`— y estampa
`data-tema` en `<html>`. `sistema` no estampa nada y deja mandar a la media
query; sin ese tercer estado no habría forma de volver a "lo que diga el equipo"
después de elegir manualmente una vez. También fija `color-scheme` para que los
controles nativos (scrollbars, desplegables de los `select`) sigan el tema.

### La imagen de cada trámite

El catálogo **no publica fotos ni logos** — `urlLogo` viene `null` en las seis
instituciones. En vez de inventar imágenes, `VisualTramite` genera una a partir
de la categoría del trámite: un ícono sobre un tono propio.

Es determinista (el mismo trámite se ve siempre igual), no depende de assets
externos, no puede romperse por un 404, pesa cero bytes de red y ayuda a
distinguir tipos de trámite de un vistazo. Si algún día una institución publica
su logo, el componente lo usa en su lugar sin cambios.

Los tonos por categoría se declaran en `visual-tramite.scss`, no en el
TypeScript: es una decisión visual y cambiar la paleta no debería tocar lógica.
El fondo se calcula con `color-mix` contra la superficie del tema, así el mismo
valor rinde en claro y en oscuro; la intensidad la gobiernan `--visual-fondo`,
`--visual-halo` y `--visual-icono`, que sí cambian entre temas.

### Densidad de las tarjetas

La tarjeta del listado muestra **institución, título, descripción y las dos
cifras que la gente vino a buscar** (costo y tiempo), más una marca discreta si
el dato está incompleto. El código público, las categorías, la modalidad y el
detalle de calidad viven en la ficha completa: en un listado no ayudan a decidir,
solo saturan.

Reglas que conviene no romper:

- El **celeste nunca lleva texto encima** — no alcanza contraste AA. Solo va en
  fondos, degradados y detalles decorativos.
- Los **tamaños van en `rem`**, porque la escala de accesibilidad multiplica el
  tamaño base de `<html>` y reescala la interfaz completa de una sola vez.
- Las **transiciones usan `var(--transicion)`**, que vale `0ms` cuando alguien
  activa "reducir movimiento" o lo pide su sistema.
- Los **datos que faltan se atenúan**, no se muestran con el mismo peso que un
  dato real: señalar la información incompleta es parte del reto.

### Conteos y cobertura

Las categorías y las instituciones se muestran **con su conteo real**, y las que
están vacías aparecen apagadas en vez de desaparecer: la brecha entre lo que el
catálogo declara y lo que publica es parte de lo que el reto pide hacer visible.
Las categorías vacías van plegadas tras un botón para no ensuciar la pantalla.

Los conteos se calculan **en el cliente**, leyendo una vez el catálogo publicado.
Es un puente: la API todavía no expone facetas y esto no escala más allá de unos
cientos de trámites. Debe moverse a un endpoint de agregados en el backend.

> **Filtro de departamento.** Hoy ningún trámite tiene `departamento_id`
> asignado y la tabla `tramites_disponibilidad` está vacía, así que el filtro
> devuelve cero para cualquier valor. El panel lo avisa explícitamente en vez de
> dejar que la persona crea que la búsqueda está rota.

Contraste verificado (texto normal exige 4.5:1 en AA):

| Tema | Cuerpo | Título tarjeta | Texto suave | Chip | Botón asistente |
|---|---|---|---|---|---|
| Claro | 15.76 | 15.76 | 5.74 | 7.75 | 6.23 |
| Oscuro | 16.97 | 15.55 | 6.13 | 10.79 | 9.34 |

---

### Los filtros viven en la URL

El listado lee sus filtros de los query params, no de un estado interno. Así un
listado filtrado se comparte por enlace, el botón "atrás" funciona y recargar no
pierde nada — coherente con un proyecto de datos abiertos.

---

## Accesibilidad

`AccesibilidadStore` refleja las preferencias como atributos `data-*` en `<html>`
y una variable CSS `--escala-texto`; los estilos reaccionan solos. Se ofrece
tamaño de texto, alto contraste, subrayado de enlaces, tipografía legible y
reducción de movimiento, y se guardan en `localStorage` (con `try/catch`: la app
funciona igual si el navegador lo bloquea).

También de serie: enlace de salto al contenido, foco visible que nunca se
desactiva, `aria-live` en los resultados y respeto de `prefers-reduced-motion`.

---

## El asistente de IA

El chat lateral responde con un modelo de OpenAI, pero **solo puede hablar del
catálogo**. Cómo se garantiza eso:

```
Angular  ──POST /api/asistente──▶  Worker  ──▶  GET /procedures?limit=100
                                      │              (índice, cacheado 5 min)
                                      ▼
                                   OpenAI  ──▶  { respuesta, slugs }
                                      │
                                      ▼
                        slugs ─resueltos contra el índice─▶ trámites reales
```

**El modelo nunca redacta datos de un trámite.** Recibe el índice como contexto,
responde en una o dos oraciones y devuelve `slugs`. Los trámites que la interfaz
pinta como botones se resuelven en el Worker contra ese índice, así que siempre
son filas de la base. Si el modelo inventara un slug, no encuentra nada y no
aparece ningún botón — no hay forma de que un trámite falso llegue a la pantalla.

Se usa *structured outputs* (`response_format: json_schema`, `strict: true`), de
modo que la salida no puede salirse del esquema y no hay que parsear texto libre.

### Por qué en el Worker y no en Angular

La llave de OpenAI es un secreto. Todo lo que compila Angular viaja al navegador
y este repositorio es público: una llave en el bundle es una llave filtrada, y
cualquiera podría gastar la cuota. Por eso el modelo se llama desde el servidor.

### Configurar la llave

```bash
cd web
npx wrangler secret put OPENAI_API_KEY     # pega la llave, no queda en el repo
```

Para desarrollo local con `npm run preview` (que levanta el Worker de verdad),
la llave va en `web/.dev.vars`, que está en `.gitignore`:

```
OPENAI_API_KEY=sk-...
```

El modelo se elige con la variable `OPENAI_MODELO` de `wrangler.jsonc`
(`gpt-4o-mini` por defecto). Cambiarlo no requiere tocar código.

### Cuando el asistente no está disponible

`AsistenteService` cae a una búsqueda directa contra `GET /procedures` si el
endpoint responde error — falta la llave, se cayó OpenAI, o se está corriendo
`ng serve`, que no tiene Worker. La respuesta pierde naturalidad, pero la persona
igual encuentra su trámite. El chat nunca queda mudo.

### Límites

El endpoint es público, así que el Worker acota el gasto antes de llamar al
modelo: pregunta de 500 caracteres, 6 mensajes de historial, 220 tokens de
salida y como mucho 3 trámites por respuesta. No se confía en el cliente para
esto.

## Despliegue en Cloudflare

El Worker (`worker/index.ts`) hace tres cosas: sirve los assets del SPA, resuelve
`/api/asistente` con OpenAI y reenvía el resto de `/api/*` al backend real.

```bash
npx wrangler login     # una sola vez
npm run deploy
```

**La API** se configura con la variable `API_ORIGEN` en `wrangler.jsonc`, hoy
apuntando a `https://reto-10-noj-code-api.onrender.com`. Es una URL pública, no un
secreto: vive en el repositorio para que el despliegue sea reproducible.

Para cambiar de backend basta editar esa variable y volver a desplegar — **no hay
que recompilar el frontend**, porque la URL nunca entra al bundle. Si quedara
vacía, `/api` responde 503 con un mensaje explícito en vez de fallar en silencio.

Este diseño evita CORS por completo.

**La llave de OpenAI no va en `wrangler.jsonc`.** Es un secreto: se carga con
`npx wrangler secret put OPENAI_API_KEY` y se aplica sin volver a desplegar. Ver
«El asistente de IA».
