import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import type { TramiteDetalle } from '../../../core/models/catalogo.model';
import { prepararContenido } from './preparar-contenido';

/**
 * El cuerpo de la ficha: qué es el trámite, qué hay que llevar, qué pasos
 * seguir y en qué norma se basa. Cada sección aparece solo si el catálogo
 * tiene datos para ella; el paso a paso, si falta, lo dice en vez de
 * desaparecer, porque es lo que la persona vino a buscar.
 */
@Component({
  selector: 'app-contenido-tramite',
  templateUrl: './contenido-tramite.html',
  styleUrl: './contenido-tramite.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ContenidoTramite {
  readonly tramite = input.required<TramiteDetalle>();
  /** Con video en lengua de señas, si faltan los pasos escritos se lo sugiere. */
  readonly conVideo = input(false);

  protected readonly c = computed(() => prepararContenido(this.tramite()));
}
