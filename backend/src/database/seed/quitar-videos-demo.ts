/**
 * Borra los videos LENSEGUA marcados como demo (ver replicar-videos-demo.ts).
 * No toca los videos reales cargados a mano.
 *
 *   npm run quitar:videos-demo        (local)
 *   npm run quitar:videos-demo:prod   (Render / CI)
 */
import 'reflect-metadata';
import { AppDataSource } from '../data-source.js';

async function main(): Promise<void> {
  const ds = await AppDataSource.initialize();
  try {
    const res = await ds.query(
      `DELETE FROM tramites_videos_senas WHERE descripcion LIKE '[DEMO]%'`,
    );
    console.log('Videos de demo eliminados:', res[1] ?? res);
  } finally {
    await ds.destroy();
  }
}

main().catch((error) => {
  console.error('Fallo:', error);
  process.exitCode = 1;
});
