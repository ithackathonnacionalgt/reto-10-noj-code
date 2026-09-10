import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-no-encontrado',
  imports: [RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="contenedor bloque">
      <p class="codigo">404</p>
      <h1>Página no encontrada</h1>
      <p class="bajada">La dirección que abriste no existe en el catálogo.</p>
      <p><a class="boton" routerLink="/">Ir al listado de trámites</a></p>
    </div>
  `,
  styles: `
    .bloque {
      padding-block: 4rem;
      text-align: center;
    }

    .codigo {
      margin: 0;
      color: var(--color-texto-suave);
      font-size: 3rem;
      font-weight: 800;
      line-height: 1;
    }

    h1 {
      margin: 0.5rem 0;
      font-size: 1.5rem;
    }

    .bajada {
      margin: 0 0 1.5rem;
      color: var(--color-texto-suave);
    }
  `,
})
export class NoEncontrado {}
