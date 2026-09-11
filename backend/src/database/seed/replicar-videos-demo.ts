/**
 * DEMO: copia los 4 videos de "descripcion" y los 4 de "pasos" (LENSEGUA) ya
 * cargados a mano, de forma ALEATORIA, a TODOS los tramites que todavia no
 * tienen ese tipo de video. Es para que la demo se vea con accesibilidad en
 * todo el catalogo; el contenido real de cada video sigue siendo el de esos
 * 4 tramites originales (no hay video real por tramite).
 *
 * Se marca en `descripcion` con un prefijo `[DEMO]` para poder identificarlos
 * y quitarlos facil despues, sin tocar los 4 videos reales originales.
 *
 *   npm run replicar:videos-demo         (local)
 *   npm run replicar:videos-demo:prod    (Render / CI)
 *   npm run quitar:videos-demo           (borra solo los marcados [DEMO])
 */
import 'reflect-metadata';
import { AppDataSource } from '../data-source.js';
import { EstadoContenido, TipoVideoSenas } from '../entities/enums.js';

const MARCA_DEMO = '[DEMO]';
const LOTE = 300;

// Los 4 de cada tipo que se cargaron a mano (fuente de verdad: se leen de la
// BD, estos son solo los que ya existen sin la marca [DEMO]).
async function main(): Promise<void> {
  const ds = await AppDataSource.initialize();
  try {
    const originales: {
      tipo: TipoVideoSenas;
      url_video: string;
      url_miniatura: string | null;
    }[] = await ds.query(`
      SELECT tipo, url_video, url_miniatura
      FROM tramites_videos_senas
      WHERE descripcion IS NULL OR descripcion NOT LIKE '${MARCA_DEMO}%'
    `);
    // Cloudinary transcodea al pedir .mp4, mas compatible que .mov
    for (const o of originales) {
      o.url_video = o.url_video.replace(/\.mov$/i, '.mp4');
    }
    const porTipo: Record<string, typeof originales> = {
      descripcion: originales.filter((o) => o.tipo === TipoVideoSenas.DESCRIPCION),
      pasos: originales.filter((o) => o.tipo === TipoVideoSenas.PASOS),
    };
    console.log(
      `Pool de videos reales: ${porTipo.descripcion.length} descripcion, ${porTipo.pasos.length} pasos`,
    );
    if (!porTipo.descripcion.length || !porTipo.pasos.length) {
      throw new Error(
        'Hace falta al menos 1 video real de cada tipo (descripcion y pasos) antes de replicar.',
      );
    }

    const tramites: { id: string; nombre: string }[] = await ds.query(
      'SELECT id, nombre FROM tramites',
    );
    const yaTienen: { tramite_id: string; tipo: TipoVideoSenas }[] =
      await ds.query('SELECT tramite_id, tipo FROM tramites_videos_senas');
    const set = new Set(yaTienen.map((v) => `${v.tramite_id}::${v.tipo}`));

    const aleatorio = <T>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];

    const filas: Record<string, unknown>[] = [];
    for (const t of tramites) {
      for (const tipo of [
        TipoVideoSenas.DESCRIPCION,
        TipoVideoSenas.PASOS,
      ] as const) {
        if (set.has(`${t.id}::${tipo}`)) continue; // ya tiene uno real, no tocar
        const origen = aleatorio(porTipo[tipo]);
        filas.push({
          tramite_id: t.id,
          tipo,
          lengua_senas: 'LENSEGUA',
          titulo:
            tipo === TipoVideoSenas.DESCRIPCION
              ? `Descripción de ${t.nombre} (LENSEGUA)`
              : `Pasos para ${t.nombre} (LENSEGUA)`,
          descripcion: `${MARCA_DEMO} Video de ejemplo para la demo (no es el video real de este tramite todavia).`,
          url_video: origen.url_video,
          url_miniatura: origen.url_miniatura,
          estado: EstadoContenido.PUBLICADO,
        });
      }
    }

    console.log(`Insertando ${filas.length} videos de demo...`);
    let hechos = 0;
    for (let i = 0; i < filas.length; i += LOTE) {
      const lote = filas.slice(i, i + LOTE);
      const valores: unknown[] = [];
      const placeholders = lote
        .map((f, idx) => {
          const b = idx * 8;
          valores.push(
            f.tramite_id,
            f.tipo,
            f.lengua_senas,
            f.titulo,
            f.descripcion,
            f.url_video,
            f.url_miniatura,
            f.estado,
          );
          return `(gen_random_uuid(), now(), now(), $${b + 1}, $${b + 2}, $${b + 3}, $${b + 4}, $${b + 5}, $${b + 6}, $${b + 7}, $${b + 8})`;
        })
        .join(',');
      await ds.query(
        `INSERT INTO tramites_videos_senas
           (id, fecha_creacion, fecha_actualizacion, tramite_id, tipo, lengua_senas, titulo, descripcion, url_video, url_miniatura, estado)
         VALUES ${placeholders}`,
        valores,
      );
      hechos += lote.length;
      process.stdout.write(`\r  ${hechos}/${filas.length}`);
    }
    process.stdout.write('\n');

    const totales = await ds.query(`
      SELECT
        count(*) FILTER (WHERE descripcion LIKE '${MARCA_DEMO}%')::int demo,
        count(*) FILTER (WHERE descripcion IS NULL OR descripcion NOT LIKE '${MARCA_DEMO}%')::int reales,
        count(*)::int total
      FROM tramites_videos_senas
    `);
    console.log('Listo.', totales[0]);
  } finally {
    await ds.destroy();
  }
}

main().catch((error) => {
  console.error('\nFallo la replicacion de videos demo:', error);
  process.exitCode = 1;
});
