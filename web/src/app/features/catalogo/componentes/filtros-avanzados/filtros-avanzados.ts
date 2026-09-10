import { ChangeDetectionStrategy, Component, computed, input, output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import type {
  Departamento,
  FiltrosTramite,
  Institucion,
} from '../../../../core/models/catalogo.model';
import {
  ETIQUETA_MODALIDAD,
  ETIQUETA_ORDEN,
  ETIQUETA_TIPO_COSTO,
  MODALIDADES,
  ORDENES,
  TIPOS_COSTO,
} from '../../../../core/models/enums';

/** Cambio puntual de filtros. `null` significa "quitar este filtro". */
export type CambioFiltro = Partial<Record<keyof FiltrosTramite, unknown>>;

/** Institución con cuántos trámites tiene, para no ofrecer opciones vacías. */
export interface InstitucionConteo extends Institucion {
  conteo: number;
}

/**
 * Filtros avanzados en panel desplegable, al lado del buscador.
 *
 * Van plegados a propósito: la pantalla principal tiene que verse limpia, y
 * quien no necesita afinar la búsqueda no debería toparse con siete controles.
 * El botón muestra cuántos filtros hay puestos para que nunca queden ocultos
 * sin que la persona lo sepa.
 */
@Component({
  selector: 'app-filtros-avanzados',
  imports: [FormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './filtros-avanzados.html',
  styleUrl: './filtros-avanzados.scss',
})
export class FiltrosAvanzados {
  readonly filtros = input.required<FiltrosTramite>();
  readonly instituciones = input<InstitucionConteo[]>([]);
  readonly departamentos = input<Departamento[]>([]);
  /** Cuántos trámites del catálogo tienen departamento asignado. */
  readonly conDepartamento = input(0);

  readonly cambiar = output<CambioFiltro>();
  readonly limpiar = output<void>();

  protected readonly abierto = signal(false);

  protected readonly modalidades = MODALIDADES.map((v) => ({
    valor: v,
    etiqueta: ETIQUETA_MODALIDAD[v],
  }));
  protected readonly tiposCosto = TIPOS_COSTO.map((v) => ({
    valor: v,
    etiqueta: ETIQUETA_TIPO_COSTO[v],
  }));
  protected readonly ordenes = ORDENES.map((v) => ({
    valor: v,
    etiqueta: ETIQUETA_ORDEN[v],
  }));

  /** Instituciones con trámites primero; las vacías, al final y marcadas. */
  protected readonly institucionesOrdenadas = computed(() =>
    [...this.instituciones()].sort(
      (a, b) => b.conteo - a.conteo || a.nombre.localeCompare(b.nombre, 'es'),
    ),
  );

  /**
   * Cuántos filtros están puestos.
   *
   * `q` y `categoriaId` no cuentan acá: tienen su propio control visible
   * (el buscador y las etiquetas). `orden` tampoco: no reduce el resultado.
   */
  protected readonly cantidadActivos = computed(() => {
    const f = this.filtros();
    return [
      f.institucionId,
      f.modalidad,
      f.tipoCosto,
      f.departamentoId,
      f.disponibleEnLinea,
    ].filter(Boolean).length;
  });

  protected alternar(): void {
    this.abierto.update((v) => !v);
  }

  protected cerrar(): void {
    this.abierto.set(false);
  }

  /** Un `''` del select equivale a quitar el filtro, no a filtrar por vacío. */
  protected fijar(clave: keyof FiltrosTramite, valor: unknown): void {
    this.cambiar.emit({ [clave]: valor === '' ? null : valor });
  }
}
