import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import type { Tramite } from '../../../core/models/catalogo.model';
import { ETIQUETA_CALIDAD_DATOS } from '../../../core/models/enums';
import { CostoPipe } from '../../formato/costo.pipe';
import { TiempoRespuestaPipe } from '../../formato/tiempo-respuesta.pipe';
import { VisualTramite } from '../visual-tramite/visual-tramite';

/**
 * Tarjeta de un trámite en un listado.
 *
 * Recibe el trámite y nada más: se reutiliza en la portada, en el listado
 * filtrado y en un futuro bloque de "relacionados" sin tocarla.
 */
@Component({
  selector: 'app-tarjeta-tramite',
  imports: [RouterLink, VisualTramite, CostoPipe, TiempoRespuestaPipe],
  templateUrl: './tarjeta-tramite.html',
  styleUrl: './tarjeta-tramite.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TarjetaTramite {
  readonly tramite = input.required<Tramite>();

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
}
