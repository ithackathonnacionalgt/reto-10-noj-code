/** Claves de metadata para los decoradores de autorizacion. */
export const METADATA_PUBLICO = 'auth:publico';
export const METADATA_PERMISOS = 'auth:permisos';
export const METADATA_ROLES = 'auth:roles';

/** Roles base del sistema (CLAUDE.md 23). Se siembran en el seed. */
export const ROLES = {
  SUPER_ADMIN: 'super_admin',
  ADMIN_NACIONAL: 'admin_nacional',
  EDITOR_INSTITUCIONAL: 'editor_institucional',
  CIUDADANO: 'ciudadano',
} as const;

export type ClaveRol = (typeof ROLES)[keyof typeof ROLES];

/** Permisos del sistema (CLAUDE.md 18). Se siembran en el seed. */
export const PERMISOS = {
  INSTITUCIONES_LEER: 'institutions:read',
  INSTITUCIONES_ESCRIBIR: 'institutions:write',
  CATEGORIAS_LEER: 'categories:read',
  CATEGORIAS_ESCRIBIR: 'categories:write',
  TRAMITES_LEER: 'procedures:read',
  TRAMITES_ESCRIBIR: 'procedures:write',
  TRAMITES_PUBLICAR: 'procedures:publish',
  TRADUCCIONES_LEER: 'translations:read',
  TRADUCCIONES_ESCRIBIR: 'translations:write',
  ACCESIBILIDAD_LEER: 'accessibility:read',
  ACCESIBILIDAD_ESCRIBIR: 'accessibility:write',
  FORMULARIOS_ESCRIBIR: 'forms:write',
  SOLICITUDES_LEER: 'submissions:read',
  SOLICITUDES_ESCRIBIR: 'submissions:write',
  USUARIOS_ADMINISTRAR: 'users:admin',
  LLAVES_API_ADMINISTRAR: 'api-keys:admin',
  AUDITORIA_LEER: 'audit:read',
} as const;

export type ClavePermiso = (typeof PERMISOS)[keyof typeof PERMISOS];

/** Nombre de la estrategia de Passport para el token de acceso. */
export const ESTRATEGIA_JWT = 'jwt';
