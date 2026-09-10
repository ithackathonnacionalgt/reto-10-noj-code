import {
  Catch,
  HttpException,
  HttpStatus,
  Logger,
  type ArgumentsHost,
  type ExceptionFilter,
} from '@nestjs/common';
import type { Request, Response } from 'express';

/**
 * Formato de error estandar (CLAUDE.md 39):
 * { error: { code, message, requestId } }
 */
@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger('HttpExceptionFilter');

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request & { requestId?: string }>();
    const requestId = request.requestId ?? null;

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let code = 'INTERNAL_ERROR';
    let message = 'Ocurrio un error inesperado';

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const cuerpo = exception.getResponse();
      code = this.codigoPorEstado(status);
      if (typeof cuerpo === 'string') {
        message = cuerpo;
      } else if (typeof cuerpo === 'object' && cuerpo !== null) {
        const obj = cuerpo as Record<string, unknown>;
        const msg = obj.message;
        message = Array.isArray(msg)
          ? msg.join('; ')
          : typeof msg === 'string'
            ? msg
            : exception.message;
        if (typeof obj.code === 'string') {
          code = obj.code;
        }
      }
    } else if (exception instanceof Error) {
      message = exception.message;
    }

    if (status >= 500) {
      this.logger.error(
        `[${requestId}] ${request.method} ${request.url} -> ${status}`,
        exception instanceof Error ? exception.stack : String(exception),
      );
    }

    response.status(status).json({
      error: { code, message, requestId },
    });
  }

  private codigoPorEstado(status: number): string {
    const mapa: Record<number, string> = {
      400: 'BAD_REQUEST',
      401: 'UNAUTHORIZED',
      403: 'FORBIDDEN',
      404: 'NOT_FOUND',
      409: 'CONFLICT',
      422: 'UNPROCESSABLE_ENTITY',
      429: 'TOO_MANY_REQUESTS',
    };
    return mapa[status] ?? `HTTP_${status}`;
  }
}
