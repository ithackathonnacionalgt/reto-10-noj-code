import type { DataSourceOptions } from 'typeorm';
import { entidades } from '../database/entities/index.js';

interface Opciones {
  /** true para la conexion de migraciones (usa DB_DIRECT_* si existen). */
  directo?: boolean;
  /** true para incluir la ruta de migraciones (solo la CLI de TypeORM). */
  migraciones?: boolean;
}

/**
 * Arma las opciones de conexion de TypeORM a partir de variables de entorno.
 *
 * Prioridad:
 *   1. Credenciales sueltas: DB_HOST, DB_PORT, DB_USER, DB_PASSWORD, DB_NAME
 *      (para migraciones se usan DB_DIRECT_* si estan definidas).
 *   2. Cadena unica: DATABASE_URL (runtime) / DIRECT_URL (migraciones).
 *
 * Supabase exige SSL: por defecto va activado (DB_SSL=false para desactivarlo).
 */
export function opcionesTypeorm(opts: Opciones = {}): DataSourceOptions {
  const env = process.env;
  const leer = (sufijo: string): string | undefined => {
    if (opts.directo && env[`DB_DIRECT_${sufijo}`]) {
      return env[`DB_DIRECT_${sufijo}`];
    }
    return env[`DB_${sufijo}`];
  };

  const sslActivo = (leer('SSL') ?? 'true') !== 'false';
  const ssl = sslActivo ? { rejectUnauthorized: false } : false;
  const logging = env.TYPEORM_LOGGING === 'true';

  const host = leer('HOST');
  const conexion = host
    ? {
        host,
        port: Number.parseInt(leer('PORT') ?? '5432', 10),
        username: leer('USER') ?? leer('USERNAME'),
        password: leer('PASSWORD'),
        database: leer('NAME') ?? leer('DATABASE') ?? 'postgres',
      }
    : {
        url: opts.directo
          ? (env.DIRECT_URL ?? env.DATABASE_URL)
          : (env.DATABASE_URL ?? env.DIRECT_URL),
      };

  return {
    type: 'postgres',
    ...conexion,
    ssl,
    logging,
    synchronize: false,
    entities: [...entidades],
    migrations: opts.migraciones ? ['src/database/migrations/*.{ts,js}'] : [],
  } as DataSourceOptions;
}
