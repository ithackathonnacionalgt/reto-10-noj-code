import {
  Injectable,
  type CallHandler,
  type ExecutionContext,
  type NestInterceptor,
} from '@nestjs/common';
import { map, type Observable } from 'rxjs';

/**
 * Envuelve toda respuesta en `{ data: ... }` salvo que ya venga paginada
 * (`{ data, meta }`) o sea vacia (respuestas 204) (CLAUDE.md 39).
 */
@Injectable()
export class TransformarRespuestaInterceptor implements NestInterceptor {
  intercept(
    _context: ExecutionContext,
    next: CallHandler,
  ): Observable<unknown> {
    return next.handle().pipe(
      map((resultado) => {
        if (resultado === undefined || resultado === null) {
          return resultado;
        }
        if (
          typeof resultado === 'object' &&
          resultado !== null &&
          'data' in resultado &&
          'meta' in resultado
        ) {
          return resultado;
        }
        return { data: resultado };
      }),
    );
  }
}
