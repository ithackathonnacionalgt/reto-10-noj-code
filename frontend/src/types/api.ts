export interface Meta {
  page: number;
  limit: number;
  total: number;
  totalPaginas: number;
}

export interface Paginada<T> {
  data: T[];
  meta: Meta;
}

export interface TiempoRespuesta {
  valor: number | null;
  unidad: string | null;
  texto: string | null;
}

export interface CategoriaEnTramite {
  id: string;
  slug: string;
  nombre: string;
  esPrincipal: boolean;
}

export interface InstitucionEnTramite {
  id: string;
  slug?: string;
  nombre?: string;
  siglas?: string | null;
  urlLogo?: string | null;
}

/** Item de listado de tramites (mapper `aResumen` del backend). */
export interface TramiteResumen {
  id: string;
  publicId: string;
  slug: string;
  codigo: string | null;
  nombre: string;
  descripcionCorta: string | null;
  estado: string;
  modoEjecucion: string;
  modalidad: string | null;
  disponibleEnLinea: boolean;
  tipoCosto: string;
  costo: number | null;
  moneda: string;
  tiempoRespuesta: TiempoRespuesta;
  calidadDatos: string;
  /** URL externa donde se realiza el tramite. */
  urlExterna: string | null;
  /** URL oficial de la institucion sobre el tramite. */
  urlFuenteOficial: string | null;
  institucion: InstitucionEnTramite;
  categorias: CategoriaEnTramite[];
  publicadoEn: string | null;
  actualizadoEn: string | null;
}

export interface InstitucionOpcion {
  id: string;
  nombre: string;
  siglas: string | null;
  slug: string;
}

export interface CategoriaOpcion {
  id: string;
  nombre: string;
  slug: string;
}

export interface DepartamentoOpcion {
  id: string;
  nombre: string;
}
