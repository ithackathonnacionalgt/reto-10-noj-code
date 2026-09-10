import { ChangeDetectionStrategy, Component, input } from '@angular/core';

/**
 * Bloque de mensaje para estados vacios, de carga y de error.
 *
 * Un solo componente para los tres casos: mantiene el tono y el espaciado
 * consistentes en toda la app, y evita que cada vista invente su propio cartel.
 */
@Component({
  selector: 'app-aviso',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { '[attr.data-tono]': 'tono()' },
  template: `
    <div class="aviso" [attr.role]="tono() === 'error' ? 'alert' : null">
      @if (icono()) {
        <span class="icono" aria-hidden="true">{{ icono() }}</span>
      }
      <div class="cuerpo">
        @if (titulo()) {
          <p class="titulo">{{ titulo() }}</p>
        }
        <ng-content />
      </div>
    </div>
  `,
  styles: `
    :host {
      display: block;
    }

    .aviso {
      display: flex;
      gap: 0.75rem;
      align-items: flex-start;
      padding: 1.25rem;
      border: 1px solid var(--color-borde);
      border-radius: var(--radio-lg);
      background: var(--color-superficie);
      color: var(--color-texto-suave);
    }

    .icono {
      font-size: 1.25rem;
      line-height: 1.4;
    }

    .cuerpo {
      flex: 1;
      min-width: 0;
    }

    .titulo {
      margin: 0 0 0.25rem;
      color: var(--color-texto);
      font-weight: 600;
    }

    :host([data-tono='error']) .aviso {
      border-color: var(--color-error-borde);
      background: var(--color-error-fondo);
      color: var(--color-error-texto);

      .titulo {
        color: var(--color-error-texto);
      }
    }
  `,
})
export class Aviso {
  readonly tono = input<'neutro' | 'error'>('neutro');
  readonly titulo = input<string | null>(null);
  readonly icono = input<string | null>(null);
}
