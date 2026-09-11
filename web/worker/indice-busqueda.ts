/**
 * Índice invertido en memoria sobre el catálogo.
 *
 * Existe para que el modelo no reciba el catálogo entero en cada pregunta: se
 * preseleccionan los candidatos y solo esos viajan. Mandar 1.400 trámites
 * significaría una petición enorme, lenta y cara, y un modelo con menos
 * precisión — el dato relevante se diluye entre el ruido.
 *
 * Se construye una vez por isolate desde la copia del catálogo (ver
 * `scripts/generar-indice-ia.mjs`) y vive en el ámbito del módulo: una
 * búsqueda cuesta microsegundos y ninguna lectura de red.
 */

/** Subconjunto del trámite que el asistente necesita leer. El resto pasa intacto. */
export interface TramiteApi {
  slug: string;
  nombre: string;
  descripcionCorta: string | null;
  modalidad: string | null;
  disponibleEnLinea: boolean;
  tipoCosto: string;
  costo: number | null;
  moneda: string;
  tiempoRespuesta: { texto: string | null };
  institucion: { nombre: string; siglas: string | null };
  categorias: { nombre: string }[];
  /** Sinónimos curados en la base («muerte», «fallecimiento» en Defunción). */
  etiquetas?: string[];
}

/* -------------------------------------------------------------------------- */
/* Tokenización                                                               */
/* -------------------------------------------------------------------------- */

/* Muletillas, conectores y el vocabulario de «pedir ayuda». Sin esto «mi
   padre acaba de morir, qué trámite puedo hacer» puntúa alto en cualquier
   trámite que diga «trámite» o «hacer». */
const VACIAS = new Set([
  'a', 'acaba', 'acabo', 'acabamos', 'al', 'algo', 'alguna', 'algun', 'ante',
  'aqui', 'ayuda', 'ayudame', 'como', 'con', 'cual', 'cuales', 'cuando',
  'cuanto', 'de', 'debo', 'del', 'desde', 'donde', 'dos', 'el', 'ella',
  'ellos', 'en', 'entre', 'es', 'esa', 'ese', 'eso', 'esta', 'este', 'esto',
  'favor', 'gracias', 'hace', 'hacer', 'hacerlo', 'hago', 'hasta', 'hay',
  'hola', 'la', 'las', 'le', 'lo', 'los', 'me', 'mi', 'mis', 'muy',
  'necesito', 'no', 'nos', 'o', 'para', 'pero', 'podria', 'por', 'porque',
  'puedo', 'que', 'quiero', 'quisiera', 'recien', 'recomienda', 'recomiendan',
  'recomiendas', 'saber', 'se', 'ser', 'si', 'sobre', 'solo', 'son', 'su',
  'sus', 'tengo', 'tiene', 'tramite', 'tramites', 'tu', 'un', 'una', 'unas',
  'uno', 'unos', 'y', 'ya', 'yo',
]);

/**
 * Normaliza y parte en palabras.
 *
 * Quita tildes: quien escribe «defuncion» sin tilde tiene que encontrar
 * «Defunción».
 */
export function tokenizar(texto: string): string[] {
  return texto
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9ñ]+/g, ' ')
    .split(' ')
    .filter((t) => t.length > 1 && !VACIAS.has(t));
}

/* -------------------------------------------------------------------------- */
/* Construcción                                                               */
/* -------------------------------------------------------------------------- */

/* El nombre identifica el trámite; las etiquetas son sus sinónimos curados;
   institución y categoría lo ubican; la descripción es contexto. */
const PESO_NOMBRE = 3;
const PESO_ETIQUETA = 2;
const PESO_CLASIFICACION = 1.5;
const PESO_DESCRIPCION = 1;

/** Coincidencia por prefijo («licenc» → «licencia»): vale menos que la exacta. */
const FACTOR_PREFIJO = 0.5;
const LARGO_MINIMO_PREFIJO = 4;

export interface Resultado {
  tramite: TramiteApi;
  puntaje: number;
}

export interface IndiceBusqueda {
  /** Cuántos trámites indexa. */
  readonly total: number;
  /** Los trámites que coinciden con la consulta, mejor primero. Vacío si ninguno. */
  buscar(consulta: string, limite: number): Resultado[];
  /** Resuelve un slug a su trámite real. Undefined si el slug no existe. */
  porSlug(slug: string): TramiteApi | undefined;
}

export function construirIndice(tramites: TramiteApi[]): IndiceBusqueda {
  // token -> (posición del trámite -> peso acumulado)
  const postings = new Map<string, Map<number, number>>();
  const porSlug = new Map<string, TramiteApi>();

  const anotar = (texto: string | null | undefined, posicion: number, peso: number): void => {
    if (!texto) return;
    // Un token cuenta una vez por campo: un nombre que repite una palabra no
    // debería ganarle a otro solo por eso.
    for (const token of new Set(tokenizar(texto))) {
      let entradas = postings.get(token);
      if (!entradas) {
        entradas = new Map();
        postings.set(token, entradas);
      }
      entradas.set(posicion, (entradas.get(posicion) ?? 0) + peso);
    }
  };

  tramites.forEach((t, i) => {
    porSlug.set(t.slug, t);

    anotar(t.nombre, i, PESO_NOMBRE);
    anotar(t.etiquetas?.join(' '), i, PESO_ETIQUETA);
    anotar(t.institucion.nombre, i, PESO_CLASIFICACION);
    anotar(t.institucion.siglas, i, PESO_CLASIFICACION);
    for (const c of t.categorias) anotar(c.nombre, i, PESO_CLASIFICACION);
    anotar(t.descripcionCorta, i, PESO_DESCRIPCION);
  });

  const total = tramites.length;
  const vocabulario = [...postings.keys()];

  /* Un token que aparece en todos los trámites no distingue nada; uno que
     aparece en uno solo lo identifica. Eso es lo que mide el idf. */
  const idf = (token: string): number => {
    const frecuencia = postings.get(token)?.size ?? 0;
    return frecuencia === 0 ? 0 : Math.log(1 + total / frecuencia);
  };

  return {
    total,

    porSlug: (slug) => porSlug.get(slug),

    buscar(consulta, limite) {
      const puntajes = new Map<number, number>();
      const sumar = (posicion: number, valor: number): void => {
        puntajes.set(posicion, (puntajes.get(posicion) ?? 0) + valor);
      };

      for (const token of tokenizar(consulta)) {
        const exactas = postings.get(token);
        if (exactas) {
          const factor = idf(token);
          for (const [posicion, peso] of exactas) sumar(posicion, peso * factor);
          continue;
        }

        // Sin coincidencia exacta se intenta por prefijo: «empres» → «empresa»,
        // «empresarial». El vocabulario es de unos miles de palabras.
        if (token.length < LARGO_MINIMO_PREFIJO) continue;
        for (const vocablo of vocabulario) {
          if (!vocablo.startsWith(token)) continue;
          const factor = idf(vocablo) * FACTOR_PREFIJO;
          for (const [posicion, peso] of postings.get(vocablo)!) sumar(posicion, peso * factor);
        }
      }

      return [...puntajes.entries()]
        .sort((a, b) => b[1] - a[1])
        .slice(0, limite)
        .map(([posicion, puntaje]) => ({ tramite: tramites[posicion], puntaje }));
    },
  };
}

/**
 * Fusión por rango recíproco (RRF) de varias listas de resultados.
 *
 * Se suman posiciones y no puntajes: el puntaje de la pregunta literal y el de
 * los términos que dedujo el modelo no están en la misma escala, pero «salió
 * primero en las dos» significa lo mismo en cualquier escala.
 */
export function fusionar(
  listas: { resultados: Resultado[]; peso: number }[],
  limite: number,
): TramiteApi[] {
  const K = 20;
  const acumulado = new Map<string, { tramite: TramiteApi; puntaje: number }>();
  for (const { resultados, peso } of listas) {
    resultados.forEach(({ tramite }, rango) => {
      const previo = acumulado.get(tramite.slug);
      const suma = (previo?.puntaje ?? 0) + peso / (K + rango + 1);
      acumulado.set(tramite.slug, { tramite, puntaje: suma });
    });
  }
  return [...acumulado.values()]
    .sort((a, b) => b.puntaje - a.puntaje)
    .slice(0, limite)
    .map((e) => e.tramite);
}
