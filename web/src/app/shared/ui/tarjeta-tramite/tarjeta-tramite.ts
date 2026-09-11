import {
  ChangeDetectionStrategy,
  Component,
  DOCUMENT,
  DestroyRef,
  ElementRef,
  computed,
  effect,
  inject,
  input,
  signal,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import type { Subscription } from 'rxjs';
import type { Tramite, VideoSenas } from '../../../core/models/catalogo.model';
import { ETIQUETA_CALIDAD_DATOS } from '../../../core/models/enums';
import {
  VideosLensegua,
  agruparVideos,
  type VideosDeTramite,
} from '../../../core/videos/videos-lensegua';
import { CostoPipe } from '../../formato/costo.pipe';
import { TiempoRespuestaPipe } from '../../formato/tiempo-respuesta.pipe';
import { VideoSenasReproductor } from '../../video/video-senas';
import { VisorVideo } from '../../video/visor-video.service';
import { VistaPreviaActiva } from '../../video/vista-previa-activa';
import { VisualTramite } from '../visual-tramite/visual-tramite';

/** Cursor quieto antes de abrir la vista previa: cruzar la grilla no la dispara. */
const ESPERA_APERTURA_MS = 350;
/** Margen para cruzar de la tarjeta al panel sin que se cierre en el camino. */
const ESPERA_CIERRE_MS = 140;

type Lado = 'derecha' | 'izquierda' | 'encima';

/**
 * La vista previa es la descripción corta. Si el trámite todavía no la
 * tiene, muestra el paso a paso: mejor un video en lengua de señas que
 * ninguno. El rótulo del cuadro dice cuál es.
 */
function videoDeVistaPrevia(v: VideosDeTramite): VideoSenas | null {
  return v.descripcion ?? v.pasos;
}

/**
 * Tarjeta de un trámite en un listado.
 *
 * Recibe el trámite y nada más: se reutiliza en la portada, en el listado
 * filtrado y en un futuro bloque de "relacionados" sin tocarla.
 *
 * Con un puntero que puede «pasar por encima» (mouse, trackpad), dejar el
 * cursor sobre la tarjeta abre al lado un cuadro del mismo tamaño con la
 * descripción del trámite en LENSEGUA, reproduciéndose en silencio. En
 * pantallas táctiles no hay hover: ahí la tarjeta muestra un botón que abre el
 * video directo en el visor.
 */
@Component({
  selector: 'app-tarjeta-tramite',
  imports: [RouterLink, VisualTramite, CostoPipe, TiempoRespuestaPipe, VideoSenasReproductor],
  templateUrl: './tarjeta-tramite.html',
  styleUrl: './tarjeta-tramite.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[class.con-vista-previa]': 'vistaPrevia() !== null',
    '(mouseenter)': 'alEntrar()',
    '(mouseleave)': 'alSalir()',
    '(focusin)': 'alEnfocar($event)',
    '(focusout)': 'alSalirFoco($event)',
  },
})
export class TarjetaTramite {
  readonly tramite = input.required<Tramite>();

  private readonly videos = inject(VideosLensegua);
  protected readonly visor = inject(VisorVideo);
  private readonly activa = inject(VistaPreviaActiva);
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly doc = inject(DOCUMENT);

  private readonly conPuntero =
    typeof matchMedia === 'function' && matchMedia('(hover: hover) and (pointer: fine)').matches;

  /** Video de la vista previa, cuando está abierta. */
  protected readonly vistaPrevia = signal<VideoSenas | null>(null);
  protected readonly lado = signal<Lado>('derecha');

  /** Si el listado ya trae los videos, se sabe sin pedir nada si hay uno. */
  protected readonly videoConocido = computed(() =>
    agruparVideos(this.tramite().accesibilidad?.videosSenas).descripcion,
  );

  private espera?: ReturnType<typeof setTimeout>;
  private pedido?: Subscription;

  /* Dónde está la persona, según los eventos y no según `:hover`: Chrome
     pierde el `:hover` un instante cuando se quita un nodo de la página
     (el panel de la tarjeta anterior) y la vista previa no llegaba a abrir. */
  private cursorDentro = false;
  private focoDentro = false;

  protected readonly calidad = computed(
    () => ETIQUETA_CALIDAD_DATOS[this.tramite().calidadDatos],
  );

  /* Distinguen un dato real de "no lo sabemos", para atenuar el segundo en vez
     de mostrarlo con el mismo peso. */

  protected readonly tieneTiempo = computed(() => {
    const t = this.tramite().tiempoRespuesta;
    return Boolean(t?.texto ?? (t?.valor !== null && t?.unidad !== null));
  });

  protected readonly tieneCosto = computed(() => {
    const t = this.tramite();
    return t.tipoCosto === 'gratuito' || t.costo !== null;
  });

  protected readonly datosIncompletos = computed(() => {
    const c = this.tramite().calidadDatos;
    return c === 'parcial' || c === 'necesita_revision';
  });

  constructor() {
    // Otra tarjeta abrió la suya: esta se cierra.
    effect(() => {
      const duena = this.activa.actual();
      if (duena !== this && this.vistaPrevia()) this.cerrar();
    });

    inject(DestroyRef).onDestroy(() => {
      clearTimeout(this.espera);
      this.pedido?.unsubscribe();
      this.activa.soltar(this);
    });
  }

  /* --- Vista previa ------------------------------------------------------- */

  protected alEntrar(): void {
    this.cursorDentro = true;
    this.programarApertura();
  }

  protected alSalir(): void {
    this.cursorDentro = false;
    this.programarCierre();
  }

  /**
   * Solo el foco de teclado abre la vista previa. El que llega por un clic,
   * o el que el visor devuelve al botón LENSEGUA al cerrarse, no: ese botón ya
   * es la forma directa de ver el video.
   */
  protected alEnfocar(e: FocusEvent): void {
    const el = e.target as HTMLElement;
    if (!el.matches(':focus-visible') || el.classList.contains('boton-senas')) return;
    this.focoDentro = true;
    this.programarApertura();
  }

  protected alSalirFoco(e: FocusEvent): void {
    if (this.host.nativeElement.contains(e.relatedTarget as Node | null)) return;
    this.focoDentro = false;
    this.programarCierre();
  }

  private programarApertura(): void {
    if (!this.conPuntero) return;
    clearTimeout(this.espera);
    if (this.vistaPrevia() || this.pedido) return;
    // La ficha se empieza a pedir ya, en paralelo con la espera: cuando se
    // cumplen los 350 ms la respuesta suele estar (queda en memoria).
    if (!this.tramite().accesibilidad) this.videos.de(this.tramite()).subscribe();
    this.espera = setTimeout(() => this.abrir(), ESPERA_APERTURA_MS);
  }

  /** Se cierra cuando ya no queda ni el cursor ni el foco de teclado. */
  private programarCierre(): void {
    if (this.sigueAca()) return;
    clearTimeout(this.espera);
    this.espera = setTimeout(() => this.cerrar(), ESPERA_CIERRE_MS);
  }

  private abrir(): void {
    if (!this.sigueAca()) return;
    this.lado.set(this.calcularLado());
    const sub = this.videos.de(this.tramite()).subscribe((videos) => {
      this.pedido = undefined;
      const video = videoDeVistaPrevia(videos);
      // Sin video no se abre nada: un cuadro vacío al lado no le sirve a nadie.
      // Y si la respuesta tardó y el cursor ya se fue, tampoco.
      if (!video || !this.sigueAca()) return;
      this.activa.tomar(this);
      this.vistaPrevia.set(video);
    });
    this.pedido = sub.closed ? undefined : sub;
  }

  private cerrar(): void {
    this.pedido?.unsubscribe();
    this.pedido = undefined;
    this.vistaPrevia.set(null);
    this.activa.soltar(this);
  }

  /** El cursor o el foco de teclado siguen sobre la tarjeta o su panel. */
  private sigueAca(): boolean {
    return this.cursorDentro || this.focoDentro;
  }

  /**
   * Al lado que tenga lugar en la pantalla: a la derecha si entra, si no a la
   * izquierda. Si no entra en ninguno (una sola columna), va encima de la
   * propia tarjeta.
   */
  private calcularLado(): Lado {
    const r = this.host.nativeElement.getBoundingClientRect();
    const ancho = this.doc.documentElement.clientWidth;
    // El hueco es --e-4 (1rem): se mide en px según la escala de texto actual.
    const hueco = parseFloat(getComputedStyle(this.doc.documentElement).fontSize);
    if (r.right + hueco + r.width <= ancho - hueco) return 'derecha';
    if (r.left - hueco - r.width >= hueco) return 'izquierda';
    return 'encima';
  }
}
