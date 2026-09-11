import type { CodigoIdioma } from '../../core/idioma/idioma.store';

/**
 * Textos de la pantalla de inicio en cada idioma.
 *
 * ⚠ Las versiones mayas son PRELIMINARES: se redactaron para el prototipo y
 * no las revisó un hablante. Antes de publicarlas de verdad hay que
 * validarlas (idealmente con la Academia de Lenguas Mayas de Guatemala).
 * Corregir una frase es editar este archivo: no hay que tocar nada más.
 */
export interface TextosInicio {
  lang: string;
  titulo: string;
  bajada: string;
  etiquetaBuscador: string;
  marcador: string;
  marcadorIa: string;
  pistaIa: string;
}

export const TEXTOS_INICIO: Record<CodigoIdioma, TextosInicio> = {
  es: {
    lang: 'es-GT',
    titulo: '¿Qué trámite necesitás?',
    bajada:
      'Consultá todos los trámites de Guatemala en un solo lugar: requisitos, costos, tiempos y pasos a seguir.',
    etiquetaBuscador: 'Buscar trámites del catálogo',
    marcador: 'Buscá por nombre, institución o código…',
    marcadorIa: 'Describí lo que necesitás hacer…',
    pistaIa: 'La IA interpreta tu pregunta y te muestra los trámites que mejor encajan.',
  },

  quc: {
    lang: 'quc',
    titulo: '¿Jas ri trámite kawaj?',
    bajada:
      "Chi' kariq ronojel ri trámite re Iximulew: ri kajawaxik, ri rajil, ri q'ij xuquje' ri b'e rech kab'an.",
    etiquetaBuscador: 'Chatzukuj ri trámite',
    marcador: "Chatz'ib'aj ri ub'i' o ri k'olb'al…",
    marcadorIa: "Chatzijoj jas kawaj kab'an…",
    pistaIa: "Ri IA kuta' ri atzij xuquje' kuk'ut ri trámite kakoj chawe.",
  },

  cak: {
    lang: 'cak',
    titulo: "¿Achike trámite nawajo'?",
    bajada:
      "Wawe' xtawïl ronojel ri taq trámite richin Iximulew: ri nik'atzin, ri rajil, ri q'ij chuqa' ri taq b'ey richin nab'än.",
    etiquetaBuscador: 'Katzukun trámite',
    marcador: "Katz'ib'an ri rub'i' o ri molaj…",
    marcadorIa: "Tatzijoj achike nawajo' nab'än…",
    pistaIa: "Ri IA nuq'ät ri ach'ab'äl chuqa' nuk'üt chawäch ri taq trámite ye'ok chawe.",
  },

  kek: {
    lang: 'kek',
    titulo: "¿K'aru li trámite naawaj?",
    bajada:
      "Arin taataw chixjunil li trámite re Iximulew: li naraj, li xtz'aq, li hoonal ut li b'e re xb'aanunkil.",
    etiquetaBuscador: "Sik' li trámite",
    marcador: "Tz'iib'a li xk'ab'a' malaj li molam…",
    marcadorIa: "Ch'olob'resi k'aru naawaj xb'aanunkil…",
    pistaIa: 'Li IA naxtaw ru laa patz\'om ut naxk\'ut chaawu li trámite us chaawe.',
  },
};
