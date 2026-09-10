import { Injectable, type ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthGuard } from '@nestjs/passport';
import {
  ESTRATEGIA_JWT,
  METADATA_PUBLICO,
} from '../../modules/auth/auth.constants.js';

/**
 * Guard global de autenticacion. Exige un token de acceso valido salvo en los
 * endpoints marcados con @Publico().
 */
@Injectable()
export class JwtAuthGuard extends AuthGuard(ESTRATEGIA_JWT) {
  constructor(private readonly reflector: Reflector) {
    super();
  }

  override canActivate(context: ExecutionContext) {
    const esPublico = this.reflector.getAllAndOverride<boolean>(
      METADATA_PUBLICO,
      [context.getHandler(), context.getClass()],
    );
    if (esPublico) {
      return true;
    }
    return super.canActivate(context);
  }
}
