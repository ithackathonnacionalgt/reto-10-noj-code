import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  computed,
  effect,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';
import { fuenteDeVideo, urlIncrustada } from './fuente-video';
import { VisorVideo } from './visor-video.service';

/** Tope por si la animación de salida no llega a disparar `animationend`. */
const TOPE_CIERRE_MS = 400;

/**
 * Video ampliado al centro de la pantalla, con la página desenfocada detrás.
 *
 * Es un `<dialog>` nativo abierto con `showModal()`: el navegador ya resuelve
 * la capa superior, el foco atrapado adentro, `Esc` para cerrar y el
 * `::backdrop` que se desenfoca. Nada de eso hay que reimplementarlo.
 */
@Component({
  selector: 'app-visor-video',
  templateUrl: './visor-video.html',
  styleUrl: './visor-video.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class VisorVideoComponente {
  protected readonly visor = inject(VisorVideo);
  private readonly sanitizer = inject(DomSanitizer);
  private readonly dialogo = viewChild.required<ElementRef<HTMLDialogElement>>('dialogo');

  protected readonly cerrando = signal(false);
  protected readonly proporcion = signal('16 / 9');

  protected readonly fuente = computed(() => {
    const a = this.visor.actual();
    return a ? fuenteDeVideo(a.video.urlVideo) : null;
  });

  protected readonly urlSegura = computed(() => {
    const f = this.fuente();
    return f?.tipo === 'incrustado'
      ? this.sanitizer.bypassSecurityTrustResourceUrl(
          urlIncrustada(f, { automatico: true, controles: true }),
        )
      : null;
  });

  protected readonly rotuloTipo = computed(() =>
    this.visor.actual()?.video.tipo === 'pasos' ? 'Paso a paso' : 'Descripción',
  );

  private tope?: ReturnType<typeof setTimeout>;

  constructor() {
    effect(() => {
      const abierto = this.visor.actual() !== null;
      const d = this.dialogo().nativeElement;
      if (abierto && !d.open) {
        this.cerrando.set(false);
        this.proporcion.set('16 / 9');
        d.showModal();
      } else if (!abierto && d.open) {
        d.close();
      }
    });
  }

  /** Primero la animación de salida; el diálogo se cierra al terminar. */
  protected cerrar(): void {
    if (!this.dialogo().nativeElement.open || this.cerrando()) return;
    this.cerrando.set(true);
    this.tope = setTimeout(() => this.terminarCierre(), TOPE_CIERRE_MS);
  }

  protected alTerminarAnimacion(e: AnimationEvent): void {
    // Solo la del propio diálogo: la del ::backdrop y las de adentro también burbujean.
    if (this.cerrando() && e.target === this.dialogo().nativeElement && !e.pseudoElement) {
      this.terminarCierre();
    }
  }

  private terminarCierre(): void {
    clearTimeout(this.tope);
    if (!this.cerrando()) return;
    this.cerrando.set(false);
    this.visor.cerrar();
  }

  /** `Esc` cierra, pero con la misma animación que el botón. */
  protected alCancelar(e: Event): void {
    e.preventDefault();
    this.cerrar();
  }

  /** Un clic en el velo cae en el propio diálogo, no en su contenido. */
  protected alClicar(e: MouseEvent): void {
    if (e.target === this.dialogo().nativeElement) this.cerrar();
  }

  protected alCargar(e: Event, inicio: number): void {
    const el = e.target as HTMLVideoElement;
    if (el.videoWidth && el.videoHeight) {
      this.proporcion.set(`${el.videoWidth} / ${el.videoHeight}`);
    }
    if (inicio > 0 && inicio < el.duration) el.currentTime = inicio;
    el.play().catch(() => {
      // Sin permiso para reproducir solo: quedan los controles nativos.
    });
  }
}
