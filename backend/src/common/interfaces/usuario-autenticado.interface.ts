/** Contenido del token de acceso JWT. */
export interface PayloadJwt {
  /** id del usuario. */
  sub: string;
  email: string;
  /** id de la sesion, para poder revocarla. */
  sid: string;
  /** claves de los roles del usuario. */
  roles: string[];
  /** claves de los permisos efectivos del usuario. */
  permisos: string[];
}

/** Usuario autenticado que se adjunta a `request.user`. */
export interface UsuarioAutenticado {
  id: string;
  email: string;
  sesionId: string;
  roles: string[];
  permisos: string[];
}
