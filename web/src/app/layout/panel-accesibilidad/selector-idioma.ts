import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { IDIOMAS, IdiomaStore, type CodigoIdioma } from '../../core/idioma/idioma.store';

/**
 * Selector de idioma del panel de accesibilidad: español y tres idiomas
 * mayas, en un desplegable. Es un `<select>` nativo con estilo propio: en el
 * teléfono abre el selector del sistema, y el teclado y el lector de pantalla
 * lo manejan sin nada extra. Cada idioma aparece con su nombre en ese mismo
 * idioma, que es como la persona lo reconoce.
 */
@Component({
  selector: 'app-selector-idioma',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <label class="sr-only" for="selector-idioma">Idioma de la página</label>
    <div class="campo">
      <svg class="globo" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"
           stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
        <circle cx="12" cy="12" r="9" />
        <path d="M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18" />
      </svg>
      <select id="selector-idioma" (change)="cambiar($event)">
        @for (i of opciones; track i.codigo) {
          <option [value]="i.codigo" [selected]="i.codigo === idioma.codigo()" [attr.lang]="i.lang">
            {{ i.nativo }}
          </option>
        }
      </select>
      <svg class="flecha" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
           stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
        <path d="m6 9 6 6 6-6" />
      </svg>
    </div>
  `,
  styles: `
    :host {
      display: block;
    }

    .campo {
      position: relative;
    }

    select {
      width: 100%;
      height: 2.75rem;
      padding: 0 var(--e-7) 0 calc(var(--e-4) + 1.75rem);
      border: 1px solid var(--color-borde);
      border-radius: var(--radio-lg);
      background: var(--color-superficie-alt);
      color: var(--color-texto);
      font: inherit;
      font-size: var(--texto-sm);
      font-weight: 600;
      appearance: none;
      cursor: pointer;
      transition:
        border-color var(--transicion),
        background-color var(--transicion);

      &:hover {
        border-color: var(--color-acento-borde);
        background: var(--color-superficie);
      }

      &:focus-visible {
        border-color: var(--color-acento);
        outline: 3px solid var(--color-acento-suave);
        outline-offset: 0;
      }
    }

    /* Íconos encima del campo, sin robarle el clic. */
    .globo,
    .flecha {
      position: absolute;
      top: 50%;
      width: 1.15rem;
      height: 1.15rem;
      translate: 0 -50%;
      pointer-events: none;
    }

    .globo {
      left: var(--e-4);
      color: var(--color-acento-texto);
    }

    .flecha {
      right: var(--e-4);
      color: var(--color-texto-suave);
    }
  `,
})
export class SelectorIdioma {
  protected readonly idioma = inject(IdiomaStore);
  protected readonly opciones = IDIOMAS;

  protected cambiar(e: Event): void {
    this.idioma.seleccionar((e.target as HTMLSelectElement).value as CodigoIdioma);
  }
}
