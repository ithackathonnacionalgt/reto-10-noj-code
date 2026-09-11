import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
  linkedSignal,
} from '@angular/core';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { catchError, map, of, startWith, switchMap } from 'rxjs';
import { CatalogoApi } from '../../core/api/catalogo-api';
import { ErrorApi } from '../../core/api/error-api.interceptor';
// Con alias: `TramiteDetalle` ya es el nombre de este componente.
import type { TramiteDetalle as FichaTramite } from '../../core/models/catalogo.model';
import {
  ETIQUETA_CALIDAD_DATOS,
  ETIQUETA_MODALIDAD,
  ETIQUETA_MODO_EJECUCION,
} from '../../core/models/enums';
import { SIN_VIDEOS, agruparVideos } from '../../core/videos/videos-lensegua';
import { CostoPipe } from '../../shared/formato/costo.pipe';
import { TiempoRespuestaPipe } from '../../shared/formato/tiempo-respuesta.pipe';
import { Aviso } from '../../shared/ui/aviso/aviso';
import { VideoSenasReproductor } from '../../shared/video/video-senas';
import { ContenidoTramite } from './contenido-tramite/contenido-tramite';

type Estado =
  | { fase: 'cargando' }
  | { fase: 'listo'; tramite: FichaTramite }
  | { fase: 'error'; mensaje: string };

@Component({
  selector: 'app-tramite-detalle',
  imports: [
    RouterLink,
    CostoPipe,
    TiempoRespuestaPipe,
    Aviso,
    VideoSenasReproductor,
    ContenidoTramite,
  ],
  templateUrl: './tramite-detalle.html',
  styleUrl: './tramite-detalle.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TramiteDetalle {
  private readonly api = inject(CatalogoApi);

  /** Viene de la ruta gracias a `withComponentInputBinding()`. */
  readonly slug = input.required<string>();

  private readonly resultado = toSignal(
    toObservable(this.slug).pipe(
      switchMap((slug) =>
        this.api.obtenerTramite(slug).pipe(
          map((tramite): Estado => ({ fase: 'listo', tramite })),
          catchError((e: unknown) =>
            of<Estado>({
              fase: 'error',
              mensaje:
                e instanceof ErrorApi ? e.message : 'No se pudo cargar el trámite.',
            }),
          ),
          startWith<Estado>({ fase: 'cargando' }),
        ),
      ),
    ),
    { initialValue: { fase: 'cargando' } as Estado },
  );

  readonly estado = this.resultado;

  /**
   * Etiqueta de modalidad, omitida cuando repetiría a "Disponible en línea".
   *
   * Un trámite con `disponibleEnLinea: true` y `modalidad: 'en_linea'` mostraba
   * dos pastillas seguidas diciendo lo mismo.
   */
  readonly etiquetaModalidad = computed(() => {
    const r = this.resultado();
    if (r.fase !== 'listo') return null;
    const t = r.tramite;
    if (!t.modalidad) return null;
    if (t.disponibleEnLinea && t.modalidad === 'en_linea') return null;
    return ETIQUETA_MODALIDAD[t.modalidad];
  });

  readonly etiquetaModo = computed(() => {
    const r = this.resultado();
    return r.fase === 'listo'
      ? ETIQUETA_MODO_EJECUCION[r.tramite.modoEjecucion]
      : null;
  });

  readonly etiquetaCalidad = ETIQUETA_CALIDAD_DATOS;
  readonly etiquetaModalidadCompleta = ETIQUETA_MODALIDAD;

  /** Primera letra de las siglas, para el avatar de la institución. */
  protected readonly inicial = computed(() => {
    const r = this.resultado();
    if (r.fase !== 'listo') return '';
    const i = r.tramite.institucion;
    return (i.siglas ?? i.nombre).trim().charAt(0).toUpperCase();
  });

  protected readonly datosIncompletos = computed(() => {
    const r = this.resultado();
    if (r.fase !== 'listo') return false;
    const c = r.tramite.calidadDatos;
    return c === 'parcial' || c === 'necesita_revision';
  });

  /* --- Videos LENSEGUA ---------------------------------------------------- */

  protected readonly videos = computed(() => {
    const r = this.resultado();
    return r.fase === 'listo' ? agruparVideos(r.tramite.accesibilidad?.videosSenas) : SIN_VIDEOS;
  });


  protected readonly hayVideos = computed(() => {
    const v = this.videos();
    return v.pasos !== null || v.descripcion !== null;
  });

  /** Arranca en el paso a paso; si el trámite no lo tiene, en la descripción. */
  protected readonly pestana = linkedSignal<'pasos' | 'descripcion'>(() =>
    this.videos().pasos ? 'pasos' : 'descripcion',
  );

  protected readonly videoActivo = computed(() => this.videos()[this.pestana()]);
}
