import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { catchError, map, of, type Observable } from 'rxjs';
import { CatalogoApi } from '../api/catalogo-api';
import type { Sobre, Tramite } from '../models/catalogo.model';

/** Respuesta del modo IA, ya lista para pintarse. */
export interface RespuestaAsistente {
  texto: string;
  tramites: Tramite[];
  /**
   * `ia` si respondió el modelo; `directa` si se cayó a la búsqueda por texto.
   * La interfaz lo distingue para no rotular como «IA» algo que no lo es.
   */
  origen: 'ia' | 'directa';
}

interface CuerpoAsistente {
  respuesta: string;
  tramites: Tramite[];
}

const RUTA = '/api/asistente';

/**
 * Modo IA del buscador.
 *
 * Habla con `POST /api/asistente`, que resuelve el Worker de Cloudflare. El
 * modelo de lenguaje vive allá y no acá por seguridad: la llave de OpenAI es un
 * secreto del servidor y nada de lo que compila Angular puede contenerla.
 *
 * El Worker devuelve texto breve más los trámites que lo respaldan, tomados de
 * la base de datos — no del modelo. Este servicio no los reinterpreta.
 *
 * Si el asistente no está disponible (falta la llave, se cayó OpenAI, o estamos
 * en `ng serve` sin Worker), cae a la búsqueda directa contra el catálogo: la
 * respuesta pierde naturalidad pero la persona igual encuentra su trámite.
 */
@Injectable({ providedIn: 'root' })
export class AsistenteService {
  private readonly http = inject(HttpClient);
  private readonly api = inject(CatalogoApi);

  private static readonly LIMITE = 6;

  preguntar(consulta: string): Observable<RespuestaAsistente> {
    return this.http
      .post<Sobre<CuerpoAsistente>>(RUTA, { pregunta: consulta })
      .pipe(
        map(({ data }): RespuestaAsistente => ({
          texto: data.respuesta,
          tramites: data.tramites,
          origen: 'ia',
        })),
        catchError(() => this.busquedaDirecta(consulta)),
      );
  }

  /* ------------------------------------------------------------------------ */
  /* Respaldo sin modelo                                                      */
  /* ------------------------------------------------------------------------ */

  private busquedaDirecta(consulta: string): Observable<RespuestaAsistente> {
    const termino = this.extraerTermino(consulta);

    if (!termino) {
      return of({
        texto:
          'Contame qué trámite buscás. Por ejemplo: «licencia de conducir» o «registro de empresa».',
        tramites: [],
        origen: 'directa',
      });
    }

    return this.api.listarTramites({ q: termino, limit: AsistenteService.LIMITE }).pipe(
      map(({ data, meta }): RespuestaAsistente => {
        if (data.length === 0) {
          return {
            texto: `No encontré trámites que coincidan con «${termino}». Probá con otras palabras.`,
            tramites: [],
            origen: 'directa',
          };
        }

        const encabezado =
          meta.total === 1
            ? 'Encontré 1 trámite:'
            : meta.total > data.length
              ? `Encontré ${meta.total} trámites. Estos son los más relevantes:`
              : `Encontré ${meta.total} trámites:`;

        return { texto: encabezado, tramites: data, origen: 'directa' };
      }),
      catchError(() =>
        of<RespuestaAsistente>({
          texto:
            'No pude consultar el catálogo en este momento. Intentá de nuevo en un rato.',
          tramites: [],
          origen: 'directa',
        }),
      ),
    );
  }

  /**
   * Limpia muletillas para que la búsqueda por texto no se degrade.
   *
   * El endpoint hace coincidencia sobre nombre e institución: mandarle
   * «cómo hago para sacar mi» completo devuelve cero resultados.
   */
  private extraerTermino(consulta: string): string {
    const RUIDO =
      /\b(hola|buenas|por\s*favor|gracias|quiero|necesito|c[oó]mo|como|puedo|hago|para|sacar|tramitar|obtener|mi|el|la|los|las|un|una|de|del|en|que|qu[eé]|es|hay|me|se|donde|d[oó]nde|informaci[oó]n|sobre|ayuda|ayudame|ay[uú]dame)\b/gi;

    return consulta
      .toLowerCase()
      .replace(/[¿?¡!.,;:]/g, ' ')
      .replace(RUIDO, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }
}
