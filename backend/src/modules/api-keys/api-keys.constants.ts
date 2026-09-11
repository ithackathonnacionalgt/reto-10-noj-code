/** Header por el que se envia la API key (CLAUDE.md 17). Convencion unica. */
export const HEADER_API_KEY = 'x-api-key';

/** Prefijo de toda API key emitida por la plataforma. */
export const PREFIJO_LLAVE = 'pnt_';

/** Limite de peticiones por minuto por API key (CLAUDE.md 17). */
export const LIMITE_TASA_DEFECTO = 120;
export const VENTANA_TASA_MS = 60_000;

/** Duracion maxima configurable de una API key. */
export const EXPIRACION_MAX_DIAS = 365;

/**
 * Scopes que puede tener una API key (CLAUDE.md 18).
 * Nunca se entregan permisos de escritura por defecto.
 */
export const SCOPES_DISPONIBLES = [
  'procedures:read',
  'institutions:read',
  'categories:read',
  'translations:read',
  'accessibility:read',
  'statistics:read',
  'submissions:write',
] as const;

export type ScopeApi = (typeof SCOPES_DISPONIBLES)[number];

/** Scopes que se asignan si el desarrollador no especifica ninguno. */
export const SCOPES_POR_DEFECTO: ScopeApi[] = [
  'procedures:read',
  'institutions:read',
  'categories:read',
  'translations:read',
  'accessibility:read',
  'statistics:read',
];

export const DESCRIPCION_SCOPES: Record<ScopeApi, string> = {
  'procedures:read': 'Leer el catalogo de tramites y su detalle',
  'institutions:read': 'Leer instituciones',
  'categories:read': 'Leer categorias',
  'translations:read': 'Leer traducciones publicadas',
  'accessibility:read': 'Leer recursos de accesibilidad (LENSEGUA, etc.)',
  'statistics:read': 'Leer estadisticas agregadas del catalogo',
  'submissions:write': 'Crear solicitudes en nombre de un ciudadano',
};

/** Claves de metadata para los decoradores de la guard de API key. */
export const METADATA_SCOPES_REQUERIDOS = 'apikey:scopes';
