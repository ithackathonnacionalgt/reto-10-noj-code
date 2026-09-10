/**
 * Enumeraciones compartidas del modelo de datos.
 * Valores en espanol, sin tildes ni la letra n con tilde (segun bd.sql).
 */

/** Estados de publicacion para contenido gubernamental (CLAUDE.md 25). */
export enum EstadoPublicacion {
  BORRADOR = 'borrador',
  EN_REVISION = 'en_revision',
  APROBADO = 'aprobado',
  PUBLICADO = 'publicado',
  ARCHIVADO = 'archivado',
}

/** Estado de una cuenta de usuario. */
export enum EstadoUsuario {
  ACTIVO = 'activo',
  INACTIVO = 'inactivo',
  BLOQUEADO = 'bloqueado',
  PENDIENTE = 'pendiente',
}

/** Estado de una llave de API para desarrolladores (CLAUDE.md 17). */
export enum EstadoLlaveApi {
  ACTIVA = 'activa',
  REVOCADA = 'revocada',
  EXPIRADA = 'expirada',
}

/** Modalidad de atencion del tramite (heredado de bd.sql). */
export enum Modalidad {
  EN_LINEA = 'en_linea',
  PRESENCIAL = 'presencial',
  MIXTO = 'mixto',
}

/** Modo de ejecucion configurable del tramite (CLAUDE.md 3). */
export enum ModoEjecucion {
  SOLO_INFORMACION = 'solo_informacion',
  ENLACE_EXTERNO = 'enlace_externo',
  FORMULARIO_EN_LINEA = 'formulario_en_linea',
  TOTALMENTE_DIGITAL = 'totalmente_digital',
  HIBRIDO = 'hibrido',
}

/** Clasificacion del costo del tramite (CLAUDE.md 12). */
export enum TipoCosto {
  GRATUITO = 'gratuito',
  FIJO = 'fijo',
  VARIABLE = 'variable',
  DESCONOCIDO = 'desconocido',
}

/** Unidad de tiempo para plazos de respuesta. */
export enum UnidadTiempo {
  MINUTOS = 'minutos',
  HORAS = 'horas',
  DIAS_HABILES = 'dias_habiles',
  DIAS_CALENDARIO = 'dias_calendario',
  SEMANAS = 'semanas',
  MESES = 'meses',
}

/** Indicador de completitud/verificacion de datos (CLAUDE.md 46). */
export enum CalidadDatos {
  COMPLETO = 'completo',
  PARCIAL = 'parcial',
  NECESITA_REVISION = 'necesita_revision',
  VERIFICADO = 'verificado',
}

/** Origen de la informacion de un tramite (CLAUDE.md 45). */
export enum TipoFuente {
  OFICIAL = 'oficial',
  TRADUCIDA = 'traducida',
  APORTADA_USUARIO = 'aportada_usuario',
  PENDIENTE_VERIFICAR = 'pendiente_verificar',
}

/** Estado del flujo de traduccion (CLAUDE.md 10). */
export enum EstadoTraduccion {
  BORRADOR = 'borrador',
  EN_REVISION = 'en_revision',
  APROBADA = 'aprobada',
  PUBLICADA = 'publicada',
}

/** Estado de aprobacion para recursos de accesibilidad (CLAUDE.md 11). */
export enum EstadoContenido {
  BORRADOR = 'borrador',
  EN_REVISION = 'en_revision',
  APROBADO = 'aprobado',
  PUBLICADO = 'publicado',
}

/** Tipo de requisito de un tramite (CLAUDE.md 13). */
export enum TipoRequisito {
  DOCUMENTO = 'documento',
  PAGO = 'pago',
  CONDICION = 'condicion',
  OTRO = 'otro',
}

/** Responsable de ejecutar un paso del tramite (CLAUDE.md 14). */
export enum ParteResponsable {
  CIUDADANO = 'ciudadano',
  INSTITUCION = 'institucion',
  TERCERO = 'tercero',
  SISTEMA = 'sistema',
}

/** Canal por el que se realiza un paso o esta disponible un tramite (CLAUDE.md 14). */
export enum Canal {
  EN_LINEA = 'en_linea',
  PRESENCIAL = 'presencial',
  TELEFONO = 'telefono',
  CORREO = 'correo',
  MIXTO = 'mixto',
}

/** Tipo de enlace asociado a un tramite (CLAUDE.md 16). */
export enum TipoEnlace {
  TRAMITE_EN_LINEA = 'tramite_en_linea',
  FUENTE_OFICIAL = 'fuente_oficial',
  INFORMACION = 'informacion',
  FORMULARIO_DESCARGA = 'formulario_descarga',
  OTRO = 'otro',
}

/** Protocolo de integracion con una institucion externa (CLAUDE.md 42). */
export enum TipoIntegracion {
  REST = 'rest',
  SOAP = 'soap',
  WEBHOOK = 'webhook',
  POLLING = 'polling',
  ARCHIVO = 'archivo',
}

/** Mecanismo de autenticacion de una integracion institucional (CLAUDE.md 15). */
export enum TipoAuthIntegracion {
  NINGUNO = 'ninguno',
  API_KEY = 'api_key',
  OAUTH2 = 'oauth2',
  BASIC = 'basic',
  TOKEN = 'token',
}

/** Tipo de dato de contacto de una institucion. */
export enum TipoContacto {
  TELEFONO = 'telefono',
  CORREO = 'correo',
  WHATSAPP = 'whatsapp',
  SITIO_WEB = 'sitio_web',
  OTRO = 'otro',
}

/** Tipo de recurso de accesibilidad adicional (CLAUDE.md 11). */
export enum TipoRecursoAccesibilidad {
  SUBTITULOS = 'subtitulos',
  TRANSCRIPCION = 'transcripcion',
  AUDIO = 'audio',
  TEXTO_SIMPLIFICADO = 'texto_simplificado',
  LECTURA_FACIL = 'lectura_facil',
  OTRO = 'otro',
}

/** Tipos de campo soportados por el motor de formularios dinamicos (CLAUDE.md 7). */
export enum TipoCampo {
  TEXTO = 'texto',
  TEXTO_AREA = 'texto_area',
  NUMERO = 'numero',
  DECIMAL = 'decimal',
  FECHA = 'fecha',
  FECHA_HORA = 'fecha_hora',
  HORA = 'hora',
  EMAIL = 'email',
  TELEFONO = 'telefono',
  URL = 'url',
  BOOLEANO = 'booleano',
  SELECCION = 'seleccion',
  SELECCION_MULTIPLE = 'seleccion_multiple',
  RADIO = 'radio',
  CASILLA = 'casilla',
  ARCHIVO = 'archivo',
  IMAGEN = 'imagen',
  PDF = 'pdf',
  VIDEO = 'video',
  FIRMA = 'firma',
  DIRECCION = 'direccion',
  DEPARTAMENTO = 'departamento',
  MUNICIPIO = 'municipio',
  NACIONALIDAD = 'nacionalidad',
  DPI = 'dpi',
  TEXTO_ENRIQUECIDO = 'texto_enriquecido',
  REPETIDOR = 'repetidor',
  GRUPO = 'grupo',
}

/** Estado de una version de formulario (CLAUDE.md 53). */
export enum EstadoVersionFormulario {
  BORRADOR = 'borrador',
  PUBLICADA = 'publicada',
  ARCHIVADA = 'archivada',
}

/** Tipo de condicion sobre un campo de formulario. */
export enum TipoCondicion {
  VISIBILIDAD = 'visibilidad',
  REQUERIDO = 'requerido',
}

/** Operador de comparacion para condiciones de formulario. */
export enum OperadorCondicion {
  IGUAL = 'igual',
  DIFERENTE = 'diferente',
  CONTIENE = 'contiene',
  NO_CONTIENE = 'no_contiene',
  MAYOR_QUE = 'mayor_que',
  MENOR_QUE = 'menor_que',
  VACIO = 'vacio',
  NO_VACIO = 'no_vacio',
}

/** Conector logico entre condiciones. */
export enum ConectorCondicion {
  Y = 'y',
  O = 'o',
}

/** Estados del ciclo de vida de una solicitud ciudadana (CLAUDE.md 55). */
export enum EstadoSolicitud {
  BORRADOR = 'borrador',
  ENVIADA = 'enviada',
  RECIBIDA = 'recibida',
  EN_REVISION = 'en_revision',
  REQUIERE_INFORMACION = 'requiere_informacion',
  APROBADA = 'aprobada',
  RECHAZADA = 'rechazada',
  CANCELADA = 'cancelada',
  COMPLETADA = 'completada',
}

/** Canal de entrega de una notificacion (CLAUDE.md 56). */
export enum CanalNotificacion {
  EMAIL = 'email',
  WEB = 'web',
  SMS = 'sms',
  WHATSAPP = 'whatsapp',
}

/** Tipo de reporte ciudadano (CLAUDE.md 30, quejas y denuncias de bd.sql). */
export enum TipoQueja {
  QUEJA = 'queja',
  DENUNCIA = 'denuncia',
  INFORMACION_INCORRECTA = 'informacion_incorrecta',
  SUGERENCIA = 'sugerencia',
}

/** Estado de atencion de una queja o denuncia. */
export enum EstadoQueja {
  ABIERTA = 'abierta',
  EN_PROCESO = 'en_proceso',
  RESUELTA = 'resuelta',
  CERRADA = 'cerrada',
}
