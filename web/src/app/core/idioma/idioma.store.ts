import { DOCUMENT, Injectable, computed, effect, inject, signal } from '@angular/core';

/** Códigos ISO 639-3 de los idiomas mayas (los mismos de la tabla `idiomas`). */
export type CodigoIdioma = 'es' | 'quc' | 'cak' | 'kek';

export interface Idioma {
  codigo: CodigoIdioma;
  /** Como se llama el idioma en ese mismo idioma. */
  nativo: string;
  detalle: string;
  /** Valor para el atributo `lang`: el lector de pantalla cambia de voz. */
  lang: string;
}

export const IDIOMAS: readonly Idioma[] = [
  { codigo: 'es', nativo: 'Español', detalle: 'Idioma original', lang: 'es-GT' },
  { codigo: 'quc', nativo: 'K’iche’', detalle: 'Idioma maya', lang: 'quc' },
  { codigo: 'cak', nativo: 'Kaqchikel', detalle: 'Idioma maya', lang: 'cak' },
  { codigo: 'kek', nativo: 'Q’eqchi’', detalle: 'Idioma maya', lang: 'kek' },
];

const CLAVE = 'idioma';
const CODIGOS = new Set<string>(IDIOMAS.map((i) => i.codigo));

/**
 * Idioma elegido por la persona.
 *
 * Prototipo: por ahora traduce la pantalla de inicio (título, bajada y
 * buscador). El resto del sitio sigue en español hasta que existan
 * traducciones revisadas por hablantes (tabla `tramites_traducciones`).
 */
@Injectable({ providedIn: 'root' })
export class IdiomaStore {
  private readonly doc = inject(DOCUMENT);
  private readonly elegido = signal<CodigoIdioma>(this.leerGuardado());

  readonly codigo = this.elegido.asReadonly();
  readonly actual = computed(() => IDIOMAS.find((i) => i.codigo === this.elegido())!);
  readonly esMaya = computed(() => this.elegido() !== 'es');

  constructor() {
    effect(() => {
      try {
        this.doc.defaultView?.localStorage.setItem(CLAVE, this.elegido());
      } catch {
        // Sin almacenamiento la elección dura lo que la sesión. Aceptable.
      }
    });
  }

  seleccionar(codigo: CodigoIdioma): void {
    this.elegido.set(codigo);
  }

  private leerGuardado(): CodigoIdioma {
    try {
      const guardado = this.doc.defaultView?.localStorage.getItem(CLAVE);
      return guardado && CODIGOS.has(guardado) ? (guardado as CodigoIdioma) : 'es';
    } catch {
      return 'es';
    }
  }
}
