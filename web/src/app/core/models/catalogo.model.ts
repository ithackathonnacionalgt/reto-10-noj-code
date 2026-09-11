import type {
  CalidadDatos,
  Canal,
  Modalidad,
  ModoEjecucion,
  Orden,
  ParteResponsable,
  TipoCosto,
  TipoRequisito,
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

/** Que explica el video en LENSEGUA: la descripcion corta o el paso a paso. */
export type TipoVideoSenas = 'descripcion' | 'pasos';

/** Video en lengua de senas de Guatemala (LENSEGUA). Solo llegan los publicados. */
export interface VideoSenas {
  id: string;
  tipo: TipoVideoSenas;
  lenguaSenas: string;
  titulo: string;
  descripcion: string | null;
  urlVideo: string;
  urlMiniatura: string | null;
  duracionSegundos: number | null;
  transcripcion: string | null;
}

export interface AccesibilidadTramite {
  videosSenas: VideoSenas[];
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
  urlImagen?: string | null;
  urlFuenteOficial: string | null;
  institucion: InstitucionResumen;
  categorias: CategoriaDeTramite[];
  etiquetas?: string[];
  /**
   * Siempre en la ficha. En el listado, solo si el backend ya lo incluye: si
   * falta, la tarjeta pide la ficha para saber si hay video (ver VideosLensegua).
   */
  accesibilidad?: AccesibilidadTramite;
  publicadoEn: string | null;
  actualizadoEn: string | null;
}

/* -------------------------------------------------------------------------- */
/* Ficha completa                                                             */
/* -------------------------------------------------------------------------- */

export interface PasoTramite {
  id: string;
  orden: number;
  titulo: string;
  descripcion: string | null;
  parteResponsable: ParteResponsable | null;
  tiempoEstimado: string | null;
  canal: Canal | null;
  ubicacion: string | null;
  requierePago: boolean;
  requiereDocumento: boolean;
  urlExterna: string | null;
}

export interface RequisitoTramite {
  id: string;
  orden: number;
  titulo: string;
  descripcion: string | null;
  tipo: TipoRequisito | null;
  esObligatorio: boolean;
  cantidad: number | null;
  notas: string | null;
}

export interface NormativaTramite {
  id: string;
  titulo: string | null;
  tipo: string | null;
  numero: string | null;
  url: string | null;
  fecha: string | null;
  extracto: string | null;
}

/** `GET /procedures/:slug`: el trámite con su descripción, requisitos y pasos. */
export interface TramiteDetalle extends Tramite {
  descripcion: string | null;
  requisitos: RequisitoTramite[];
  pasos: PasoTramite[];
  normativas: NormativaTramite[];
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
