/**
 * Genera `tramites.etiquetas` para TODOS los tramites (CLAUDE.md 28): palabras
 * clave y sinonimos con los que la gente busca ("antecedentes policiacos",
 * "policia antecedentes", "record penal"...) aunque no sean el nombre exacto.
 *
 * No inventa datos oficiales (costos/requisitos/etc): son terminos de
 * busqueda, generados a partir de datos que ya existen (nombre, institucion,
 * categoria) + un diccionario de sinonimos del lenguaje comun de tramites.
 *
 *   npm run generar:etiquetas          (local)
 *   npm run generar:etiquetas:prod     (Render / CI)
 */
import 'reflect-metadata';
import { AppDataSource } from '../data-source.js';

const STOPWORDS = new Set([
  'de', 'del', 'la', 'el', 'los', 'las', 'en', 'y', 'o', 'u', 'e', 'a',
  'para', 'por', 'con', 'al', 'un', 'una', 'unos', 'unas', 'su', 'sus',
  'que', 'mas', 'sin', 'sobre', 'entre', 'este', 'esta', 'estos', 'estas',
  'como', 'ante', 'tramite', 'tramites', 'solicitud', 'servicio',
]);

/** Sinonimos / jerga comun de tramites gubernamentales guatemaltecos. */
const SINONIMOS: Record<string, string[]> = {
  antecedentes: ['record', 'historial', 'antecedente'],
  policiales: ['policiacos', 'policiaco', 'policial', 'pnc', 'policia'],
  policia: ['pnc', 'policial', 'policiaco', 'policiaca'],
  penales: ['penal', 'criminal', 'criminales'],
  dpi: ['documento personal de identificacion', 'cedula', 'identificacion', 'identidad'],
  identificacion: ['dpi', 'cedula', 'identidad'],
  licencia: ['permiso', 'autorizacion', 'licencias'],
  permiso: ['licencia', 'autorizacion', 'permisos'],
  autorizacion: ['permiso', 'licencia'],
  certificado: ['constancia', 'certificacion', 'certificados'],
  certificacion: ['certificado', 'constancia'],
  constancia: ['certificado', 'certificacion', 'constancias'],
  pasaporte: ['pasa porte', 'documento de viaje'],
  visa: ['visado'],
  matrimonio: ['boda', 'union', 'casamiento', 'casarse'],
  divorcio: ['separacion', 'divorciarse'],
  nacimiento: ['natal', 'nacer', 'partida de nacimiento'],
  defuncion: ['fallecimiento', 'muerte', 'defunciones'],
  vehiculo: ['carro', 'automovil', 'auto', 'moto', 'motocicleta', 'vehiculos'],
  vehicular: ['vehiculo', 'automotor'],
  transito: ['transporte', 'vial', 'trafico'],
  transporte: ['transito', 'vial'],
  matricula: ['placa', 'placas', 'matriculas'],
  impuestos: ['tributos', 'iva', 'isr', 'impuesto'],
  tributos: ['impuestos', 'tributario'],
  patente: ['registro mercantil', 'patentes'],
  registro: ['inscripcion', 'inscribir', 'registrar', 'registros'],
  inscripcion: ['registro', 'inscribir', 'inscripciones'],
  exportacion: ['exportar', 'exportaciones'],
  exportar: ['exportacion'],
  importacion: ['importar', 'importaciones'],
  importar: ['importacion'],
  fitosanitario: ['sanidad vegetal', 'plagas', 'fitosanitaria'],
  sanitario: ['salud', 'higiene', 'sanitaria'],
  ambiental: ['ambiente', 'ecologico', 'medioambiental'],
  laboral: ['trabajo', 'empleo'],
  trabajo: ['laboral', 'empleo', 'laboral'],
  empleo: ['trabajo', 'laboral', 'empleos'],
  pension: ['jubilacion', 'retiro', 'pensiones'],
  jubilacion: ['pension', 'retiro'],
  salud: ['sanitario', 'medico', 'clinica'],
  educacion: ['escolar', 'academico', 'educativo'],
  titulo: ['diploma', 'titulos'],
  diploma: ['titulo', 'diplomas'],
  estudios: ['academicos', 'escolares'],
  escolar: ['educativo', 'estudiantil'],
  migracion: ['migratorio', 'extranjeria', 'migrantes'],
  extranjeria: ['migracion', 'extranjero'],
  arma: ['armas', 'portacion'],
  armas: ['arma', 'portacion de armas'],
  mineria: ['minero', 'mina', 'minas'],
  electrico: ['electricidad', 'energia electrica'],
  energia: ['electrico', 'electricidad'],
  agua: ['hidrico', 'hidrologico'],
  construccion: ['obra', 'edificacion', 'obras'],
  vivienda: ['casa', 'habitacional', 'viviendas'],
  subsidio: ['ayuda', 'beneficio', 'subsidios'],
  beca: ['becas', 'ayuda economica'],
  renovacion: ['renovar', 'renovaciones'],
  cancelacion: ['cancelar', 'anular'],
  reconocimiento: ['reconocer'],
  autenticacion: ['autenticar', 'legalizar', 'legalizacion'],
  apostilla: ['legalizacion', 'apostillado'],
  consular: ['consulado', 'embajada'],
  aduanero: ['aduana', 'aduanas'],
  fiscal: ['tributario', 'hacienda'],
  ambiente: ['ambiental', 'ecologico'],
  agropecuario: ['agricola', 'agricultura', 'pecuario'],
  agricola: ['agropecuario', 'agricultura'],
  semilla: ['semillas'],
  bosque: ['forestal', 'bosques'],
  forestal: ['bosque', 'madera'],
  tarjeta: ['carnet', 'carne'],
  carnet: ['tarjeta', 'carne'],
};

const norm = (s: string) =>
  (s ?? '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9\s]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

function tokenizar(nombre: string): string[] {
  return norm(nombre)
    .split(' ')
    .filter((w) => w.length >= 3 && !STOPWORDS.has(w));
}

function generarEtiquetas(
  nombre: string,
  siglas: string | null,
  institucion: string,
  categoria: string,
): string[] {
  const etiquetas = new Set<string>();
  const palabras = tokenizar(nombre);

  for (const p of palabras) {
    etiquetas.add(p);
    for (const sin of SINONIMOS[p] ?? []) etiquetas.add(sin);
  }
  if (siglas) etiquetas.add(siglas.toLowerCase());
  for (const p of tokenizar(institucion).slice(0, 4)) etiquetas.add(p);
  for (const p of tokenizar(categoria)) etiquetas.add(p);

  return [...etiquetas].filter((e) => e.length >= 2).slice(0, 25);
}

async function main(): Promise<void> {
  const ds = await AppDataSource.initialize();
  try {
    const filas: {
      id: string;
      nombre: string;
      siglas: string | null;
      institucion: string;
      categoria: string | null;
    }[] = await ds.query(`
      SELECT t.id, t.nombre, i.siglas, i.nombre AS institucion,
        (SELECT c.nombre FROM tramites_categorias tc
         JOIN categorias c ON c.id = tc.categoria_id
         WHERE tc.tramite_id = t.id
         ORDER BY tc.es_principal DESC LIMIT 1) AS categoria
      FROM tramites t
      JOIN instituciones i ON i.id = t.institucion_id
    `);

    console.log(`Generando etiquetas para ${filas.length} tramites...`);
    let hechos = 0;
    const LOTE = 200;
    for (let i = 0; i < filas.length; i += LOTE) {
      const lote = filas.slice(i, i + LOTE);
      await Promise.all(
        lote.map((f) => {
          const etiquetas = generarEtiquetas(
            f.nombre,
            f.siglas,
            f.institucion,
            f.categoria ?? '',
          );
          return ds.query('UPDATE tramites SET etiquetas = $1 WHERE id = $2', [
            etiquetas,
            f.id,
          ]);
        }),
      );
      hechos += lote.length;
      process.stdout.write(`\r  ${hechos}/${filas.length}`);
    }
    process.stdout.write('\n');

    const stats = await ds.query(`
      SELECT round(avg(array_length(etiquetas,1)))::int prom,
             max(array_length(etiquetas,1))::int maximo,
             min(array_length(etiquetas,1))::int minimo
      FROM tramites
    `);
    console.log('Listo. Etiquetas por tramite:', stats[0]);
  } finally {
    await ds.destroy();
  }
}

main().catch((error) => {
  console.error('\nFallo la generacion de etiquetas:', error);
  process.exitCode = 1;
});
