import {
  ForbiddenException,
  Injectable,
  type CanActivate,
  type ExecutionContext,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import {
  METADATA_PERMISOS,
  METADATA_ROLES,
  ROLES,
} from '../../modules/auth/auth.constants.js';
import type { UsuarioAutenticado } from '../interfaces/usuario-autenticado.interface.js';

/**
 * Guard global de autorizacion (RBAC, CLAUDE.md 19).
 * - @Permisos(...): el usuario debe tener TODOS los permisos.
 * - @Roles(...): el usuario debe tener AL MENOS UNO de los roles.
 * El rol super_admin siempre pasa.
 */
@Injectable()
export class PermisosGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const permisosRequeridos = this.reflector.getAllAndOverride<string[]>(
      METADATA_PERMISOS,
      [context.getHandler(), context.getClass()],
    );
    const rolesRequeridos = this.reflector.getAllAndOverride<string[]>(
      METADATA_ROLES,
      [context.getHandler(), context.getClass()],
    );

    if (
      (!permisosRequeridos || permisosRequeridos.length === 0) &&
      (!rolesRequeridos || rolesRequeridos.length === 0)
    ) {
      return true;
    }

    const request = context
      .switchToHttp()
      .getRequest<{ user?: UsuarioAutenticado }>();
    const usuario = request.user;

    if (!usuario) {
      throw new ForbiddenException('Se requiere autenticacion');
    }

    if (usuario.roles.includes(ROLES.SUPER_ADMIN)) {
      return true;
    }

    if (rolesRequeridos?.length) {
      const tieneRol = rolesRequeridos.some((rol) =>
        usuario.roles.includes(rol),
      );
      if (!tieneRol) {
        throw new ForbiddenException('No cuenta con el rol necesario');
      }
    }

    if (permisosRequeridos?.length) {
      const faltantes = permisosRequeridos.filter(
        (permiso) => !usuario.permisos.includes(permiso),
      );
      if (faltantes.length > 0) {
        throw new ForbiddenException(
          `Faltan permisos: ${faltantes.join(', ')}`,
        );
      }
    }

    return true;
  }
}
