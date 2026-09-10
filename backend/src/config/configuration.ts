/**
 * Configuracion tipada leida desde variables de entorno (CLAUDE.md 48).
 * Ningun secreto se define en codigo; solo se leen desde el entorno.
 */
export interface ConfiguracionApp {
  entorno: string;
  puerto: number;
  baseDatos: {
    host: string | undefined;
    port: number | undefined;
    usuario: string | undefined;
    nombre: string | undefined;
    url: string | undefined;
    urlDirecta: string | undefined;
    ssl: boolean;
    logging: boolean;
  };
  jwt: {
    secreto: string | undefined;
    expiraAcceso: string;
    expiraRefresh: string;
  };
  apiKeys: {
    pepper: string | undefined;
  };
  cors: {
    origenes: string[];
  };
  storage: {
    bucketTramites: string;
    bucketSolicitudes: string;
    bucketInstituciones: string;
    bucketVideos: string;
  };
}

export const configuration = (): ConfiguracionApp => ({
  entorno: process.env.NODE_ENV ?? 'development',
  puerto: Number.parseInt(process.env.PORT ?? '3000', 10),
  baseDatos: {
    host: process.env.DB_HOST,
    port: process.env.DB_PORT
      ? Number.parseInt(process.env.DB_PORT, 10)
      : undefined,
    usuario: process.env.DB_USER,
    nombre: process.env.DB_NAME,
    url: process.env.DATABASE_URL,
    urlDirecta: process.env.DIRECT_URL,
    ssl: (process.env.DB_SSL ?? 'true') !== 'false',
    logging: process.env.TYPEORM_LOGGING === 'true',
  },
  jwt: {
    secreto: process.env.JWT_SECRET,
    expiraAcceso: process.env.JWT_ACCESS_EXPIRES_IN ?? '15m',
    expiraRefresh: process.env.JWT_REFRESH_EXPIRES_IN ?? '7d',
  },
  apiKeys: {
    pepper: process.env.API_KEY_PEPPER,
  },
  cors: {
    origenes: (process.env.CORS_ORIGINS ?? '')
      .split(',')
      .map((origen) => origen.trim())
      .filter(Boolean),
  },
  storage: {
    bucketTramites: process.env.STORAGE_BUCKET_PROCEDURES ?? 'procedure-assets',
    bucketSolicitudes:
      process.env.STORAGE_BUCKET_SUBMISSIONS ?? 'submission-files',
    bucketInstituciones:
      process.env.STORAGE_BUCKET_INSTITUTIONS ?? 'institution-assets',
    bucketVideos: process.env.STORAGE_BUCKET_VIDEOS ?? 'accessibility-videos',
  },
});
