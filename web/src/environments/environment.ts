import type { EntornoApp } from '../app/core/config/entorno.model';

/**
 * Entorno de desarrollo local.
 *
 * La URL es relativa igual que en producción: `ng serve` redirige `/api` al
 * backend de `:3001` vía `proxy.conf.json`. Así el navegador nunca hace una
 * petición cross-origin, no hay que tocar `CORS_ORIGINS` del backend, y desarrollo
 * se comporta exactamente igual que Cloudflare.
 */
export const environment: EntornoApp = {
  produccion: false,
  apiUrl: '/api/v1',
};
