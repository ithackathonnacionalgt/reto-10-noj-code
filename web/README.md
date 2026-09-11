# web — Frontend Angular

Frontend del Reto 10 (Catálogo de Trámites como dato abierto). Angular 21 en modo
standalone y zoneless, desplegado en Cloudflare Workers como SPA estático.

---

## Poner en marcha

```bash
npm install
npm start           # http://localhost:4200
```

Por defecto `ng serve` redirige `/api` al backend local en el puerto 3001.
Iniciá el backend en otra terminal para probar los cambios actuales de la API:

```bash
cd ../backend && npm run start:dev      # en otra terminal
API_PROXY=http://localhost:3001 npm start
```

Para usar la API publicada, establecé `API_PROXY=https://reto-10-noj-code-production.up.railway.app`
antes de iniciar Angular. Reiniciá `ng serve` cuando cambies el destino del proxy.

En ambos casos el navegador habla siempre con su mismo origen — igual que en
producción — así que no hay peticiones cross-origin ni que tocar `CORS_ORIGINS`.
Ver `proxy.conf.mjs`.

El **modo IA funciona en local con el modelo real**: `/api/asistente` se reenvía
al Worker desplegado, que es quien tiene la llave de OpenAI. La llave nunca pasa
por tu máquina. Para probar cambios del propio Worker, levantalo con
`npm run preview` y apuntá el proxy ahí:
`ASISTENTE_PROXY=http://localhost:8787 npm start`.

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
│   └── asistente/   Servicio del modo IA
├── layout/        Cascarón: cabecera (accesibilidad + tema) y pie
├── shared/        Piezas reutilizables y sin estado de negocio
│   ├── ui/          buscador, tarjeta-tramite, paginacion, aviso
│   ├── voz/         dictado por voz (Web Speech API)
│   └── formato/     pipes de costo y tiempo
└── features/      Una carpeta por funcionalidad, con carga diferida
    ├── catalogo/     pantalla principal: buscador y resultados
    ├── tramites/     ficha de detalle
    └── no-encontrado/
```

**La raíz es el buscador.** Al entrar solo se ve el título y el buscador,
centrados en la pantalla: sin resultados, sin categorías, sin filtros. Al buscar,
el título se pliega, el buscador sube y aparecen las tarjetas. Borrar la búsqueda
vuelve al reposo. `/tramites` redirige a `/` porque quedaron enlaces publicados
apuntando ahí.

**El buscador tiene tres piezas:**

- **Texto.** Búsqueda directa contra `GET /procedures?q=…`, paginada.
- **Modo IA.** Un interruptor (`role="switch"`) dentro de la barra. Encendido,
  la barra se bordea con una luz azul-violeta que gira y la consulta la
  interpreta el asistente (ver «El asistente de IA»): arriba va su respuesta en
  una o dos oraciones y abajo las tarjetas de los trámites que eligió.
- **Micrófono.** Transcribe mientras la persona habla (`Dictado`, sobre la Web
  Speech API del navegador) y busca solo al terminar la frase. En navegadores sin
  soporte —Firefox— el botón no aparece.

Todo vive en la URL (`?q=…&ia=1`). Los filtros de la versión anterior
(`categoriaId`, `institucionId`, etc.) ya no tienen controles, pero se siguen
respetando porque hay enlaces publicados con ellos.

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
| Modo IA | `--ia-azul/-indigo/-violeta/-magenta/-celeste`, `--ia-paleta`, `--ia-lineal`, `--ia-brillo` |

La luz del modo IA es un `conic-gradient` que gira animando `--angulo-ia`,
registrada con `@property` en `styles.scss` para que el navegador pueda
interpolar el ángulo. Son dos capas: un aro nítido de 2px y el mismo aro
desenfocado, que es el resplandor. Con «reducir movimiento» queda quieta.

Encima corre un **destello**: un cometa con el mismo degradado que da una vuelta
al contorno cada 4,2 s con `offset-path: border-box`. Se usa un camino y no otro cónico porque
en una barra tan ancha el ángulo barre las puntas en un parpadeo y se arrastra en
los lados; el camino da velocidad pareja en todo el perímetro. Con «reducir
movimiento», o en un navegador sin `offset-path`, el destello no aparece.

Al **encender** el modo IA la barra hace un leve respiro (`scale` 1.015) y
sale una onda del mismo degradado que se abre y se desvanece una sola vez.
Lupa y destellos se cruzan girando, y el botón de enviar funde a degradado
por una capa aparte. Todo usa `--transicion-ia` (750 ms, salida suave), que
también se anula con «reducir movimiento».

La respuesta de la IA es una sola oración (el prompt pide un máximo de 15
palabras) en una línea sin recuadro, con el ícono de destellos delante, en
`--ia-texto` y con las palabras apareciendo una tras otra.

### Videos en lengua de señas (LENSEGUA)

Cada trámite puede tener dos videos (`accesibilidad.videosSenas`, campo
`tipo`): la **descripción corta** y el **paso a paso**. Solo llegan los
publicados.

- **Tarjeta** — con mouse o trackpad, dejar el cursor 350 ms sobre la tarjeta
  abre al lado un cuadro del mismo tamaño con la descripción, en silencio y en
  bucle. Va a la derecha si entra en la pantalla, si no a la izquierda, y si no
  entra en ninguno, encima de la tarjeta. Si el trámite todavía no tiene la
  descripción, muestra el paso a paso. En pantallas táctiles no hay hover:
  la tarjeta muestra un botón «LENSEGUA» que abre el video en el visor.
- **Ficha** — el paso a paso va en una columna a la derecha que acompaña el
  scroll (`position: sticky`), con un selector para pasar a la descripción.
  En tablet y teléfono queda entre el encabezado y los datos.
- **Visor** — «Ampliar» abre el video al centro con la página desenfocada
  detrás. Es un `<dialog>` nativo (`showModal()`): foco atrapado, `Esc` y el
  `::backdrop` los da el navegador. Retoma desde el segundo en que iba.

Los videos arrancan solos y mudos (la única forma en que los navegadores
dejan reproducir sin un clic). Con «reducir movimiento» esperan al play, y
fuera de la pantalla se pausan.

La URL puede ser un archivo (se reproduce con `<video>`) o un enlace de
YouTube, Vimeo o Google Drive (se incrusta su reproductor): ver
`shared/video/fuente-video.ts`.

Si el listado no trae los videos, la tarjeta pide la ficha la primera vez que
se le pasa el cursor y la guarda en memoria (`core/videos/videos-lensegua.ts`).
El backend los incluye en el listado desde `aResumen`, sin consultas extra.

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

Contraste verificado (texto normal exige 4.5:1 en AA):

| Tema | Cuerpo | Título tarjeta | Texto suave |
|---|---|---|---|
| Claro | 15.76 | 15.76 | 5.74 |
| Oscuro | 16.97 | 15.55 | 6.13 |

El degradado del modo IA nunca lleva texto encima: solo íconos blancos
(interruptor, enviar, insignia), que como elemento gráfico exigen 3:1.

---

### Los filtros viven en la URL

El listado lee sus filtros de los query params, no de un estado interno. Así un
listado filtrado se comparte por enlace, el botón "atrás" funciona y recargar no
pierde nada — coherente con un proyecto de datos abiertos.

---

## Accesibilidad

El panel (botón de la cabecera o **Alt + A**) es de íconos: cada herramienta
es un ícono con una o dos palabras, y la explicación completa va en su nombre
accesible y en el `title`. En teléfono se abre como una hoja desde abajo.

- **Perfiles** de un toque: Baja visión, Dislexia, Calma (sin animaciones ni
  color, pensado para fotosensibilidad y TDAH) y Teclado. Tocar uno activo lo
  apaga.
- **Tamaño del texto** en cinco niveles (90 % a 150 %).
- **Herramientas**: contraste alto (también en oscuro: negro, blanco y
  amarillo), escala de grises, enlaces subrayados, títulos marcados, tipografía
  Atkinson Hyperlegible, espaciado de texto (WCAG 1.4.12), lupa de texto,
  cursor grande, guía de lectura, foco resaltado, sin animaciones (también
  frena los videos que arrancan solos) y lectura en voz alta.

`AccesibilidadStore` guarda todo en `localStorage` (con `try/catch`: la app
funciona igual si el navegador lo bloquea). Lo que se resuelve con CSS se
refleja como atributos `data-*` en `<html>` y los estilos de `styles.scss`
reaccionan solos. La guía, la lupa y la voz necesitan JavaScript y viven en
`layout/herramientas-accesibilidad`; escuchan el documento solo mientras están
encendidas. La fuente Atkinson solo se descarga cuando alguien activa
«Legible».

También de serie: enlace de salto al contenido, foco visible que nunca se
desactiva, `aria-live` en los resultados y respeto de `prefers-reduced-motion`.

---

## El asistente de IA

El modo IA del buscador responde con un modelo de OpenAI, pero **solo puede
hablar del catálogo**. Cómo se garantiza eso:

```
Angular ──POST /api/asistente──▶ Worker
                                   │
             ┌─────────────────────┼──────────────────────┐
             ▼                     ▼                      │
   1. ENTENDER (OpenAI)     copia del catálogo            │
   «murió mi papá» →        (assets del Worker,           │
   defunción, RENAP…         índice en memoria)           │
             └──────────┬──────────┘                      │
                        ▼                                 │
   2. BUSCAR: pregunta literal + términos, fundidos (RRF) │
                        ▼                                 │
   3. ELEGIR (OpenAI): 14 candidatos numerados ──▶ { respuesta, ids }
                        ▼
          ids ─resueltos contra la copia─▶ trámites reales
```

1. **Entender.** La persona cuenta un problema («mi hijo acaba de nacer»), no
   el nombre de un trámite. Un primer llamado corto al modelo lo traduce a cómo
   se llaman las cosas en el catálogo («certificado de nacimiento»,
   «inscripción de nacimiento», «RENAP»). Sin este paso, la búsqueda por
   palabras no tiene cómo unir «morir» con «defunción».
2. **Buscar.** Sobre una copia del catálogo que viaja en los assets del Worker
   (`public/ia/catalogo.json`, la genera `npm run indice-ia` en cada deploy).
   El índice mira nombre, **etiquetas curadas**, institución, categorías y
   descripción. Se funden por rango recíproco la búsqueda de los términos y la
   de la pregunta literal. No toca el backend: buscar cuesta microsegundos.
3. **Elegir.** El modelo recibe los 14 mejores candidatos numerados, decide
   cuál resuelve la situación (primero lo urgente: el certificado de defunción
   antes que la pensión) y devuelve números, no slugs: los slugs largos
   costaban hasta 150 tokens de salida.

La copia se carga en paralelo con el paso 1, y una pregunta repetida en los
últimos 15 minutos sale de memoria sin llamar al modelo. La cabecera
`Server-Timing` de la respuesta dice cuánto tardó cada paso.

**El modelo nunca redacta datos de un trámite.** Devuelve números de candidato,
y los trámites que la interfaz pinta como tarjetas salen de la copia, así que
siempre son filas de la base. Un número inventado no encuentra nada y no
aparece ninguna tarjeta — no hay forma de que un trámite falso llegue a la
pantalla. Sin la copia (entorno local sin generarla), el Worker busca los
términos en la API del backend.

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

Cada paso usa el modelo que le conviene, y los dos se cambian sin tocar código
con variables de `wrangler.jsonc`:

- `OPENAI_MODELO` — **entender** (`gpt-4o-mini`): sacar palabras clave es una
  tarea simple y es el más rápido.
- `OPENAI_MODELO_ELEGIR` — **elegir** (`gpt-4.1-mini` por defecto): tiene que
  respetar «si ninguno sirve, no recomiendes nada». `gpt-4o-mini` recomendaba
  un aviso de robo de armas ante «me robaron el celular» antes que admitir que
  el catálogo no tiene esa denuncia.

### Cuando el asistente no está disponible

`AsistenteService` cae a una búsqueda directa contra `GET /procedures` si el
endpoint responde error — falta la llave, se cayó OpenAI o el Worker no responde. La respuesta pierde naturalidad, pero la persona
igual encuentra su trámite. En ese caso la respuesta se rotula «Búsqueda
directa» y no «Respuesta con IA»: la interfaz no se atribuye una IA que no usó.

### Límites

El endpoint es público, así que el Worker acota el gasto antes de llamar al
modelo: pregunta de 500 caracteres, 90 tokens para entender, 120 para
responder y como mucho 6 trámites por respuesta. No se confía en el cliente
para esto.

## Despliegue en Cloudflare

El Worker (`worker/index.ts`) hace tres cosas: sirve los assets del SPA, resuelve
`/api/asistente` con OpenAI y reenvía el resto de `/api/*` al backend real.

```bash
npx wrangler login     # una sola vez
npm run deploy
```

**La API** se configura con la variable `API_ORIGEN` en `wrangler.jsonc`, hoy
apuntando a `https://reto-10-noj-code-production.up.railway.app` (Railway). Es una URL pública, no un
secreto: vive en el repositorio para que el despliegue sea reproducible.

Para cambiar de backend basta editar esa variable y volver a desplegar — **no hay
que recompilar el frontend**, porque la URL nunca entra al bundle. Si quedara
vacía, `/api` responde 503 con un mensaje explícito en vez de fallar en silencio.

Este diseño evita CORS por completo.

**La llave de OpenAI no va en `wrangler.jsonc`.** Es un secreto: se carga con
`npx wrangler secret put OPENAI_API_KEY` y se aplica sin volver a desplegar. Ver
«El asistente de IA».
