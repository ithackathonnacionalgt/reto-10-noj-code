import { DestroyRef, Injectable, inject, signal } from '@angular/core';

/* -------------------------------------------------------------------------- */
/* Web Speech API                                                             */
/*                                                                            */
/* TypeScript no trae tipos para SpeechRecognition (Chrome y Safari solo la   */
/* exponen con prefijo `webkit`). Se declara lo mínimo que se usa.            */
/* -------------------------------------------------------------------------- */

interface AlternativaVoz {
  readonly transcript: string;
}

interface ResultadoVoz {
  readonly isFinal: boolean;
  readonly [indice: number]: AlternativaVoz;
}

interface EventoVoz {
  readonly results: ArrayLike<ResultadoVoz>;
}

interface EventoErrorVoz {
  readonly error: string;
}

interface ReconocimientoVoz {
  lang: string;
  interimResults: boolean;
  continuous: boolean;
  maxAlternatives: number;
  onresult: ((e: EventoVoz) => void) | null;
  onerror: ((e: EventoErrorVoz) => void) | null;
  onend: (() => void) | null;
  start(): void;
  stop(): void;
  abort(): void;
}

type ConstructorReconocimiento = new () => ReconocimientoVoz;

function constructorReconocimiento(): ConstructorReconocimiento | null {
  if (typeof window === 'undefined') return null;
  const w = window as unknown as {
    SpeechRecognition?: ConstructorReconocimiento;
    webkitSpeechRecognition?: ConstructorReconocimiento;
  };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

/** Errores que no merecen un mensaje: la persona se calló o canceló. */
const ERRORES_SILENCIOSOS = new Set(['no-speech', 'aborted']);

const MENSAJES_ERROR: Record<string, string> = {
  'not-allowed': 'Permití el acceso al micrófono para dictar tu búsqueda.',
  'service-not-allowed': 'Permití el acceso al micrófono para dictar tu búsqueda.',
  'audio-capture': 'No se encontró un micrófono en este equipo.',
  network: 'El dictado necesita conexión a internet.',
};

export interface OyentesDictado {
  /** Texto reconocido hasta el momento, mientras la persona habla. */
  parcial: (texto: string) => void;
  /** Texto definitivo al terminar. No se llama si no se reconoció nada. */
  final: (texto: string) => void;
}

/**
 * Dictado por voz: transcribe lo que la persona dice mientras lo dice.
 *
 * Se provee por componente (`providers: [Dictado]`), no en la raíz: cada
 * buscador tiene su propia sesión de micrófono, y al destruirse el componente
 * la sesión se corta sola.
 *
 * Usa el reconocimiento del navegador, así que no hay audio pasando por
 * nuestro servidor ni llave que proteger. En navegadores sin soporte (Firefox)
 * `soportado` es `false` y el botón simplemente no se muestra.
 */
@Injectable()
export class Dictado {
  private readonly Reconocimiento = constructorReconocimiento();
  private sesion: ReconocimientoVoz | null = null;

  readonly soportado = this.Reconocimiento !== null;

  private readonly _escuchando = signal(false);
  private readonly _error = signal<string | null>(null);

  readonly escuchando = this._escuchando.asReadonly();
  readonly error = this._error.asReadonly();

  constructor() {
    inject(DestroyRef).onDestroy(() => this.sesion?.abort());
  }

  iniciar(oyentes: OyentesDictado): void {
    if (!this.Reconocimiento || this.sesion) return;

    const sesion = new this.Reconocimiento();
    sesion.lang = 'es-GT';
    // Resultados parciales: el texto aparece en el buscador mientras se habla.
    sesion.interimResults = true;
    // Una sola frase: el navegador corta solo cuando la persona hace una pausa.
    sesion.continuous = false;
    sesion.maxAlternatives = 1;

    let texto = '';

    sesion.onresult = (e) => {
      texto = Array.from(e.results, (r) => r[0]?.transcript ?? '')
        .join('')
        .trim();
      oyentes.parcial(texto);
    };

    sesion.onerror = (e) => {
      if (!ERRORES_SILENCIOSOS.has(e.error)) {
        this._error.set(MENSAJES_ERROR[e.error] ?? 'No se pudo usar el micrófono.');
      }
    };

    sesion.onend = () => {
      this.sesion = null;
      this._escuchando.set(false);
      if (texto) oyentes.final(texto);
    };

    this._error.set(null);
    this.sesion = sesion;
    this._escuchando.set(true);

    try {
      sesion.start();
    } catch {
      this.sesion = null;
      this._escuchando.set(false);
      this._error.set('No se pudo usar el micrófono.');
    }
  }

  /** Corta la escucha. Lo ya reconocido se entrega igual por `final`. */
  detener(): void {
    this.sesion?.stop();
  }
}
