import type {
  CalidadDatos,
  Modalidad,
  ModoEjecucion,
  Orden,
  TipoCosto,
  UnidadTiempo,
} from './enums';

/* -------------------------------------------------------------------------- */
/* Sobres de respuesta                                                        */
/* -------------------------------------------------------------------------- */

/** El backend envuelve toda respuesta simple en `{ data }`. */
export interface Sobre<T> {
  data: T;
}

export interface MetaPaginacion {
  page: number;
  limit: number;
  total: number;
  totalPaginas: number;
}

/** Colecciones paginadas: `{ data, meta }`. */
export interface Paginada<T> {
  data: T[];
  meta: MetaPaginacion;
}

/* -------------------------------------------------------------------------- */
/* Entidades del catalogo                                                     */
/* -------------------------------------------------------------------------- */

export interface TiempoRespuesta {
  valor: number | null;
  unidad: UnidadTiempo | null;
  texto: string | null;
}

export interface InstitucionResumen {
  id: string;
  slug: string;
  nombre: string;
  siglas: string | null;
  urlLogo: string | null;
}

export interface CategoriaDeTramite {
  id: string;
  slug: string;
  nombre: string;
  esPrincipal: boolean;
}

/** Item del listado publico de tramites. */
export interface Tramite {
  id: string;
  publicId: string;
  slug: string;
  codigo: string | null;
  nombre: string;
  descripcionCorta: string | null;
  estado: string;
  modoEjecucion: ModoEjecucion;
  modalidad: Modalidad | null;
  disponibleEnLinea: boolean;
  tipoCosto: TipoCosto;
  costo: number | null;
  moneda: string;
  tiempoRespuesta: TiempoRespuesta;
  calidadDatos: CalidadDatos;
  urlExterna: string | null;
  urlFuenteOficial: string | null;
  institucion: InstitucionResumen;
  categorias: CategoriaDeTramite[];
  publicadoEn: string | null;
  actualizadoEn: string | null;
}

export interface Institucion {
  id: string;
  slug: string;
  nombre: string;
  siglas: string | null;
}

export interface Categoria {
  id: string;
  slug: string;
  nombre: string;
}

export interface Departamento {
  id: string;
  nombre: string;
  codigo?: string;
}

/* -------------------------------------------------------------------------- */
/* Filtros de busqueda                                                        */
/* -------------------------------------------------------------------------- */

/**
 * Filtros aceptados por `GET /procedures`.
 *
 * Cuidado: el backend valida con `forbidNonWhitelisted`, asi que enviar una clave
 * que no este en esta lista devuelve HTTP 400. Las claves `undefined` se descartan
 * antes de armar la query (ver `CatalogoApi`).
 */
export interface FiltrosTramite {
  q?: string;
  institucionId?: string;
  categoriaId?: string;
  modalidad?: Modalidad;
  modoEjecucion?: ModoEjecucion;
  tipoCosto?: TipoCosto;
  disponibleEnLinea?: boolean;
  departamentoId?: string;
  municipioId?: string;
  orden?: Orden;
  page?: number;
  limit?: number;
}
