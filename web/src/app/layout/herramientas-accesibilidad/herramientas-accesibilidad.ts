import {
  ChangeDetectionStrategy,
  Component,
  DOCUMENT,
  ElementRef,
  effect,
  inject,
  signal,
} from '@angular/core';
import { AccesibilidadStore } from '../../core/accesibilidad/accesibilidad.store';

/** Lo que la lupa agranda: bloques de texto y rótulos de controles. */
const SELECTOR_LUPA =
  'p, h1, h2, h3, h4, h5, h6, li, dt, dd, label, td, th, figcaption, blockquote, summary, small, strong, a, button';

/** Lo que la voz lee al tocarlo: texto, no controles (esos hacen lo suyo). */
const SELECTOR_LECTURA =
  'p, h1, h2, h3, h4, h5, h6, li, dt, dd, label, td, th, figcaption, blockquote, small, strong';

const SELECTOR_INTERACTIVO =
  'a, button, input, select, textarea, summary, [role="button"], [role="switch"], [contenteditable]';

const MAX_CARACTERES_LUPA = 280;
const MAX_CARACTERES_VOZ = 4000;

/**
 * Las herramientas de accesibilidad que no se resuelven con CSS: la guía de
 * lectura, la lupa de texto y la lectura en voz alta.
 *
 * Cada una escucha eventos del documento solo mientras está encendida. La
 * posición del puntero va directo a variables CSS del host, sin pasar por la
 * detección de cambios: se actualiza en cada cuadro.
 */
@Component({
  selector: 'app-herramientas-accesibilidad',
  templateUrl: './herramientas-accesibilidad.html',
  styleUrl: './herramientas-accesibilidad.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HerramientasAccesibilidad {
  protected readonly a11y = inject(AccesibilidadStore);
  private readonly doc = inject(DOCUMENT);
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);

  protected readonly textoLupa = signal<string | null>(null);

  private cuadro = 0;
  private leyendo: HTMLElement | null = null;

  constructor() {
    this.seguirPuntero();
    this.activarLupa();
    this.activarVoz();
  }

  /* --- Guía de lectura y posición de la lupa ------------------------------ */

  private seguirPuntero(): void {
    effect((alLimpiar) => {
      if (!this.a11y.guiaLectura() && !this.a11y.lupaTexto()) return;

      const mover = (e: PointerEvent) => {
        cancelAnimationFrame(this.cuadro);
        this.cuadro = requestAnimationFrame(() => {
          const s = this.host.nativeElement.style;
          s.setProperty('--puntero-x', `${e.clientX}px`);
          s.setProperty('--puntero-y', `${e.clientY}px`);
          // En la mitad de abajo la lupa se abre hacia arriba: si no, se sale.
          s.setProperty(
            '--lupa-desvio',
            e.clientY > innerHeight * 0.6 ? 'calc(-100% - 1.5rem)' : '1.5rem',
          );
        });
      };

      this.doc.addEventListener('pointermove', mover, { passive: true });
      alLimpiar(() => {
        this.doc.removeEventListener('pointermove', mover);
        cancelAnimationFrame(this.cuadro);
      });
    });
  }

  /* --- Lupa de texto ------------------------------------------------------ */

  private activarLupa(): void {
    effect((alLimpiar) => {
      if (!this.a11y.lupaTexto()) {
        this.textoLupa.set(null);
        return;
      }

      const sobre = (e: PointerEvent) => {
        const el = (e.target as Element).closest?.(SELECTOR_LUPA) as HTMLElement | null;
        const texto = el?.innerText.replace(/\s+/g, ' ').trim();
        this.textoLupa.set(texto ? recortar(texto, MAX_CARACTERES_LUPA) : null);
      };
      const fuera = () => this.textoLupa.set(null);

      this.doc.addEventListener('pointerover', sobre, { passive: true });
      this.doc.documentElement.addEventListener('pointerleave', fuera);
      alLimpiar(() => {
        this.doc.removeEventListener('pointerover', sobre);
        this.doc.documentElement.removeEventListener('pointerleave', fuera);
      });
    });
  }

  /* --- Lectura en voz alta ------------------------------------------------ */

  private activarVoz(): void {
    effect((alLimpiar) => {
      if (!this.a11y.lecturaVoz() || typeof speechSynthesis === 'undefined') return;

      this.hablar('Lectura en voz alta activada. Tocá un texto o seleccionalo para escucharlo.');

      // Una selección se lee al soltar; el clic que la cierra no vuelve a leer.
      let leyoSeleccion = false;
      const alSoltar = () => {
        const seleccion = this.doc.getSelection()?.toString().trim();
        if (seleccion && seleccion.length > 1) {
          leyoSeleccion = true;
          this.hablar(seleccion);
        }
      };
      const alClicar = (e: MouseEvent) => {
        if (leyoSeleccion) {
          leyoSeleccion = false;
          return;
        }
        const objetivo = e.target as Element;
        if (objetivo.closest(SELECTOR_INTERACTIVO)) return;
        const el = objetivo.closest(SELECTOR_LECTURA) as HTMLElement | null;
        if (el?.innerText.trim()) this.hablar(el.innerText, el);
      };

      this.doc.addEventListener('mouseup', alSoltar);
      this.doc.addEventListener('keyup', alSoltar);
      this.doc.addEventListener('click', alClicar, true);
      alLimpiar(() => {
        this.doc.removeEventListener('mouseup', alSoltar);
        this.doc.removeEventListener('keyup', alSoltar);
        this.doc.removeEventListener('click', alClicar, true);
        speechSynthesis.cancel();
        this.marcar(null);
      });
    });
  }

  private hablar(texto: string, el?: HTMLElement): void {
    speechSynthesis.cancel();
    const frase = new SpeechSynthesisUtterance(recortar(texto.trim(), MAX_CARACTERES_VOZ));
    frase.lang = 'es-GT';
    const voz = speechSynthesis.getVoices().find((v) => v.lang.toLowerCase().startsWith('es'));
    if (voz) frase.voice = voz;

    const destino = el ?? null;
    this.marcar(destino);
    const terminar = () => {
      if (this.leyendo === destino) this.marcar(null);
    };
    frase.onend = terminar;
    frase.onerror = terminar;
    speechSynthesis.speak(frase);
  }

  /** Resalta en la página lo que se está leyendo. */
  private marcar(el: HTMLElement | null): void {
    this.leyendo?.classList.remove('a11y-leyendo');
    this.leyendo = el;
    el?.classList.add('a11y-leyendo');
  }
}

function recortar(texto: string, max: number): string {
  return texto.length > max ? `${texto.slice(0, max - 1)}…` : texto;
}
