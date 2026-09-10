/**
 * Proxy del servidor de desarrollo.
 *
 * Replica lo que hace el Worker en producción: `/api/*` sale hacia el backend,
 * de modo que el navegador siempre habla con su mismo origen y no hay CORS.
 *
 * Por defecto apunta a la API desplegada, así trabajar en el frontend no obliga
 * a levantar el backend. Para usar el backend local:
 *
 *   API_PROXY=http://localhost:3001 npm start
 */
const API_DESPLEGADA = 'https://reto-10-noj-code-api.onrender.com';

const destino = process.env['API_PROXY'] ?? API_DESPLEGADA;

console.log(`[proxy] /api -> ${destino}`);

export default {
  '/api': {
    target: destino,
    // Obligatorio al apuntar a un host remoto: sin esto el backend recibe
    // `Host: localhost:4200` y puede rechazar o enrutar mal la petición.
    changeOrigin: true,
    secure: true,
    logLevel: 'warn',
  },
};
