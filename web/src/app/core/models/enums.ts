/**
 * Enumerados del contrato de la API (espejo de `backend/src/database/entities/enums.ts`).
 *
 * Se declaran como union de literales en vez de `enum` de TypeScript: viajan como
 * strings en el JSON, no generan codigo en el bundle y son mas faciles de estrechar.
 */

export const MODALIDADES = ['en_linea', 'presencial', 'mixto'] as const;
export type Modalidad = (typeof MODALIDADES)[number];

export const MODOS_EJECUCION = [
  'solo_informacion',
  'enlace_externo',
  'formulario_en_linea',
  'totalmente_digital',
  'hibrido',
] as const;
export type ModoEjecucion = (typeof MODOS_EJECUCION)[number];

export const TIPOS_COSTO = ['gratuito', 'fijo', 'variable', 'desconocido'] as const;
export type TipoCosto = (typeof TIPOS_COSTO)[number];

export const UNIDADES_TIEMPO = [
  'minutos',
  'horas',
  'dias_habiles',
  'dias_calendario',
  'semanas',
  'meses',
] as const;
export type UnidadTiempo = (typeof UNIDADES_TIEMPO)[number];

export const CALIDADES_DATOS = [
  'completo',
  'parcial',
  'necesita_revision',
  'verificado',
] as const;
export type CalidadDatos = (typeof CALIDADES_DATOS)[number];

export const ORDENES = ['recientes', 'nombre', 'populares'] as const;
export type Orden = (typeof ORDENES)[number];

/**
 * Etiquetas para mostrar en la interfaz.
 *
 * `Record<X, string>` obliga a que, si el backend agrega un valor al enumerado,
 * el compilador marque el que falta aqui en vez de fallar en silencio.
 */

export const ETIQUETA_MODALIDAD: Record<Modalidad, string> = {
  en_linea: 'En línea',
  presencial: 'Presencial',
  mixto: 'Mixto',
};

export const ETIQUETA_MODO_EJECUCION: Record<ModoEjecucion, string> = {
  solo_informacion: 'Solo información',
  enlace_externo: 'Enlace externo',
  formulario_en_linea: 'Formulario en línea',
  totalmente_digital: 'Totalmente digital',
  hibrido: 'Híbrido',
};

export const ETIQUETA_TIPO_COSTO: Record<TipoCosto, string> = {
  gratuito: 'Gratuito',
  fijo: 'Costo fijo',
  variable: 'Costo variable',
  desconocido: 'Costo no disponible',
};

export const ETIQUETA_UNIDAD_TIEMPO: Record<UnidadTiempo, string> = {
  minutos: 'minutos',
  horas: 'horas',
  dias_habiles: 'días hábiles',
  dias_calendario: 'días calendario',
  semanas: 'semanas',
  meses: 'meses',
};

export const ETIQUETA_CALIDAD_DATOS: Record<CalidadDatos, string> = {
  completo: 'Información completa',
  parcial: 'Información parcial',
  necesita_revision: 'Necesita revisión',
  verificado: 'Verificado',
};

export const ETIQUETA_ORDEN: Record<Orden, string> = {
  recientes: 'Más recientes',
  nombre: 'Nombre (A-Z)',
  populares: 'Más consultados',
};

/* --- Contenido de la ficha: pasos y requisitos ----------------------------- */

export const PARTES_RESPONSABLES = ['ciudadano', 'institucion', 'tercero', 'sistema'] as const;
export type ParteResponsable = (typeof PARTES_RESPONSABLES)[number];

export const CANALES = ['en_linea', 'presencial', 'telefono', 'correo', 'mixto'] as const;
export type Canal = (typeof CANALES)[number];

export const TIPOS_REQUISITO = ['documento', 'pago', 'condicion', 'otro'] as const;
export type TipoRequisito = (typeof TIPOS_REQUISITO)[number];

export const ETIQUETA_PARTE_RESPONSABLE: Record<ParteResponsable, string> = {
  ciudadano: 'Lo hacés vos',
  institucion: 'Lo hace la institución',
  tercero: 'Lo hace un tercero',
  sistema: 'Automático',
};

export const ETIQUETA_CANAL: Record<Canal, string> = {
  en_linea: 'En línea',
  presencial: 'Presencial',
  telefono: 'Por teléfono',
  correo: 'Por correo',
  mixto: 'En línea o presencial',
};
