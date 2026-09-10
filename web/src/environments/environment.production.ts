import type { EntornoApp } from '../app/core/config/entorno.model';

/**
 * Entorno de produccion (Cloudflare).
 *
 * `apiUrl` es relativa a proposito: el Worker de Cloudflare hace de proxy de
 * `/api/v1/*` hacia el backend real (ver `web/wrangler.jsonc` y `web/worker/index.ts`).
 * Asi el navegador nunca hace una peticion cross-origin y no hay que tocar CORS
 * ni recompilar el front cuando cambia la URL del backend: se cambia la variable
 * `API_ORIGEN` del Worker y listo.
 */
export const environment: EntornoApp = {
  produccion: true,
  apiUrl: '/api/v1',
};
