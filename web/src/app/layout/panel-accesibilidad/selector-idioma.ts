import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { IDIOMAS, IdiomaStore } from '../../core/idioma/idioma.store';

/**
 * Selector de idioma del panel de accesibilidad: español y tres idiomas
 * mayas. Cada opción muestra el nombre en su propio idioma, que es como la
 * persona lo reconoce, y su código ISO.
 */
@Component({
  selector: 'app-selector-idioma',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="idiomas" role="group" aria-label="Idioma de la página">
      @for (i of opciones; track i.codigo) {
        <button
          type="button"
          class="idioma"
          [attr.aria-pressed]="idioma.codigo() === i.codigo"
          [attr.lang]="i.lang"
          (click)="idioma.seleccionar(i.codigo)"
        >
          <span class="codigo" aria-hidden="true">{{ i.codigo }}</span>
          <span class="textos">
            <span class="nativo">{{ i.nativo }}</span>
            <span class="detalle" lang="es">{{ i.detalle }}</span>
          </span>
        </button>
      }
    </div>
    <p class="nota">Prototipo: por ahora se traduce la pantalla de inicio.</p>
  `,
  styles: `
    :host {
      display: block;
    }

    .idiomas {
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: var(--e-2);
    }

    .idioma {
      display: flex;
      align-items: center;
      justify-content: flex-start;
      gap: var(--e-3);
      min-width: 0;
      padding: var(--e-3);
      border: 1px solid var(--color-borde);
      border-radius: var(--radio-lg);
      background: var(--color-superficie-alt);
      color: var(--color-texto-medio);
      text-align: left;
      transition:
        border-color var(--transicion),
        background-color var(--transicion),
        color var(--transicion);

      &:hover:not(:disabled) {
        border-color: var(--color-acento-borde);
        background: var(--color-superficie);
        color: var(--color-texto);
      }

      &[aria-pressed='true'] {
        border-color: var(--color-acento);
        background: var(--color-acento-suave);
        color: var(--color-acento-texto);

        .codigo {
          background: var(--color-acento);
          color: var(--color-sobre-acento);
        }
      }
    }

    /* El código ISO en una pastilla: identifica el idioma sin depender de
       banderas, que no representan idiomas. */
    .codigo {
      display: grid;
      place-items: center;
      flex: none;
      width: 2.25rem;
      height: 2.25rem;
      border-radius: var(--radio);
      background: var(--color-superficie);
      color: var(--color-acento-texto);
      box-shadow: var(--sombra-1);
      font-family: var(--fuente-mono);
      font-size: var(--texto-xs);
      font-weight: 700;
      text-transform: uppercase;
      transition:
        background-color var(--transicion),
        color var(--transicion);
    }

    .textos {
      display: flex;
      flex-direction: column;
      min-width: 0;
      line-height: 1.25;
    }

    .nativo {
      font-size: var(--texto-sm);
      font-weight: 700;
      overflow-wrap: anywhere;
    }

    .detalle {
      color: var(--color-texto-suave);
      font-size: var(--texto-xs);
      font-weight: 500;
    }

    .nota {
      margin-top: var(--e-2);
      color: var(--color-texto-suave);
      font-size: var(--texto-xs);
    }
  `,
})
export class SelectorIdioma {
  protected readonly idioma = inject(IdiomaStore);
  protected readonly opciones = IDIOMAS;
}
