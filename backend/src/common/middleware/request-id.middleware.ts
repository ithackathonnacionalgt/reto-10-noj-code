import { randomUUID } from 'node:crypto';
import { Injectable, type NestMiddleware } from '@nestjs/common';
import type { NextFunction, Request, Response } from 'express';

/** Asigna un identificador unico a cada peticion (CLAUDE.md 39). */
@Injectable()
export class RequestIdMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction): void {
    const entrante = req.headers['x-request-id'];
    const requestId =
      typeof entrante === 'string' && entrante.length > 0
        ? entrante
        : randomUUID();
    (req as Request & { requestId: string }).requestId = requestId;
    res.setHeader('x-request-id', requestId);
    next();
  }
}
