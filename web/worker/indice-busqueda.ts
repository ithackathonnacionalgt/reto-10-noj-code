/**
 * Índice invertido en memoria sobre el catálogo.
 *
 * Existe para que el modelo no reciba el catálogo entero en cada pregunta. Con
 * tres trámites daría igual, pero el catálogo del reto está pensado para crecer:
 * con cientos de trámites, mandarlos todos significaría una petición enorme,
 * lenta y cara, y un modelo con menos precisión — el dato relevante se diluye
 * entre el ruido. Acá se preseleccionan los candidatos y solo esos viajan.
 *
 * Se construye una vez por refresco de caché y vive en el ámbito del módulo, así
 * que la mayoría de las consultas no cuestan ni una lectura de red.
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
}

/* -------------------------------------------------------------------------- */
/* Tokenización                                                               */
/* -------------------------------------------------------------------------- */

/* Muletillas y conectores. Sin esto «cómo hago para sacar mi licencia» puntúa
   alto en cualquier trámite que mencione «para» o «mi». */
const VACIAS = new Set([
  'a', 'al', 'algo', 'alguna', 'algun', 'ante', 'aqui', 'como', 'con', 'cual',
  'cuales', 'cuando', 'cuanto', 'de', 'del', 'desde', 'donde', 'dos', 'el',
  'ella', 'ellos', 'en', 'entre', 'es', 'esa', 'ese', 'eso', 'esta', 'este',
  'esto', 'gracias', 'hace', 'hacer', 'hago', 'hasta', 'hay', 'hola', 'la',
  'las', 'le', 'lo', 'los', 'me', 'mi', 'mis', 'muy', 'necesito', 'no', 'nos',
  'o', 'para', 'pero', 'por', 'porque', 'puedo', 'que', 'quiero', 'se', 'ser',
  'si', 'sobre', 'solo', 'son', 'su', 'sus', 'tengo', 'un', 'una', 'unas',
  'uno', 'unos', 'y', 'ya', 'yo',
]);

/**
 * Normaliza y parte en palabras.
 *
 * Quita tildes: quien escribe «tramite» sin tilde tiene que encontrar «trámite».
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

/* El nombre identifica el trámite; institución y categoría lo ubican; la
   descripción es contexto. Pesan en ese orden. */
const PESO_NOMBRE = 3;
const PESO_CLASIFICACION = 2;
const PESO_DESCRIPCION = 1;

/** Coincidencia por prefijo («licenc» → «licencia»): vale menos que la exacta. */
const FACTOR_PREFIJO = 0.5;
const LARGO_MINIMO_PREFIJO = 4;

export interface IndiceBusqueda {
  /** Cuántos trámites indexa. */
  readonly total: number;
  /** Devuelve los trámites más relevantes para la consulta, mejor primero. */
  buscar(consulta: string, limite: number): TramiteApi[];
  /** Resuelve un slug a su trámite real. Undefined si el slug no existe. */
  porSlug(slug: string): TramiteApi | undefined;
}

export function construirIndice(tramites: TramiteApi[]): IndiceBusqueda {
  // token -> (posición del trámite -> peso acumulado)
  const postings = new Map<string, Map<number, number>>();
  const porSlug = new Map<string, TramiteApi>();

  const anotar = (texto: string | null, posicion: number, peso: number): void => {
    if (!texto) return;
    for (const token of tokenizar(texto)) {
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
    anotar(t.institucion.nombre, i, PESO_CLASIFICACION);
    anotar(t.institucion.siglas, i, PESO_CLASIFICACION);
    for (const c of t.categorias) anotar(c.nombre, i, PESO_CLASIFICACION);
    anotar(t.descripcionCorta, i, PESO_DESCRIPCION);
  });

  const total = tramites.length;

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
      const tokens = tokenizar(consulta);
      const puntajes = new Map<number, number>();

      const sumar = (posicion: number, valor: number): void => {
        puntajes.set(posicion, (puntajes.get(posicion) ?? 0) + valor);
      };

      for (const token of tokens) {
        const exactas = postings.get(token);
        if (exactas) {
          const factor = idf(token);
          for (const [posicion, peso] of exactas) sumar(posicion, peso * factor);
          continue;
        }

        // Sin coincidencia exacta se intenta por prefijo: «empres» → «empresa»,
        // «empresarial». El vocabulario es chico, así que recorrerlo es barato.
        if (token.length < LARGO_MINIMO_PREFIJO) continue;
        for (const [vocablo, entradas] of postings) {
          if (!vocablo.startsWith(token)) continue;
          const factor = idf(vocablo) * FACTOR_PREFIJO;
          for (const [posicion, peso] of entradas) sumar(posicion, peso * factor);
        }
      }

      if (puntajes.size === 0) {
        // Nada coincide. Se mandan los primeros igual: el modelo necesita algo
        // real que ofrecer como alternativa en vez de responder al vacío.
        return tramites.slice(0, limite);
      }

      return [...puntajes.entries()]
        .sort((a, b) => b[1] - a[1])
        .slice(0, limite)
        .map(([posicion]) => tramites[posicion]);
    },
  };
}
