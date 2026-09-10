/**
 * Worker de Cloudflare que sirve el SPA de Angular.
 *
 * Hace tres cosas:
 *
 *  1. Resuelve `/api/asistente` con el motor conversacional (ver `asistente.ts`).
 *     Se atiende acá y no en el backend porque necesita la llave de OpenAI, que
 *     es un secreto del Worker y nunca puede viajar al navegador.
 *
 *  2. Reenvía el resto de `/api/*` al backend real. Así el navegador siempre
 *     habla con su mismo origen: no hay preflight de CORS, no hay que listar el
 *     dominio de Cloudflare en `CORS_ORIGINS`, y cambiar de backend es cambiar
 *     una variable — no recompilar el front.
 *
 *  3. Todo lo demás lo resuelve el binding de assets, configurado como
 *     `single-page-application`: cualquier ruta desconocida devuelve `index.html`
 *     para que el router de Angular tome el control (necesario para que
 *     `/tramites/mi-slug` funcione al recargar).
 */

import { manejarAsistente, type EnvAsistente } from './asistente';

interface Env extends EnvAsistente {
  ASSETS: Fetcher;
  /** Origen del backend, sin barra final. Ej. `https://api.ejemplo.gt` */
  API_ORIGEN?: string;
}

const PREFIJO_API = '/api/';
const RUTA_ASISTENTE = '/api/asistente';

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    // Antes del proxy: esta ruta la resuelve el Worker, no el backend.
    if (url.pathname === RUTA_ASISTENTE) {
      return manejarAsistente(request, env);
    }

    if (!url.pathname.startsWith(PREFIJO_API)) {
      return env.ASSETS.fetch(request);
    }

    const origen = env.API_ORIGEN?.replace(/\/+$/, '');
    if (!origen) {
      // Preferimos un error explícito y legible a un 404 silencioso: si falta la
      // variable, quien despliega tiene que enterarse enseguida.
      return Response.json(
        {
          error: {
            message:
              'La API no está configurada. Definí la variable API_ORIGEN del Worker.',
          },
        },
        { status: 503 },
      );
    }

    const destino = new URL(url.pathname + url.search, origen);
    const proxy = new Request(destino, request);
    // El Host original haría fallar el enrutado por virtual host del backend.
    proxy.headers.delete('host');

    try {
      return await fetch(proxy);
    } catch {
      return Response.json(
        { error: { message: 'No se pudo contactar a la API.' } },
        { status: 502 },
      );
    }
  },
} satisfies ExportedHandler<Env>;
