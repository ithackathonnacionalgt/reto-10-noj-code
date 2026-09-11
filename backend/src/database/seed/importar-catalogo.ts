/**
 * Importa el Catalogo Nacional de Tramites (export "al 15 dic 2023") a la BD y,
 * si existe `catalogo-2023-enriquecido.json`, agrega los requisitos, pasos,
 * normativa, costo y tiempo REALES extraidos de cada pagina oficial
 * (https://tramites.gob.gt/servicio/<id>/). Nada se inventa (CLAUDE.md 47).
 *
 *   npm run import:catalogo          (local, lee backend/.env)
 *   npm run import:catalogo:prod     (Render / CI, lee process.env)
 *
 * Idempotente:
 *   - tramite nuevo  -> se crea con todos sus datos.
 *   - tramite ya existente sin requisitos ni pasos -> se le hace "backfill"
 *     (requisitos, pasos, normativa, costo, tiempo, calidad_datos).
 *   - tramite ya existente que YA tiene requisitos o pasos -> se deja igual.
 */
import 'reflect-metadata';
import { existsSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { randomBytes } from 'node:crypto';
import { In } from 'typeorm';
import { AppDataSource } from '../data-source.js';
import {
  CalidadDatos,
  EstadoPublicacion,
  ModoEjecucion,
  ParteResponsable,
  TipoCosto,
  TipoFuente,
  TipoRequisito,
  UnidadTiempo,
} from '../entities/enums.js';
import {
  Categoria,
  Institucion,
  Tramite,
  TramiteCategoria,
  TramiteNormativa,
  TramitePaso,
  TramiteRequisito,
} from '../entities/schema.js';
import { generarSlug } from '../../common/utils/slug.js';

interface TramiteJson {
  codigo: string;
  nombre: string;
  descripcionCorta: string | null;
  descripcion: string | null;
  institucionSlug: string;
  categoriaSlug: string;
  urlExterna: string | null;
  urlFuenteOficial: string | null;
  calidadDatos: 'parcial' | 'necesita_revision';
}
interface CatalogoJson {
  instituciones: { slug: string; nombre: string; siglas: string | null }[];
  categorias: { slug: string; nombre: string }[];
  tramites: TramiteJson[];
}
interface Enriquecido {
  id: string | number;
  costoTexto?: string | null;
  tiempoTexto?: string | null;
  normativaTexto?: string | null;
  requisitos?: string[];
  pasos?: string[];
  error?: string;
  noExiste?: boolean;
}

const DIR = dirname(fileURLToPath(import.meta.url));
const RUTA_JSON = resolve(DIR, 'catalogo-2023.json');
const RUTA_ENRIQ = resolve(DIR, 'catalogo-2023-enriquecido.json');
const LOTE = 150;
const MAX_ITEMS = 40;

const publicIdAleatorio = () =>
  `TR-${randomBytes(5).toString('hex').toUpperCase()}`;

function parsearCosto(txt?: string | null): {
  tipoCosto: TipoCosto;
  costo: number | null;
  moneda: string;
} {
  if (!txt) return { tipoCosto: TipoCosto.DESCONOCIDO, costo: null, moneda: 'GTQ' };
  const t = txt.toLowerCase().trim();
  if (
    /gratu|sin costo|no tiene costo|no aplica|^q\.?\s*0([.,]0+)?$|^\$\s*0([.,]0+)?$|^0([.,]0+)?$/.test(
      t,
    )
  ) {
    return { tipoCosto: TipoCosto.GRATUITO, costo: 0, moneda: 'GTQ' };
  }
  if (/variable|seg[uú]n|depende|var[ií]a|rango/.test(t)) {
    return { tipoCosto: TipoCosto.VARIABLE, costo: null, moneda: 'GTQ' };
  }
  const num = t.replace(/[^\d.,]/g, '').replace(/,/g, '');
  const val = num ? Number.parseFloat(num) : Number.NaN;
  const moneda = /\$|usd|d[oó]lar/.test(t) ? 'USD' : 'GTQ';
  if (Number.isFinite(val) && val > 0) {
    return { tipoCosto: TipoCosto.FIJO, costo: val, moneda };
  }
  if (Number.isFinite(val) && val === 0) {
    return { tipoCosto: TipoCosto.GRATUITO, costo: 0, moneda };
  }
  return { tipoCosto: TipoCosto.DESCONOCIDO, costo: null, moneda: 'GTQ' };
}

function parsearTiempo(txt?: string | null): {
  valor: number | null;
  unidad: UnidadTiempo | null;
  texto: string | null;
} {
  if (!txt) return { valor: null, unidad: null, texto: null };
  const texto = txt.trim().slice(0, 280);
  if (/\ba\b|–|—|entre|entre\s/.test(texto)) {
    return { valor: null, unidad: null, texto };
  }
  const m = texto.match(/(\d+)\s*(minuto|hora|d[ií]a|semana|mes)/i);
  if (!m) return { valor: null, unidad: null, texto };
  const n = Number.parseInt(m[1], 10);
  const u = m[2].toLowerCase();
  let unidad: UnidadTiempo;
  if (u.startsWith('minuto')) unidad = UnidadTiempo.MINUTOS;
  else if (u.startsWith('hora')) unidad = UnidadTiempo.HORAS;
  else if (u.startsWith('semana')) unidad = UnidadTiempo.SEMANAS;
  else if (u.startsWith('mes')) unidad = UnidadTiempo.MESES;
  else
    unidad = /h[aá]bil/i.test(texto)
      ? UnidadTiempo.DIAS_HABILES
      : UnidadTiempo.DIAS_CALENDARIO;
  return { valor: n, unidad, texto };
}

async function main(): Promise<void> {
  const data: CatalogoJson = JSON.parse(readFileSync(RUTA_JSON, 'utf-8'));
  const enriq = new Map<string, Enriquecido>();
  if (existsSync(RUTA_ENRIQ)) {
    for (const it of JSON.parse(readFileSync(RUTA_ENRIQ, 'utf-8'))
      .items as Enriquecido[]) {
      enriq.set(String(it.id), it);
    }
    console.log(`Enriquecimiento: ${enriq.size} paginas cargadas.`);
  } else {
    console.log('Sin catalogo-2023-enriquecido.json: se importa solo lo basico.');
  }

  const ds = await AppDataSource.initialize();
  console.log(`Importando ${data.tramites.length} tramites...`);

  try {
    // 1. Instituciones y categorias (upsert por slug, publicadas)
    const repoInst = ds.getRepository(Institucion);
    for (const i of data.instituciones) {
      if (!(await repoInst.findOne({ where: { slug: i.slug } }))) {
        await repoInst.save(
          repoInst.create({
            slug: i.slug,
            nombre: i.nombre,
            siglas: i.siglas,
            estado: EstadoPublicacion.PUBLICADO,
            publicadoEn: new Date(),
          }),
        );
      }
    }
    const instPorSlug = new Map(
      (await repoInst.find()).map((x) => [x.slug, x.id]),
    );

    const repoCat = ds.getRepository(Categoria);
    for (const c of data.categorias) {
      if (!(await repoCat.findOne({ where: { slug: c.slug } }))) {
        await repoCat.save(
          repoCat.create({
            slug: c.slug,
            nombre: c.nombre,
            estado: EstadoPublicacion.PUBLICADO,
          }),
        );
      }
    }
    const catPorSlug = new Map((await repoCat.find()).map((x) => [x.slug, x.id]));

    // 2. Estado actual de los tramites de este catalogo
    const repoTr = ds.getRepository(Tramite);
    const repoTrCat = ds.getRepository(TramiteCategoria);
    const repoReq = ds.getRepository(TramiteRequisito);
    const repoPaso = ds.getRepository(TramitePaso);
    const repoNorm = ds.getRepository(TramiteNormativa);

    const codigos = data.tramites.map((t) => t.codigo);
    const idPorCodigo = new Map(
      (
        await repoTr.find({
          where: { codigo: In(codigos) },
          select: { id: true, codigo: true },
        })
      ).map((x) => [x.codigo as string, x.id]),
    );
    const conHijos = new Set<string>([
      ...(
        await ds.query('SELECT DISTINCT tramite_id FROM tramites_requisitos')
      ).map((r: { tramite_id: string }) => r.tramite_id),
      ...(await ds.query('SELECT DISTINCT tramite_id FROM tramites_pasos')).map(
        (r: { tramite_id: string }) => r.tramite_id,
      ),
    ]);
    const slugsUsados = new Set(
      (await repoTr.find({ select: { slug: true } })).map((x) => x.slug),
    );
    const publicIdsUsados = new Set(
      (await repoTr.find({ select: { publicId: true } })).map((x) => x.publicId),
    );

    let nuevos = 0;
    let backfilled = 0;
    let conPasos = 0;

    for (let i = 0; i < data.tramites.length; i += LOTE) {
      const lote = data.tramites.slice(i, i + LOTE);
      const requisitosBatch: Partial<TramiteRequisito>[] = [];
      const pasosBatch: Partial<TramitePaso>[] = [];
      const normativasBatch: Partial<TramiteNormativa>[] = [];

      for (const t of lote) {
        const institucionId = instPorSlug.get(t.institucionSlug);
        if (!institucionId) continue;

        const idNum = t.codigo.replace(/^CAT-/, '');
        const e = enriq.get(idNum);
        const req = (e?.requisitos ?? []).filter(Boolean).slice(0, MAX_ITEMS);
        const pasos = (e?.pasos ?? []).filter(Boolean).slice(0, MAX_ITEMS);
        const costo = parsearCosto(e?.costoTexto);
        const tiempo = parsearTiempo(e?.tiempoTexto);
        const calidad =
          req.length && pasos.length
            ? CalidadDatos.COMPLETO
            : req.length || pasos.length
              ? CalidadDatos.PARCIAL
              : t.calidadDatos === 'necesita_revision'
                ? CalidadDatos.NECESITA_REVISION
                : CalidadDatos.PARCIAL;

        let tramiteId = idPorCodigo.get(t.codigo);

        if (!tramiteId) {
          let slug = generarSlug(t.nombre) || generarSlug(t.codigo);
          while (slugsUsados.has(slug)) {
            slug = `${generarSlug(t.nombre)}-${randomBytes(2).toString('hex')}`;
          }
          slugsUsados.add(slug);
          let publicId = publicIdAleatorio();
          while (publicIdsUsados.has(publicId)) publicId = publicIdAleatorio();
          publicIdsUsados.add(publicId);

          const guardado = await repoTr.save(
            repoTr.create({
              codigo: t.codigo,
              publicId,
              slug,
              nombre: t.nombre,
              descripcionCorta: t.descripcionCorta,
              descripcion: t.descripcion,
              institucionId,
              estado: EstadoPublicacion.PUBLICADO,
              publicadoEn: new Date(),
              modoEjecucion: t.urlExterna
                ? ModoEjecucion.ENLACE_EXTERNO
                : ModoEjecucion.SOLO_INFORMACION,
              tipoFuente: TipoFuente.OFICIAL,
              tipoCosto: costo.tipoCosto,
              costo: costo.costo,
              moneda: costo.moneda,
              tiempoRespuestaValor: tiempo.valor,
              tiempoRespuestaUnidad: tiempo.unidad,
              tiempoRespuestaTexto: tiempo.texto,
              calidadDatos: calidad,
              urlExterna: t.urlExterna,
              urlFuenteOficial: t.urlFuenteOficial,
              sourceUrl: t.urlExterna,
              importadoEn: new Date(),
            }),
          );
          tramiteId = guardado.id;
          const catId = catPorSlug.get(t.categoriaSlug);
          if (catId) {
            await repoTrCat.save({
              tramiteId,
              categoriaId: catId,
              esPrincipal: true,
            });
          }
          nuevos += 1;
        } else {
          // ya existe: actualiza SIEMPRE costo/tiempo/calidad desde el enriquecido
          if (e && (req.length || pasos.length || e.costoTexto || e.tiempoTexto)) {
            await repoTr.update(
              { id: tramiteId },
              {
                tipoCosto: costo.tipoCosto,
                costo: costo.costo,
                moneda: costo.moneda,
                tiempoRespuestaValor: tiempo.valor,
                tiempoRespuestaUnidad: tiempo.unidad,
                tiempoRespuestaTexto: tiempo.texto,
                calidadDatos: calidad,
              },
            );
            backfilled += 1;
          }
          // no re-insertar requisitos/pasos/normativa si ya los tiene
          if (conHijos.has(tramiteId)) continue;
        }

        for (let k = 0; k < req.length; k += 1) {
          requisitosBatch.push({
            tramiteId,
            titulo: req[k].slice(0, 500),
            descripcion: req[k].length > 500 ? req[k] : null,
            tipo: TipoRequisito.DOCUMENTO,
            esObligatorio: true,
            orden: k,
          });
        }
        for (let k = 0; k < pasos.length; k += 1) {
          pasosBatch.push({
            tramiteId,
            orden: k,
            titulo: pasos[k].slice(0, 500),
            descripcion: pasos[k].length > 500 ? pasos[k] : null,
            parteResponsable: ParteResponsable.CIUDADANO,
          });
        }
        if (e?.normativaTexto) {
          normativasBatch.push({
            tramiteId,
            titulo: 'Base legal',
            extracto: e.normativaTexto.slice(0, 4000),
            orden: 0,
          });
        }
        if (pasos.length) conPasos += 1;
      }

      if (requisitosBatch.length) await repoReq.save(requisitosBatch);
      if (pasosBatch.length) await repoPaso.save(pasosBatch);
      if (normativasBatch.length) await repoNorm.save(normativasBatch);
      process.stdout.write(
        `\r  procesados ${Math.min(i + LOTE, data.tramites.length)}/${data.tramites.length}  nuevos=${nuevos} backfill=${backfilled}`,
      );
    }
    process.stdout.write('\n');

    const [tot, comp, parc, rev] = await Promise.all([
      repoTr.count({ where: { estado: EstadoPublicacion.PUBLICADO } }),
      repoTr.count({ where: { calidadDatos: CalidadDatos.COMPLETO } }),
      repoTr.count({ where: { calidadDatos: CalidadDatos.PARCIAL } }),
      repoTr.count({ where: { calidadDatos: CalidadDatos.NECESITA_REVISION } }),
    ]);
    console.log('Importacion completada.');
    console.log(`  tramites nuevos:        ${nuevos}`);
    console.log(`  tramites enriquecidos:  ${backfilled}`);
    console.log(`  con pasos (esta corrida): ${conPasos}`);
    console.log(
      `  publicados: ${tot}  |  completo: ${comp}  parcial: ${parc}  necesita_revision: ${rev}`,
    );
  } finally {
    await ds.destroy();
  }
}

main().catch((error) => {
  console.error('\nFallo la importacion:', error);
  process.exitCode = 1;
});
