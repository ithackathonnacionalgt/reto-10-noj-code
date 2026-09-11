import {
  ForbiddenException,
  Injectable,
  UnauthorizedException,
  UseGuards,
  applyDecorators,
  createParamDecorator,
  SetMetadata,
  type CanActivate,
  type ExecutionContext,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { METADATA_SCOPES_REQUERIDOS } from './api-keys.constants.js';
import type { ContextoLlaveApi } from './api-keys.service.js';

/**
 * Exige que la peticion traiga una API key valida (ya resuelta por el
 * middleware) con TODOS los scopes indicados.
 */
@Injectable()
export class ApiKeyGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context
      .switchToHttp()
      .getRequest<{ apiKey?: ContextoLlaveApi }>();
    const apiKey = request.apiKey;

    if (!apiKey) {
      throw new UnauthorizedException(
        'Se requiere una API key valida en el header X-API-Key',
      );
    }

    const requeridos =
      this.reflector.getAllAndOverride<string[]>(METADATA_SCOPES_REQUERIDOS, [
        context.getHandler(),
        context.getClass(),
      ]) ?? [];

    const faltantes = requeridos.filter((s) => !apiKey.scopes.includes(s));
    if (faltantes.length > 0) {
      throw new ForbiddenException(
        `La API key no tiene los scopes necesarios: ${faltantes.join(', ')}`,
      );
    }
    return true;
  }
}

/** Protege un endpoint: exige API key con los scopes dados. */
export const RequiereApiKey = (...scopes: string[]) =>
  applyDecorators(
    SetMetadata(METADATA_SCOPES_REQUERIDOS, scopes),
    UseGuards(ApiKeyGuard),
  );

/** Inyecta el contexto de la API key en el controlador. */
export const LlaveApiActual = createParamDecorator(
  (_dato: unknown, ctx: ExecutionContext): ContextoLlaveApi | undefined => {
    return ctx.switchToHttp().getRequest<{ apiKey?: ContextoLlaveApi }>().apiKey;
  },
);
