/**
 * Proxy del servidor de desarrollo.
 *
 * Replica lo que hace el Worker en producción: `/api/*` sale hacia el backend,
 * de modo que el navegador siempre habla con su mismo origen y no hay CORS.
 *
 * Usa el backend local actualizado en :3001. Para consultar la API publicada,
 * establecer API_PROXY=https://reto-10-noj-code-production.up.railway.app.
 *
 * `/api/asistente` es la excepción: no lo resuelve el backend sino el Worker,
 * porque necesita la llave de OpenAI. `ng serve` no tiene Worker, así que se
 * reenvía al desplegado — el modo IA funciona en local con el modelo real y la
 * llave nunca sale de Cloudflare. Para apuntar a un Worker local
 * (`npm run preview`):
 *
 *   ASISTENTE_PROXY=http://localhost:8787 npm start
 */
const WORKER_DESPLEGADO = 'https://catalogo-tramites.oficialjuppiter.workers.dev';

const destino = process.env['API_PROXY'] ?? 'http://localhost:3001';
const asistente = process.env['ASISTENTE_PROXY'] ?? WORKER_DESPLEGADO;

console.log(`[proxy] /api/asistente -> ${asistente}`);
console.log(`[proxy] /api -> ${destino}`);

// El orden importa: el proxy toma la primera clave que coincide, así que la
// ruta específica va antes que el comodín `/api`.
export default {
  '/api/asistente': {
    target: asistente,
    changeOrigin: true,
    secure: true,
    logLevel: 'warn',
  },
  '/api': {
    target: destino,
    // Obligatorio al apuntar a un host remoto: sin esto el backend recibe
    // `Host: localhost:4200` y puede rechazar o enrutar mal la petición.
    changeOrigin: true,
    secure: true,
    logLevel: 'warn',
  },
};
