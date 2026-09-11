import { Injectable, type NestMiddleware } from '@nestjs/common';
import type { NextFunction, Request, Response } from 'express';
import { HEADER_API_KEY } from './api-keys.constants.js';
import {
  ApiKeysService,
  type ContextoLlaveApi,
} from './api-keys.service.js';

const MENSAJES: Record<string, string> = {
  invalida: 'API key invalida',
  revocada: 'La API key fue revocada',
  expirada: 'La API key expiro',
};

/**
 * Si la peticion trae el header X-API-Key: lo valida, aplica el limite de tasa
 * y adjunta el contexto de la llave a `request.apiKey`. Si no lo trae, sigue
 * como peticion anonima (los endpoints publicos funcionan sin llave).
 */
@Injectable()
export class ApiKeyContextMiddleware implements NestMiddleware {
  constructor(private readonly service: ApiKeysService) {}

  async use(
    req: Request & { apiKey?: ContextoLlaveApi; requestId?: string },
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    const cabecera = req.headers[HEADER_API_KEY];
    const llave = Array.isArray(cabecera) ? cabecera[0] : cabecera;
    if (!llave) {
      next();
      return;
    }

    const resultado = await this.service.validar(llave);
    if (!resultado.ok) {
      this.responder(
        req,
        res,
        401,
        'API_KEY_INVALIDA',
        MENSAJES[resultado.motivo] ?? 'API key invalida',
      );
      return;
    }

    const tasa = this.service.consumirTasa(
      resultado.contexto.id,
      resultado.contexto.limiteTasa,
    );
    res.setHeader('X-RateLimit-Limit', String(tasa.limite));
    res.setHeader('X-RateLimit-Remaining', String(tasa.restante));
    res.setHeader('X-RateLimit-Reset', String(tasa.resetEnEpoch));

    if (!tasa.permitido) {
      const segundos = Math.max(
        1,
        tasa.resetEnEpoch - Math.floor(Date.now() / 1000),
      );
      res.setHeader('Retry-After', String(segundos));
      this.responder(
        req,
        res,
        429,
        'RATE_LIMIT_EXCEDIDO',
        'Limite de peticiones excedido para esta API key. Reintenta mas tarde.',
      );
      return;
    }

    req.apiKey = resultado.contexto;
    next();
  }

  private responder(
    req: Request & { requestId?: string },
    res: Response,
    status: number,
    code: string,
    message: string,
  ): void {
    res
      .status(status)
      .json({ error: { code, message, requestId: req.requestId ?? null } });
  }
}
