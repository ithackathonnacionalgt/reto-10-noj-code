/**
 * Enriquece catalogo-2023.json con los datos reales de cada pagina oficial
 * https://tramites.gob.gt/servicio/<id>/  (requisitos, pasos, normativa, costo,
 * tiempo, resultado). NO inventa nada: solo extrae lo que publica la fuente.
 *
 *   node src/database/seed/enriquecer-catalogo.mjs           # todos (reanudable)
 *   node src/database/seed/enriquecer-catalogo.mjs 2824 3838 # solo esos ids (prueba)
 *
 * Escribe catalogo-2023-enriquecido.json. Es reanudable: si el archivo ya
 * existe, salta los ids que ya trae.
 */
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const DIR = dirname(fileURLToPath(import.meta.url));
const BASE = resolve(DIR, 'catalogo-2023.json');
const OUT = resolve(DIR, 'catalogo-2023-enriquecido.json');
const CONCURRENCIA = 6;
const REINTENTOS = 3;
const UA =
  'PlataformaNacionalTramites/1.0 (importador del catalogo oficial; contacto: equipo hackathon)';

const soloIds = process.argv.slice(2);

function decodeEntities(s) {
  return s
    .replace(/&aacute;/g, 'á').replace(/&eacute;/g, 'é').replace(/&iacute;/g, 'í')
    .replace(/&oacute;/g, 'ó').replace(/&uacute;/g, 'ú').replace(/&ntilde;/g, 'ñ')
    .replace(/&Aacute;/g, 'Á').replace(/&Eacute;/g, 'É').replace(/&Iacute;/g, 'Í')
    .replace(/&Oacute;/g, 'Ó').replace(/&Uacute;/g, 'Ú').replace(/&Ntilde;/g, 'Ñ')
    .replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'").replace(/&lt;/g, '<').replace(/&gt;/g, '>')
    .replace(/&[a-z]+;/gi, ' ');
}
const limpiar = (s) => {
  // decodifica -> quita tags -> decodifica de nuevo (HTML doble-codificado) -> quita tags
  let x = decodeEntities(String(s));
  x = x.replace(/<[^>]+>/g, ' ');
  x = decodeEntities(x).replace(/<[^>]+>/g, ' ');
  return x
    .replace(/\s+/g, ' ')
    .trim()
    // marcador de lista al inicio: – — • * · , "- ", "1.", "1)"  (NO "2 dias")
    .replace(/^(?:[–—•*·]|-\s|\d+[.)])\s*/, '')
    .replace(/^[–—•*·\s]+/, '')
    .trim();
};

function seccion(html, titulos) {
  const bloques = html.split(/<h4[^>]*>/i).slice(1);
  for (const b of bloques) {
    const fin = b.indexOf('</h4>');
    const t = limpiar(b.slice(0, fin)).toLowerCase();
    if (titulos.some((x) => t.includes(x))) {
      let cuerpo = b.slice(fin + 5);
      cuerpo = cuerpo.split(/<h4[^>]*>|<footer|<div class="row footer/i)[0];
      return cuerpo;
    }
  }
  return null;
}

const TIENE_LETRA = /[a-záéíóúñ]/i;

function items(cuerpo) {
  if (!cuerpo) return [];
  let its = [...cuerpo.matchAll(/<li[^>]*>([\s\S]*?)<\/li>/gi)].map((m) => m[1]);
  if (its.length === 0) {
    its = [...cuerpo.matchAll(/<p[^>]*>([\s\S]*?)<\/p>/gi)].map((m) => m[1]);
  }
  if (its.length === 0) its = [cuerpo];
  // separar vinetas juntas dentro de un mismo bloque
  const out = [];
  for (const it of its) {
    const partes = it
      .split(/<br\s*\/?>/gi)
      .flatMap((x) => x.split(/\s*(?:–|—|•|·|▪|^\s*-\s|\r?\n\s*\d+[.)]\s)\s*/))
      .map(limpiar);
    for (const p of partes) {
      if (p && p.length > 2 && TIENE_LETRA.test(p)) out.push(p);
    }
  }
  // dedup preservando orden
  const vistos = new Set();
  return out.filter((p) => {
    const k = p.toLowerCase().slice(0, 80);
    if (vistos.has(k)) return false;
    vistos.add(k);
    return true;
  });
}

function parsear(id, html) {
  const costoM = html.match(/Costo:\s*([^<]+?)\s*<\/a>/i) || html.match(/Costo:\s*([^<\n]{1,40})/i);
  const tiempoM = html.match(/Tiempo de Respuesta:\s*([^<]+?)\s*<\/a>/i) || html.match(/Tiempo de Respuesta:\s*([^<\n]{1,60})/i);
  const provM = html.match(/Informaci[oó]n proporcionada por:\s*([^<]+)/i);

  const requisitos = items(seccion(html, ['requerimiento', 'requisito']));
  const pasos = items(seccion(html, ['pasos']));
  const normativa = limpiar(seccion(html, ['normativa', 'base legal']) || '') || null;

  return {
    id,
    costoTexto: costoM ? limpiar(costoM[1]) : null,
    tiempoTexto: tiempoM ? limpiar(tiempoM[1]) : null,
    proveedor: provM ? limpiar(provM[1]) : null,
    normativaTexto: normativa,
    requisitos,
    pasos,
  };
}

async function fetchServicio(id) {
  for (let intento = 1; intento <= REINTENTOS; intento += 1) {
    try {
      const res = await fetch(`https://tramites.gob.gt/servicio/${id}/`, {
        headers: { 'User-Agent': UA, Accept: 'text/html' },
        signal: AbortSignal.timeout(20000),
      });
      if (res.status === 404) return { id, noExiste: true };
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return parsear(id, await res.text());
    } catch (e) {
      if (intento === REINTENTOS) return { id, error: String(e) };
      await new Promise((r) => setTimeout(r, 400 * intento));
    }
  }
}

async function main() {
  const base = JSON.parse(readFileSync(BASE, 'utf-8'));
  const ids = (
    soloIds.length
      ? soloIds
      : base.tramites.map((t) => t.codigo.replace(/^CAT-/, ''))
  ).map(String);

  const previo = existsSync(OUT) ? JSON.parse(readFileSync(OUT, 'utf-8')) : { items: [] };
  const hechos = new Map(previo.items.map((x) => [String(x.id), x]));
  const pendientes = ids.filter((id) => !hechos.has(id));
  console.log(`${ids.length} ids | ${hechos.size} ya hechos | ${pendientes.length} pendientes`);

  let ok = 0, sinPasos = 0, errores = 0, i = 0;
  for (let c = 0; c < pendientes.length; c += CONCURRENCIA) {
    const lote = pendientes.slice(c, c + CONCURRENCIA);
    const res = await Promise.all(lote.map(fetchServicio));
    for (const r of res) {
      hechos.set(String(r.id), r);
      i += 1;
      if (r.error || r.noExiste) errores += 1;
      else {
        ok += 1;
        if (!r.pasos?.length && !r.requisitos?.length) sinPasos += 1;
      }
    }
    if (c % 60 === 0 || c + CONCURRENCIA >= pendientes.length) {
      writeFileSync(OUT, JSON.stringify({ items: [...hechos.values()] }, null, 1));
      process.stdout.write(
        `\r  ${i}/${pendientes.length}  ok=${ok} sinDatos=${sinPasos} err=${errores}`,
      );
    }
    await new Promise((r) => setTimeout(r, 120));
  }
  writeFileSync(OUT, JSON.stringify({ items: [...hechos.values()] }, null, 1));
  process.stdout.write('\n');
  console.log(`Listo. Escrito ${OUT}`);
  console.log(`  con requisitos/pasos: ${ok - sinPasos} | sin datos en la fuente: ${sinPasos} | errores: ${errores}`);
}

main().catch((e) => { console.error(e); process.exitCode = 1; });
