import { SetMetadata } from '@nestjs/common';
import { METADATA_PUBLICO } from '../../modules/auth/auth.constants.js';

/**
 * Marca un endpoint como publico: omite el guard de autenticacion.
 * Todo lo demas requiere token de acceso valido por defecto (CLAUDE.md 19).
 */
export const Publico = () => SetMetadata(METADATA_PUBLICO, true);
