#!/usr/bin/env node
/**
 * Genera la copia del catálogo que usa el asistente de IA.
 *
 * El Worker responde las preguntas del modo IA buscando sobre esta copia en
 * memoria, sin ir al backend: una búsqueda contra Render (plan gratuito) tarda
 * de 0,5 a 7 segundos y la persona estaba esperando eso en cada pregunta.
 *
 * Se descarga de la API pública y se deja en `public/ia/catalogo.json`, que el
 * build de Angular copia a los assets y el Worker lee con `env.ASSETS`. Son
 * datos públicos, no hay ningún secreto en juego.
 *
 * Corre solo en cada `npm run deploy`. Si la API no responde, deja la copia
 * anterior en su lugar y no frena el despliegue.
 *
 *     npm run indice-ia
 *     API_ORIGEN=http://localhost:3001 npm run indice-ia
 */

import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const RAIZ = join(dirname(fileURLToPath(import.meta.url)), '..');
const DESTINO = join(RAIZ, 'public', 'ia', 'catalogo.json');

/** El mismo origen que usa el Worker en producción (wrangler.jsonc). */
async function origenApi() {
  if (process.env.API_ORIGEN) return process.env.API_ORIGEN.replace(/\/+$/, '');
  const config = await readFile(join(RAIZ, 'wrangler.jsonc'), 'utf8');
  const m = config.match(/"API_ORIGEN"\s*:\s*"([^"]+)"/);
  if (!m) throw new Error('No encontré API_ORIGEN en wrangler.jsonc');
  return m[1].replace(/\/+$/, '');
}

const TAMANO_PAGINA = 100; // tope de la API
const EN_PARALELO = 4; // más satura al backend gratuito
const TIMEOUT_MS = 60_000;

async function traer(url, intento = 1) {
  try {
    const r = await fetch(url, { signal: AbortSignal.timeout(TIMEOUT_MS) });
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    return await r.json();
  } catch (e) {
    if (intento < 3) return traer(url, intento + 1);
    throw new Error(`${url}: ${e.message}`);
  }
}

/**
 * Solo lo que usan la búsqueda y la tarjeta del frontend. Los videos quedan
 * afuera a propósito: cambian más seguido que el catálogo, y sin ellos la
 * tarjeta los pide frescos a la API.
 */
function compactar(t) {
  const { accesibilidad: _videos, ...resto } = t;
  return resto;
}

async function main() {
  const origen = await origenApi();
  const base = `${origen}/api/v1/procedures?limit=${TAMANO_PAGINA}`;
  const t0 = Date.now();

  const primera = await traer(`${base}&page=1`);
  const total = primera.meta.totalPaginas;
  const paginas = [primera.data];
  for (let p = 2; p <= total; p += EN_PARALELO) {
    const lote = [];
    for (let i = p; i < p + EN_PARALELO && i <= total; i++) lote.push(traer(`${base}&page=${i}`));
    for (const pagina of await Promise.all(lote)) paginas.push(pagina.data);
  }

  const tramites = paginas.flat().map(compactar);
  const vistos = new Set();
  const unicos = tramites.filter((t) => !vistos.has(t.slug) && vistos.add(t.slug));

  if (unicos.length < primera.meta.total * 0.95) {
    throw new Error(`Descarga incompleta: ${unicos.length} de ${primera.meta.total}`);
  }

  await mkdir(dirname(DESTINO), { recursive: true });
  await writeFile(
    DESTINO,
    JSON.stringify({ generado: new Date().toISOString(), total: unicos.length, tramites: unicos }),
  );
  const segundos = ((Date.now() - t0) / 1000).toFixed(1);
  console.log(`✔ Copia del catálogo para la IA: ${unicos.length} trámites en ${segundos} s → public/ia/catalogo.json`);
}

main().catch((e) => {
  // No frena el despliegue: el Worker usa la copia anterior o, sin copia,
  // busca directo en la API.
  console.warn(`⚠ No se pudo actualizar la copia del catálogo para la IA: ${e.message}`);
  console.warn('  Se despliega con la copia anterior (si hay una).');
});
