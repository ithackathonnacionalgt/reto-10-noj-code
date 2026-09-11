import { Injectable } from '@angular/core';
import type { RespuestaAsistente } from '../../core/asistente/asistente.service';
import type { FiltrosTramite, Paginada, Tramite } from '../../core/models/catalogo.model';

export type ResultadoCatalogo =
  | { fase: 'listo'; pagina: Paginada<Tramite> }
  | { fase: 'ia'; respuesta: RespuestaAsistente };

/** Conserva las últimas búsquedas durante la sesión, sin repetir consultas al volver. */
@Injectable({ providedIn: 'root' })
export class CatalogoMemoria {
  private readonly resultados = new Map<string, ResultadoCatalogo>();

  obtener(filtros: FiltrosTramite, ia: boolean): ResultadoCatalogo | undefined {
    return this.resultados.get(JSON.stringify({ filtros, ia }));
  }

  guardar(filtros: FiltrosTramite, ia: boolean, resultado: ResultadoCatalogo): void {
    const clave = JSON.stringify({ filtros, ia });
    this.resultados.delete(clave);
    this.resultados.set(clave, resultado);
    if (this.resultados.size > 10) {
      this.resultados.delete(this.resultados.keys().next().value!);
    }
  }
}
