import { ChangeDetectionStrategy, Component } from '@angular/core';

/**
 * Pie del sitio.
 *
 * La atribución a la fuente y la licencia son un requisito del reto, no un
 * adorno: por eso viven en el layout y aparecen en todas las páginas.
 */
@Component({
  selector: 'app-pie-sitio',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <footer class="pie">
      <div class="contenedor interna">
        <p>
          Datos del <strong>Catálogo Nacional de Trámites</strong>, publicados bajo
          <a
            href="https://creativecommons.org/licenses/by/4.0/deed.es"
            target="_blank"
            rel="noopener noreferrer"
            >Creative Commons Atribución 4.0</a
          >.
        </p>
        <p class="nota">
          Proyecto en construcción. La información puede estar incompleta o pendiente
          de verificación contra la fuente oficial.
        </p>
      </div>
    </footer>
  `,
  styles: `
    .pie {
      border-top: 1px solid var(--color-borde);
      background: var(--color-superficie);
      color: var(--color-texto-suave);
      font-size: 0.82rem;
    }

    .interna {
      padding-block: 1.5rem;
      /* Deja aire para que los botones flotantes no tapen el texto. */
      padding-bottom: 4.5rem;
    }

    p {
      margin: 0 0 0.3rem;
    }

    .nota {
      font-size: 0.76rem;
    }
  `,
})
export class PieSitio {}
