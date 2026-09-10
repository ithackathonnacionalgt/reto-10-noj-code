import { SetMetadata } from '@nestjs/common';
import {
  METADATA_PERMISOS,
  METADATA_ROLES,
} from '../../modules/auth/auth.constants.js';

/**
 * Exige que el usuario tenga TODOS los permisos indicados (CLAUDE.md 18).
 * Ejemplo: @Permisos('procedures:write').
 */
export const Permisos = (...permisos: string[]) =>
  SetMetadata(METADATA_PERMISOS, permisos);

/**
 * Exige que el usuario tenga AL MENOS UNO de los roles indicados.
 * Ejemplo: @Roles(ROLES.ADMIN_NACIONAL, ROLES.SUPER_ADMIN).
 */
export const Roles = (...roles: string[]) => SetMetadata(METADATA_ROLES, roles);
