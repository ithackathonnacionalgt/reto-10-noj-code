import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import type { MetaPaginacion } from '../../../core/models/catalogo.model';

/** Controles de paginacion. No navega: emite la pagina y la pagina decide. */
@Component({
  selector: 'app-paginacion',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @let m = meta();
    @if (m.totalPaginas > 1) {
      <nav class="paginacion" aria-label="Paginación de resultados">
        <button
          type="button"
          class="secundario"
          [disabled]="!hayAnterior()"
          (click)="ir.emit(m.page - 1)"
        >
          ← Anterior
        </button>

        <span aria-live="polite">Página {{ m.page }} de {{ m.totalPaginas }}</span>

        <button
          type="button"
          class="secundario"
          [disabled]="!haySiguiente()"
          (click)="ir.emit(m.page + 1)"
        >
          Siguiente →
        </button>
      </nav>
    }
  `,
  styles: `
    .paginacion {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      justify-content: center;
      gap: 1rem;
      margin-top: 2rem;
      font-size: 0.9rem;
    }
  `,
})
export class Paginacion {
  readonly meta = input.required<MetaPaginacion>();
  readonly ir = output<number>();

  protected readonly hayAnterior = computed(() => this.meta().page > 1);
  protected readonly haySiguiente = computed(
    () => this.meta().page < this.meta().totalPaginas,
  );
}
