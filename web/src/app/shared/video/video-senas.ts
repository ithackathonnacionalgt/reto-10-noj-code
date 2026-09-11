import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  computed,
  effect,
  inject,
  input,
  signal,
  viewChild,
} from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';
import { AccesibilidadStore } from '../../core/accesibilidad/accesibilidad.store';
import type { VideoSenas } from '../../core/models/catalogo.model';
import { fuenteDeVideo, urlIncrustada } from './fuente-video';
import { VisorVideo } from './visor-video.service';

/**
 * Reproductor de un video LENSEGUA.
 *
 * Arranca solo y en silencio, en bucle. Con «reducir movimiento» (del panel
 * de accesibilidad o del sistema) espera a que la persona le dé play.
 *
 * - `panel`: el de la ficha. Toma la proporción del video y muestra
 *   controles de reproducción, sonido y ampliar.
 * - `vista-previa`: el de la tarjeta. Llena el cuadro que le dan y solo
 *   ofrece ampliar.
 */
@Component({
  selector: 'app-video-senas',
  templateUrl: './video-senas.html',
  styleUrl: './video-senas.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  // `compacto` y no `vista-previa`: el host vive en la plantilla de la
  // tarjeta, y los estilos de su `.vista-previa` lo alcanzarían también.
  host: {
    '[class.compacto]': "variante() === 'vista-previa'",
    '[class.pausado]': '!reproduciendo()',
    '[class.cargando]': '!cargado()',
  },
})
export class VideoSenasReproductor {
  readonly video = input.required<VideoSenas>();
  readonly variante = input<'panel' | 'vista-previa'>('panel');
  readonly etiqueta = input('LENSEGUA');

  private readonly visor = inject(VisorVideo);
  private readonly a11y = inject(AccesibilidadStore);
  private readonly sanitizer = inject(DomSanitizer);
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly reproductor = viewChild<ElementRef<HTMLVideoElement>>('reproductor');

  private readonly movimientoReducidoSistema =
    typeof matchMedia === 'function' &&
    matchMedia('(prefers-reduced-motion: reduce)').matches;

  protected readonly automatico = computed(
    () => !this.a11y.reducirMovimiento() && !this.movimientoReducidoSistema,
  );

  protected readonly fuente = computed(() => fuenteDeVideo(this.video().urlVideo));

  protected readonly urlIncrustada = computed(() => {
    const f = this.fuente();
    return f.tipo === 'incrustado'
      ? this.sanitizer.bypassSecurityTrustResourceUrl(
          urlIncrustada(f, { automatico: this.automatico(), controles: false }),
        )
      : null;
  });

  protected readonly reproduciendo = signal(false);
  /** Hasta el primer cuadro se ve un indicador, no un rectángulo negro. */
  protected readonly cargado = signal(false);
  protected readonly silenciado = signal(true);
  protected readonly proporcion = signal('16 / 9');

  /* Pausas que puso el componente, no la persona: solo esas se reanudan. */
  private pausadoPorVisor = false;
  private pausadoFuera = false;
  private visible = true;

  constructor() {
    // Mientras el visor ampliado está abierto, el video de la página espera.
    effect(() => {
      const abierto = this.visor.actual() !== null;
      const el = this.reproductor()?.nativeElement;
      if (!el) return;
      if (abierto && !el.paused) {
        this.pausadoPorVisor = true;
        el.pause();
      } else if (!abierto && this.pausadoPorVisor) {
        this.pausadoPorVisor = false;
        this.reproducir();
      }
    });

    // Fuera de la pantalla no gasta batería ni datos.
    if (typeof IntersectionObserver === 'function') {
      const observador = new IntersectionObserver(([entrada]) => {
        this.visible = entrada.isIntersecting;
        const el = this.reproductor()?.nativeElement;
        if (!el) return;
        if (!this.visible && !el.paused) {
          this.pausadoFuera = true;
          el.pause();
        } else if (this.visible && this.pausadoFuera) {
          this.pausadoFuera = false;
          this.reproducir();
        }
      });
      observador.observe(this.host.nativeElement);
      inject(DestroyRef).onDestroy(() => observador.disconnect());
    }
  }

  protected alCargar(e: Event): void {
    const el = e.target as HTMLVideoElement;
    if (el.videoWidth && el.videoHeight) {
      this.proporcion.set(`${el.videoWidth} / ${el.videoHeight}`);
    }
    if (this.automatico() && this.visible && this.visor.actual() === null) {
      this.reproducir();
    }
  }

  protected alternarReproduccion(): void {
    const el = this.reproductor()?.nativeElement;
    if (!el) return;
    if (el.paused) this.reproducir();
    else el.pause();
  }

  protected alternarSonido(): void {
    this.silenciado.update((s) => !s);
  }

  protected ampliar(): void {
    this.visor.abrir(this.video(), this.reproductor()?.nativeElement.currentTime ?? 0);
  }

  private reproducir(): void {
    const el = this.reproductor()?.nativeElement;
    if (!el) return;
    el.muted = this.silenciado();
    el.play().catch(() => this.reproduciendo.set(false));
  }
}
