import { HttpErrorResponse, type HttpInterceptorFn } from '@angular/common/http';
import { catchError, throwError } from 'rxjs';

/** Error ya traducido a algo que se le puede mostrar a una persona. */
export class ErrorApi extends Error {
  constructor(
    mensaje: string,
    readonly status: number,
  ) {
    super(mensaje);
    this.name = 'ErrorApi';
  }
}

/** Forma del cuerpo de error que devuelve el filtro de excepciones del backend. */
interface CuerpoError {
  error?: { message?: string };
}

/**
 * Traduce cualquier fallo HTTP a un `ErrorApi` con mensaje en español.
 *
 * Centralizarlo aca evita que cada componente reinvente el manejo de errores y
 * garantiza que nunca se filtre un stack trace crudo a la interfaz.
 */
export const errorApiInterceptor: HttpInterceptorFn = (req, next) =>
  next(req).pipe(
    catchError((e: unknown) => {
      if (!(e instanceof HttpErrorResponse)) {
        return throwError(() => new ErrorApi('Ocurrió un error inesperado.', 0));
      }

      // status 0 = el navegador no pudo siquiera establecer la conexion.
      if (e.status === 0) {
        return throwError(
          () =>
            new ErrorApi(
              'No se pudo conectar con la API. Verificá que el backend esté en marcha.',
              0,
            ),
        );
      }

      const delBackend = (e.error as CuerpoError | null)?.error?.message;
      const porDefecto =
        e.status === 404
          ? 'No encontramos lo que buscabas.'
          : e.status >= 500
            ? 'La API tuvo un problema. Intentá de nuevo en un momento.'
            : `Error ${e.status}.`;

      return throwError(() => new ErrorApi(delBackend ?? porDefecto, e.status));
    }),
  );
