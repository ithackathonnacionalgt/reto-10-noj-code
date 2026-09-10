import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { map, type Observable } from 'rxjs';
import { ENTORNO } from '../config/entorno.token';
import type {
  Categoria,
  Departamento,
  FiltrosTramite,
  Institucion,
  Paginada,
  Sobre,
  Tramite,
} from '../models/catalogo.model';

/**
 * Unico punto de contacto con la API publica del catalogo.
 *
 * Los componentes no arman URLs ni conocen la forma del sobre de respuesta:
 * este servicio desenvuelve `{ data }` y expone tipos del dominio.
 */
@Injectable({ providedIn: 'root' })
export class CatalogoApi {
  private readonly http = inject(HttpClient);
  private readonly base = inject(ENTORNO).apiUrl.replace(/\/+$/, '');

  /**
   * Convierte filtros a `HttpParams` descartando vacios.
   *
   * Es deliberado: el backend rechaza con 400 cualquier parametro desconocido,
   * y mandar `q=` vacio ensucia la URL sin filtrar nada.
   */
  private aParams(filtros: object): HttpParams {
    let params = new HttpParams();
    for (const [clave, valor] of Object.entries(filtros)) {
      if (valor === undefined || valor === null || valor === '') continue;
      params = params.set(clave, String(valor));
    }
    return params;
  }

  /** `GET /procedures` — listado publico y paginado, con filtros. */
  listarTramites(filtros: FiltrosTramite = {}): Observable<Paginada<Tramite>> {
    return this.http.get<Paginada<Tramite>>(`${this.base}/procedures`, {
      params: this.aParams(filtros),
    });
  }

  /** `GET /procedures/:slug` — acepta slug o publicId (`TR-AB12CD34`). */
  obtenerTramite(slugOPublicId: string): Observable<Tramite> {
    return this.http
      .get<Sobre<Tramite>>(
        `${this.base}/procedures/${encodeURIComponent(slugOPublicId)}`,
      )
      .pipe(map((r) => r.data));
  }

  /** `GET /institutions` — se pide el maximo permitido para poblar el filtro. */
  listarInstituciones(): Observable<Institucion[]> {
    return this.http
      .get<Paginada<Institucion>>(`${this.base}/institutions`, {
        params: this.aParams({ limit: 100 }),
      })
      .pipe(map((r) => r.data));
  }

  /** `GET /categories` */
  listarCategorias(): Observable<Categoria[]> {
    return this.http
      .get<Paginada<Categoria>>(`${this.base}/categories`, {
        params: this.aParams({ limit: 100 }),
      })
      .pipe(map((r) => r.data));
  }

  /** `GET /departments` */
  listarDepartamentos(): Observable<Departamento[]> {
    return this.http
      .get<Sobre<Departamento[]>>(`${this.base}/departments`)
      .pipe(map((r) => r.data));
  }
}
