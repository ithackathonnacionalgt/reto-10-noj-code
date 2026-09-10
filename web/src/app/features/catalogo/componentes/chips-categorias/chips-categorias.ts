import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
  output,
  signal,
} from '@angular/core';
import type { Categoria } from '../../../../core/models/catalogo.model';

/** Una categoría con cuántos trámites tiene realmente. */
export interface CategoriaConteo extends Categoria {
  conteo: number;
}

/**
 * Filtro rápido por categoría, en forma de etiquetas.
 *
 * Muestra el conteo real de cada categoría y deshabilita las que están vacías.
 * No es un detalle estético: el catálogo tiene 10 categorías publicadas y solo
 * 4 con trámites, y esa brecha es justamente lo que el reto pide hacer visible.
 * Ocultarlas daría una idea falsa de cobertura.
 */
@Component({
  selector: 'app-chips-categorias',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './chips-categorias.html',
  styleUrl: './chips-categorias.scss',
})
export class ChipsCategorias {
  readonly categorias = input.required<CategoriaConteo[]>();
  readonly seleccionada = input<string | undefined>(undefined);
  readonly totalTramites = input(0);

  readonly elegir = output<string | null>();

  protected readonly mostrarVacias = signal(false);

  private readonly ordenadas = computed(() =>
    [...this.categorias()].sort(
      (a, b) => b.conteo - a.conteo || a.nombre.localeCompare(b.nombre, 'es'),
    ),
  );

  /** Categorías que hoy tienen al menos un trámite. */
  protected readonly conDatos = computed(() =>
    this.ordenadas().filter((c) => c.conteo > 0),
  );

  /**
   * Categorías sin trámites.
   *
   * Van plegadas: la pantalla principal tiene que estar limpia y seis
   * etiquetas apagadas son ruido. Pero no se eliminan — la brecha entre lo
   * que el catálogo declara y lo que publica es parte de lo que hay que
   * mostrar, así que quedan a un clic.
   */
  protected readonly sinDatos = computed(() =>
    this.ordenadas().filter((c) => c.conteo === 0),
  );

  protected readonly visibles = computed(() =>
    this.mostrarVacias() ? this.ordenadas() : this.conDatos(),
  );

  protected alternar(id: string): void {
    this.elegir.emit(this.seleccionada() === id ? null : id);
  }

  protected alternarVacias(): void {
    this.mostrarVacias.update((v) => !v);
  }
}
