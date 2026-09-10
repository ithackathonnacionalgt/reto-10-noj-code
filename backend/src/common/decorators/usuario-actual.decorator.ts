import { createParamDecorator, type ExecutionContext } from '@nestjs/common';
import type { UsuarioAutenticado } from '../interfaces/usuario-autenticado.interface.js';

/**
 * Inyecta el usuario autenticado (o una de sus propiedades) en el controlador.
 * Ejemplo: metodo(@UsuarioActual() usuario: UsuarioAutenticado)
 */
export const UsuarioActual = createParamDecorator(
  (
    dato: keyof UsuarioAutenticado | undefined,
    ctx: ExecutionContext,
  ): UsuarioAutenticado | UsuarioAutenticado[keyof UsuarioAutenticado] => {
    const request = ctx
      .switchToHttp()
      .getRequest<{ user: UsuarioAutenticado }>();
    return dato ? request.user[dato] : request.user;
  },
);
