/**
 * Importa/actualiza `tramites-extraidos.json` (RENAP, SAT, UDEVIPO,
 * Contraloria, etc.) de forma idempotente:
 *   1. limpia duplicados previos de la BD (misma institucion + mismo nombre
 *      normalizado -> se queda el que tenga mas datos; NUNCA borra uno que
 *      tenga videos LENSEGUA asociados);
 *   2. por cada tramite del JSON: si `codigo = EXT-<id>` ya existe, lo
 *      ACTUALIZA en el mismo registro (nunca lo borra ni recrea, para no
 *      perder videos/relaciones); si no existe, lo crea (saltando si ya hay
 *      un tramite con ese nombre en esa institucion, o si coincide con uno
 *      del catalogo oficial);
 *   3. dedup entre instituciones: si un EXT-* coincide con un CAT-* oficial,
 *      gana el oficial (salvo que el EXT-* tenga videos asociados).
 *
 *   npm run import:extraidos          (local)
 *   npm run import:extraidos:prod     (Render / CI)
 *
 * Los "pasos" de esta fuente son PLANTILLAS genericas (solo 3 variantes se
 * repiten en los ~70 tramites, no son el procedimiento real de cada uno) ->
 * NO se importan como `tramites_pasos` para no presentar un texto generico
 * como si fuera el procedimiento oficial de un tramite especifico
 * (CLAUDE.md 47). Los requisitos si son especificos por tramite y se
 * importan. `tipo_fuente = aportada_usuario` (CLAUDE.md 45).
 */
import 'reflect-metadata';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { randomBytes } from 'node:crypto';
import { AppDataSource } from '../data-source.js';
import {
  CalidadDatos,
  EstadoPublicacion,
  Modalidad,
  ModoEjecucion,
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
  TramiteRequisito,
} from '../entities/schema.js';
import { generarSlug } from '../../common/utils/slug.js';

interface ExtraidoJson {
  tramites: {
    id: string;
    institucion: string;
    tramite: string;
    descripcion: string;
    costo: string;
    requisitos: string[];
    url_mas_info: string;
    tiempo_estimado: string;
    modalidad: string;
    categoria: string;
  }[];
}

const RUTA = resolve(
  dirname(fileURLToPath(import.meta.url)),
  'tramites-extraidos.json',
);

const norm = (s: string) =>
  (s ?? '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();

/** Instituciones del JSON -> slug canonico (reusa ministerios ya cargados). */
const MINISTERIOS: Record<string, string> = {
  mspas: 'ministerio-de-salud-publica-y-asistencia-social',
  maga: 'ministerio-de-agricultura-ganaderia-y-alimentacion',
  marn: 'ministerio-de-ambiente-y-recursos-naturales',
  mineco: 'ministerio-de-economia',
  mineduc: 'ministerio-de-educacion',
  mem: 'ministerio-de-energia-y-minas',
  minfin: 'ministerio-de-finanzas-publicas',
  minex: 'ministerio-de-relaciones-exteriores',
  mcd: 'ministerio-de-cultura-y-deportes',
  mides: 'ministerio-de-desarrollo-social',
  mintrab: 'ministerio-de-trabajo-y-prevision-social',
  civ: 'ministerio-de-comunicaciones-infraestructura-y-vivienda',
};
/** Nombre "bonito" para instituciones nuevas (por sigla). */
const NOMBRE_INSTITUCION: Record<string, string> = {
  RENAP: 'Registro Nacional de las Personas',
  UDEVIPO: 'Unidad para el Desarrollo de Vivienda Popular',
  FOPAVI: 'Fondo para la Vivienda',
  SAT: 'Superintendencia de Administracion Tributaria',
  DIGECAM: 'Direccion General de Control de Armas y Municiones',
  INSIVUMEH:
    'Instituto Nacional de Sismologia, Vulcanologia, Meteorologia e Hidrologia',
  PNC: 'Policia Nacional Civil',
  OJ: 'Organismo Judicial',
  DGT: 'Direccion General de Transportes',
  UNCOSU: 'Unidad Nacional de Consultas',
  DGRTN: 'Direccion General de Radiodifusion y Television Nacional',
};

/** Categorias fragmentadas del JSON -> slug canonico. */
const CAT_MAP: Record<string, string> = {
  'identificacion y registro civil': 'inscripciones-y-registros',
  'certificados registrales': 'inscripciones-y-registros',
  'registro profesional': 'inscripciones-y-registros',
  'registro mercantil y comercio': 'inscripciones-y-registros',
  'registro de armas': 'inscripciones-y-registros',
  'registro fiscal de vehiculos': 'inscripciones-y-registros',
  'validacion publica': 'inscripciones-y-registros',
  'expediente escolar': 'inscripciones-y-registros',
  'vivienda popular': 'vivienda',
  'vivienda y subsidios': 'vivienda',
  'mejoramiento habitacional': 'vivienda',
  'emergencia y vulnerabilidad': 'vivienda',
  'programas sociales y subsidios': 'programas-sociales',
  'asistencia alimentaria': 'programas-sociales',
  'becas y educacion': 'educacion-cultura-y-deporte',
  'becas y empleabilidad': 'trabajo',
  'educacion y formacion': 'educacion-cultura-y-deporte',
  'educacion y titulos': 'educacion-cultura-y-deporte',
  'educacion internacional': 'educacion-cultura-y-deporte',
  'patrimonio cultural': 'educacion-cultura-y-deporte',
  'turismo y cultura': 'educacion-cultura-y-deporte',
  'cultura y cinematografia': 'educacion-cultura-y-deporte',
  'cultura y memoria historica': 'educacion-cultura-y-deporte',
  'telecomunicaciones y medios': 'comunicaciones-y-transporte',
  'radiodifusion y comunicacion': 'comunicaciones-y-transporte',
  'servicios postales': 'comunicaciones-y-transporte',
  'informacion postal': 'comunicaciones-y-transporte',
  'infraestructura y vialidad': 'comunicaciones-y-transporte',
  'infraestructura vial': 'comunicaciones-y-transporte',
  'obras publicas': 'comunicaciones-y-transporte',
  'transporte publico extraurbano': 'comunicaciones-y-transporte',
  'regulacion de transporte': 'comunicaciones-y-transporte',
  'permisos temporales de transporte': 'comunicaciones-y-transporte',
  'salud y seguridad alimentaria': 'salud',
  'salud y bienestar': 'salud',
  'regulacion sanitaria': 'salud',
  'control farmaceutico': 'salud',
  'salud internacional': 'salud',
  'tributos e impuestos': 'economia',
  'registro fiscal de vehiculos ': 'economia',
  'vehiculos e impuestos': 'economia',
  'facturacion y contabilidad': 'economia',
  'finanzas publicas': 'economia',
  'tesoreria nacional': 'economia',
  'contrataciones del estado': 'economia',
  'desarrollo empresarial': 'economia',
  'transparencia y gestion publica': 'transparencia-y-fiscalizacion',
  'probidad y fiscalizacion': 'transparencia-y-fiscalizacion',
  'seguridad y justicia': 'seguridad',
  'control de armas y seguridad': 'seguridad',
  'proteccion humanitaria': 'seguridad',
  'energia e hidrocarburos': 'energia',
  'sector electrico': 'energia',
  mineria: 'energia',
  'sanidad agropecuaria': 'manejo-de-animales-y-vegetales',
  'comercio agricola y exportaciones': 'manejo-de-animales-y-vegetales',
  'insumos agricolas': 'manejo-de-animales-y-vegetales',
  'medio ambiente y recursos naturales': 'medio-ambiente',
  'evaluacion ambiental': 'medio-ambiente',
  'ciencia e informacion meteorologica': 'medio-ambiente',
  'hidrologia y recursos hidricos': 'medio-ambiente',
  'geofisica y sismologia': 'medio-ambiente',
  'relaciones exteriores y legalizaciones': 'relaciones-exteriores',
  'servicios consulares': 'relaciones-exteriores',
  'trabajo y empleo': 'trabajo',
};
const CAT_NOMBRE: Record<string, string> = {
  vivienda: 'Vivienda',
  'programas-sociales': 'Programas Sociales y Subsidios',
  'transparencia-y-fiscalizacion': 'Transparencia y Fiscalizacion',
  'relaciones-exteriores': 'Relaciones Exteriores',
};

function siglasDe(inst: string): string {
  const m = inst.match(/\(([^)]+)\)/);
  if (m) return m[1].trim().toUpperCase();
  const soloMayus = inst.replace(/[^A-ZÁÉÍÓÚÑ]/g, '');
  return soloMayus.length >= 2 && soloMayus.length <= 10
    ? soloMayus
    : inst.slice(0, 10).toUpperCase();
}

function parsearCosto(txt: string): {
  tipoCosto: TipoCosto;
  costo: number | null;
  moneda: string;
} {
  const t = (txt ?? '').toLowerCase();
  if (/gratu|sin costo|no tiene costo|^0/.test(t) && !/\d\d/.test(t)) {
    return { tipoCosto: TipoCosto.GRATUITO, costo: 0, moneda: 'GTQ' };
  }
  if (/variable|seg[uú]n|depende|var[ií]a|aproximad/.test(t)) {
    return { tipoCosto: TipoCosto.VARIABLE, costo: null, moneda: 'GTQ' };
  }
  const m = t.match(/(?:q\.?|gtq|\$|usd)\s*([\d,]+(?:\.\d+)?)/);
  if (m) {
    const val = Number.parseFloat(m[1].replace(/,/g, ''));
    const moneda = /\$|usd/.test(t) ? 'USD' : 'GTQ';
    if (Number.isFinite(val)) {
      return {
        tipoCosto: val === 0 ? TipoCosto.GRATUITO : TipoCosto.FIJO,
        costo: val,
        moneda,
      };
    }
  }
  return { tipoCosto: TipoCosto.DESCONOCIDO, costo: null, moneda: 'GTQ' };
}

function parsearTiempo(txt: string) {
  const texto = (txt ?? '').trim().slice(0, 200) || null;
  if (!texto || /\ba\b|–|—|entre/.test(texto)) {
    return { valor: null, unidad: null as UnidadTiempo | null, texto };
  }
  const m = texto.match(/(\d+)\s*(minuto|hora|d[ií]a|semana|mes)/i);
  if (!m) return { valor: null, unidad: null, texto };
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
  return { valor: Number.parseInt(m[1], 10), unidad, texto };
}

const RUIDO =
  /^((?:por favor,?\s*prepara tu\s*|aseg[uú]rate de contar con:?\s*|necesitar[aá]s presentar el siguiente requisito:?\s*|es importante\s*|deber[aá]s\s*|ten en cuenta\s*)+)/i;

function limpiarRequisito(r: string): string {
  let x = r.replace(/\s+/g, ' ').trim();
  for (let i = 0; i < 4; i += 1) x = x.replace(RUIDO, '');
  x = x.replace(/\.+$/, '.').trim();
  return x.charAt(0).toUpperCase() + x.slice(1);
}

function parsearModalidad(txt: string): Modalidad | null {
  const t = (txt ?? '').toLowerCase();
  const linea = /l[ií]nea|online|virtual|digital/.test(t);
  const pres = /presencial/.test(t);
  if (linea && pres) return Modalidad.MIXTO;
  if (linea) return Modalidad.EN_LINEA;
  if (pres) return Modalidad.PRESENCIAL;
  return null;
}

async function main(): Promise<void> {
  const data: ExtraidoJson = JSON.parse(readFileSync(RUTA, 'utf-8'));
  const ds = await AppDataSource.initialize();
  const repoTr = ds.getRepository(Tramite);
  const repoInst = ds.getRepository(Institucion);
  const repoCat = ds.getRepository(Categoria);
  const repoTrCat = ds.getRepository(TramiteCategoria);
  const repoReq = ds.getRepository(TramiteRequisito);

  try {
    const conVideos = new Set<string>(
      (
        await ds.query('SELECT DISTINCT tramite_id FROM tramites_videos_senas')
      ).map((r: { tramite_id: string }) => r.tramite_id),
    );

    // ---- 1. Limpiar duplicados previos de la BD -------------------------
    // Nunca borra un tramite que tenga videos LENSEGUA asociados.
    const todos: {
      id: string;
      nombre: string;
      codigo: string | null;
      institucion_id: string;
      hijos: number;
    }[] = await ds.query(`
      SELECT t.id, t.nombre, t.codigo, t.institucion_id,
        (SELECT count(*) FROM tramites_requisitos r WHERE r.tramite_id = t.id) +
        (SELECT count(*) FROM tramites_pasos p WHERE p.tramite_id = t.id) AS hijos
      FROM tramites t
    `);
    const grupos = new Map<string, typeof todos>();
    for (const t of todos) {
      const k = `${t.institucion_id}::${norm(t.nombre)}`;
      const g = grupos.get(k) ?? [];
      g.push(t);
      grupos.set(k, g);
    }
    let borrados = 0;
    for (const g of grupos.values()) {
      if (g.length < 2) continue;
      g.sort(
        (a, b) =>
          Number(conVideos.has(b.id)) - Number(conVideos.has(a.id)) ||
          Number(b.hijos) - Number(a.hijos),
      );
      for (const sobrante of g.slice(1)) {
        if (conVideos.has(sobrante.id)) {
          console.log(
            `  AVISO: se conserva "${sobrante.nombre}" (${sobrante.codigo}) aunque es duplicado, porque tiene videos LENSEGUA`,
          );
          continue;
        }
        await repoTr.delete({ id: sobrante.id });
        borrados += 1;
      }
    }
    console.log(`Duplicados previos eliminados: ${borrados}`);

    // ---- 2. Indice de lo que ya hay --------------------------------------
    const trBD: { id: string; nombre: string; institucion_id: string }[] =
      await ds.query('SELECT id, nombre, institucion_id FROM tramites');
    const porInst = new Map<string, { id: string; n: string }[]>();
    for (const t of trBD) {
      const arr = porInst.get(t.institucion_id) ?? [];
      arr.push({ id: t.id, n: norm(t.nombre) });
      porInst.set(t.institucion_id, arr);
    }
    const instPorSlug = new Map(
      (await repoInst.find()).map((x) => [x.slug, x.id]),
    );
    const catPorSlug = new Map((await repoCat.find()).map((x) => [x.slug, x.id]));
    const slugsUsados = new Set(
      (await repoTr.find({ select: { slug: true } })).map((x) => x.slug),
    );
    const publicIdsUsados = new Set(
      (await repoTr.find({ select: { publicId: true } })).map((x) => x.publicId),
    );

    const resolverInstitucion = async (raw: string): Promise<string> => {
      const sig = siglasDe(raw).toLowerCase();
      const slugMin = MINISTERIOS[sig];
      if (slugMin && instPorSlug.has(slugMin)) return instPorSlug.get(slugMin)!;
      const siglas = siglasDe(raw);
      const base = raw.replace(/\s*\([^)]*\)\s*/g, '').trim() || siglas;
      const slug = generarSlug(base);
      if (instPorSlug.has(slug)) return instPorSlug.get(slug)!;
      const creada = await repoInst.save(
        repoInst.create({
          slug,
          nombre: NOMBRE_INSTITUCION[siglas] ?? base,
          siglas,
          estado: EstadoPublicacion.PUBLICADO,
          publicadoEn: new Date(),
        }),
      );
      instPorSlug.set(slug, creada.id);
      return creada.id;
    };

    const resolverCategoria = async (raw: string): Promise<string | null> => {
      const slug = CAT_MAP[norm(raw)] ?? generarSlug(raw);
      if (catPorSlug.has(slug)) return catPorSlug.get(slug)!;
      const creada = await repoCat.save(
        repoCat.create({
          slug,
          nombre: CAT_NOMBRE[slug] ?? raw.trim(),
          estado: EstadoPublicacion.PUBLICADO,
        }),
      );
      catPorSlug.set(slug, creada.id);
      return creada.id;
    };

    // ---- 3. Actualizar los que ya existen, crear los que no --------------
    let creados = 0;
    let actualizados = 0;
    const saltados: string[] = [];

    for (const e of data.tramites) {
      const institucionId = await resolverInstitucion(e.institucion);
      const codigo = `EXT-${e.id}`.slice(0, 60);
      const costo = parsearCosto(e.costo);
      const tiempo = parsearTiempo(e.tiempo_estimado);
      const req = (e.requisitos ?? [])
        .map(limpiarRequisito)
        .filter((r) => r.length > 5)
        .slice(0, 25);
      // No se importan "pasos": esta fuente solo trae 3 plantillas genericas
      // repetidas, no el procedimiento real de cada tramite (ver cabecera).
      const calidad = req.length > 0 ? CalidadDatos.PARCIAL : CalidadDatos.NECESITA_REVISION;
      const catId = await resolverCategoria(e.categoria);

      const existente = await repoTr.findOne({ where: { codigo } });

      if (existente) {
        existente.nombre = e.tramite.trim();
        existente.descripcionCorta =
          (e.descripcion ?? '').trim().slice(0, 500) || null;
        existente.institucionId = institucionId;
        existente.modalidad = parsearModalidad(e.modalidad);
        existente.tipoCosto = costo.tipoCosto;
        existente.costo = costo.costo;
        existente.moneda = costo.moneda;
        existente.tiempoRespuestaValor = tiempo.valor;
        existente.tiempoRespuestaUnidad = tiempo.unidad;
        existente.tiempoRespuestaTexto = tiempo.texto;
        existente.urlExterna = e.url_mas_info || null;
        existente.urlFuenteOficial = e.url_mas_info || null;
        existente.sourceUrl = e.url_mas_info || null;
        existente.importadoEn = new Date();
        existente.calidadDatos = calidad;
        await repoTr.save(existente); // UPDATE en el mismo registro: preserva id/videos

        await repoReq.delete({ tramiteId: existente.id });
        if (req.length) {
          await repoReq.save(
            req.map((r, i) => ({
              tramiteId: existente.id,
              titulo: r.slice(0, 500),
              descripcion: r.length > 500 ? r : null,
              tipo: TipoRequisito.DOCUMENTO,
              esObligatorio: true,
              orden: i,
            })),
          );
        }

        if (catId) {
          const linkExistente = await repoTrCat.findOne({
            where: { tramiteId: existente.id, esPrincipal: true },
          });
          if (!linkExistente) {
            await repoTrCat.save({
              tramiteId: existente.id,
              categoriaId: catId,
              esPrincipal: true,
            });
          } else if (linkExistente.categoriaId !== catId) {
            linkExistente.categoriaId = catId;
            await repoTrCat.save(linkExistente);
          }
        }

        actualizados += 1;
        continue;
      }

      // ---- No existe: crear, salvo que sea duplicado de otro tramite ----
      const nombreN = norm(e.tramite);
      const existentesInst = porInst.get(institucionId) ?? [];
      const dup = existentesInst.find(
        (x) =>
          x.n === nombreN ||
          (nombreN.length > 14 &&
            (x.n.includes(nombreN) || nombreN.includes(x.n))),
      );
      if (dup) {
        saltados.push(`${e.institucion} | ${e.tramite}`);
        continue;
      }

      let slug = generarSlug(e.tramite) || generarSlug(codigo);
      while (slugsUsados.has(slug)) {
        slug = `${generarSlug(e.tramite)}-${randomBytes(2).toString('hex')}`;
      }
      slugsUsados.add(slug);
      let publicId = `TR-${randomBytes(5).toString('hex').toUpperCase()}`;
      while (publicIdsUsados.has(publicId)) {
        publicId = `TR-${randomBytes(5).toString('hex').toUpperCase()}`;
      }
      publicIdsUsados.add(publicId);

      const guardado = await repoTr.save(
        repoTr.create({
          codigo,
          publicId,
          slug,
          nombre: e.tramite.trim(),
          descripcionCorta: (e.descripcion ?? '').trim().slice(0, 500) || null,
          institucionId,
          estado: EstadoPublicacion.PUBLICADO,
          publicadoEn: new Date(),
          modoEjecucion: e.url_mas_info
            ? ModoEjecucion.ENLACE_EXTERNO
            : ModoEjecucion.SOLO_INFORMACION,
          modalidad: parsearModalidad(e.modalidad),
          tipoFuente: TipoFuente.APORTADA_USUARIO,
          calidadDatos: calidad,
          tipoCosto: costo.tipoCosto,
          costo: costo.costo,
          moneda: costo.moneda,
          tiempoRespuestaValor: tiempo.valor,
          tiempoRespuestaUnidad: tiempo.unidad,
          tiempoRespuestaTexto: tiempo.texto,
          urlExterna: e.url_mas_info || null,
          urlFuenteOficial: e.url_mas_info || null,
          sourceUrl: e.url_mas_info || null,
          importadoEn: new Date(),
        } as Partial<Tramite>),
      );

      if (catId) {
        await repoTrCat.save({
          tramiteId: guardado.id,
          categoriaId: catId,
          esPrincipal: true,
        });
      }
      if (req.length) {
        await repoReq.save(
          req.map((r, i) => ({
            tramiteId: guardado.id,
            titulo: r.slice(0, 500),
            descripcion: r.length > 500 ? r : null,
            tipo: TipoRequisito.DOCUMENTO,
            esObligatorio: true,
            orden: i,
          })),
        );
      }
      (porInst.get(institucionId) ?? []).push({ id: guardado.id, n: nombreN });
      creados += 1;
    }

    // ---- 4. Dedup entre instituciones: si un EXT-* comparte nombre exacto
    //         con un CAT-* (catalogo oficial), gana el oficial. Nunca borra
    //         un EXT-* que tenga videos LENSEGUA asociados.
    const todosFinal: { id: string; nombre: string; codigo: string | null }[] =
      await ds.query('SELECT id, nombre, codigo FROM tramites');
    const porNombre = new Map<string, typeof todosFinal>();
    for (const t of todosFinal) {
      const g = porNombre.get(norm(t.nombre)) ?? [];
      g.push(t);
      porNombre.set(norm(t.nombre), g);
    }
    let borradosCruce = 0;
    for (const g of porNombre.values()) {
      if (g.length < 2) continue;
      const tieneOficial = g.some((x) => x.codigo?.startsWith('CAT-'));
      if (!tieneOficial) continue;
      for (const t of g) {
        if (t.codigo?.startsWith('EXT-')) {
          if (conVideos.has(t.id)) {
            console.log(
              `  AVISO: se conserva "${t.nombre}" (${t.codigo}) aunque duplica al catalogo oficial, porque tiene videos LENSEGUA`,
            );
            continue;
          }
          await repoTr.delete({ id: t.id });
          borradosCruce += 1;
        }
      }
    }
    console.log(
      `Extraidos que ya existian en el catalogo oficial (eliminados): ${borradosCruce}`,
    );

    // ---- 5. Verificacion final de la BD ----------------------------------
    const dupFinal: { k: string; n: number }[] = await ds.query(`
      SELECT institucion_id::text || '::' || lower(btrim(regexp_replace(
        translate(nombre,'áéíóúÁÉÍÓÚñÑ','aeiouAEIOUnN'),
        '[^a-zA-Z0-9]+',' ','g'))) k,
        count(*)::int n
      FROM tramites GROUP BY 1 HAVING count(*) > 1
    `);
    const [tot, inst, cat] = await Promise.all([
      repoTr.count(),
      repoInst.count(),
      repoCat.count(),
    ]);

    console.log('\n--- Importacion tramites-extraidos ---');
    console.log(`  creados: ${creados}`);
    console.log(`  actualizados: ${actualizados}`);
    console.log(`  saltados por duplicado: ${saltados.length}`);
    saltados.forEach((s) => console.log(`     · ${s}`));
    console.log('\n--- Estado de la BD ---');
    console.log(`  tramites: ${tot} | instituciones: ${inst} | categorias: ${cat}`);
    console.log(
      `  grupos (institucion + nombre) todavia repetidos: ${dupFinal.length}`,
    );
    dupFinal.forEach((r) => console.log(`     x${r.n}  ${r.k}`));
  } finally {
    await ds.destroy();
  }
}

main().catch((error) => {
  console.error('\nFallo la importacion:', error);
  process.exitCode = 1;
});
