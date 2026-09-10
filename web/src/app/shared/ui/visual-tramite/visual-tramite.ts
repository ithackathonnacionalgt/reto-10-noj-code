import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import type { Tramite } from '../../../core/models/catalogo.model';

/** Slugs de categoría que tienen ilustración propia. */
const CON_ICONO = new Set([
  'medio-ambiente',
  'economia',
  'trabajo',
  'educacion-cultura-y-deporte',
  'seguridad',
  'energia',
  'comunicaciones-y-transporte',
  'territorio-vivienda-e-infraestructura',
  'mediacion-y-dialogo',
  'manejo-de-animales-y-vegetales',
]);

/**
 * Imagen de un trámite.
 *
 * El catálogo no publica fotos ni logos (`urlLogo` viene null en las seis
 * instituciones), así que en vez de inventar imágenes se genera una a partir de
 * la categoría: un ícono sobre un tono propio. Es determinista —el mismo trámite
 * se ve siempre igual—, no depende de assets externos, no puede romperse y
 * ayuda a distinguir tipos de trámite de un vistazo.
 *
 * Si algún día la institución publica su logo, se usa ese en su lugar.
 */
@Component({
  selector: 'app-visual-tramite',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './visual-tramite.html',
  styleUrl: './visual-tramite.scss',
  host: { '[attr.data-cat]': 'clave()' },
})
export class VisualTramite {
  readonly tramite = input.required<Tramite>();

  protected readonly logo = computed(() => this.tramite().institucion.urlLogo);

  /** Categoría principal, o la primera si ninguna está marcada como principal. */
  private readonly categoria = computed(() => {
    const cats = this.tramite().categorias;
    return cats.find((c) => c.esPrincipal) ?? cats[0];
  });

  /** Slug usado para elegir ícono y tono; `otro` cuando no hay coincidencia. */
  protected readonly clave = computed(() => {
    const slug = this.categoria()?.slug;
    return slug && CON_ICONO.has(slug) ? slug : 'otro';
  });

  protected readonly nombreCategoria = computed(
    () => this.categoria()?.nombre ?? 'Trámite',
  );

  protected readonly siglas = computed(() => {
    const i = this.tramite().institucion;
    return i.siglas ?? i.nombre;
  });
}
