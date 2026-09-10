export const MODALIDAD: Record<string, string> = {
  en_linea: "En linea",
  presencial: "Presencial",
  mixto: "Mixto",
};

export const MODO_EJECUCION: Record<string, string> = {
  solo_informacion: "Solo informacion",
  enlace_externo: "Enlace externo",
  formulario_en_linea: "Formulario en linea",
  totalmente_digital: "Totalmente digital",
  hibrido: "Hibrido",
};

export const TIPO_COSTO: Record<string, string> = {
  gratuito: "Gratuito",
  fijo: "Costo fijo",
  variable: "Costo variable",
  desconocido: "No especificado",
};

export const UNIDAD_TIEMPO: Record<string, string> = {
  minutos: "minutos",
  horas: "horas",
  dias_habiles: "dias habiles",
  dias_calendario: "dias calendario",
  semanas: "semanas",
  meses: "meses",
};

export const CALIDAD_DATOS: Record<string, string> = {
  completo: "Informacion completa",
  parcial: "Informacion parcial",
  necesita_revision: "En revision",
  verificado: "Verificado",
};

export const ORDEN: { valor: string; etiqueta: string }[] = [
  { valor: "recientes", etiqueta: "Mas recientes" },
  { valor: "nombre", etiqueta: "Nombre (A-Z)" },
  { valor: "populares", etiqueta: "Mas consultados" },
];
