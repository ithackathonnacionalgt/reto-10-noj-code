import { ChangeDetectionStrategy, Component, input } from '@angular/core';

export type NombreIconoA11y =
  | 'persona'
  | 'cerrar'
  | 'check'
  | 'restablecer'
  | 'texto-menos'
  | 'texto-mas'
  | 'ojo'
  | 'libro'
  | 'calma'
  | 'teclado'
  | 'contraste'
  | 'sin-color'
  | 'enlace'
  | 'titulos'
  | 'fuente'
  | 'espaciado'
  | 'lupa'
  | 'cursor'
  | 'guia'
  | 'foco'
  | 'pausa'
  | 'voz';

/**
 * Íconos del panel de accesibilidad, en un solo lugar y con un solo trazo
 * (24 px, línea de 1.9): el panel se lee como una familia y no como una
 * colección de dibujos sueltos. Siempre decorativos: el nombre accesible lo
 * pone el botón que los contiene.
 */
@Component({
  selector: 'app-icono-a11y',
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: `
    :host {
      display: inline-grid;
      place-items: center;
      width: 1.25rem;
      height: 1.25rem;
      flex: none;
    }
    svg {
      width: 100%;
      height: 100%;
    }
  `,
  template: `
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9"
         stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">
      @switch (nombre()) {
        @case ('persona') {
          <circle cx="12" cy="4.5" r="1.9" fill="currentColor" stroke="none" />
          <path d="M4.5 8.5 12 10l7.5-1.5M12 10v4.5m0 0-3 6m3-6 3 6" />
        }
        @case ('cerrar') {
          <path d="M6.5 6.5l11 11M17.5 6.5l-11 11" />
        }
        @case ('check') {
          <path d="m5 12.5 4.5 4.5L19 7.5" stroke-width="3" />
        }
        @case ('restablecer') {
          <path d="M3.5 12a8.5 8.5 0 1 0 2.6-6.1M3.5 4v4.5H8" />
        }
        @case ('texto-menos') {
          <path d="M3 18 8 6l5 12M4.8 14h6.4M15.5 12h6" />
        }
        @case ('texto-mas') {
          <path d="M3 18 8 6l5 12M4.8 14h6.4M15.5 12h6M18.5 9v6" />
        }
        @case ('ojo') {
          <path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12Z" />
          <circle cx="12" cy="12" r="3" />
        }
        @case ('libro') {
          <path d="M12 7.5V20M3 5.5h5.5A3.5 3.5 0 0 1 12 9a3.5 3.5 0 0 1 3.5-3.5H21V18h-5.5A3.5 3.5 0 0 0 12 20a3.5 3.5 0 0 0-3.5-2H3Z" />
        }
        @case ('calma') {
          <path d="M2.5 9c2.4-1.8 4.6-1.8 7 0s4.6 1.8 7 0 3.8-1.8 5 0M2.5 15c2.4-1.8 4.6-1.8 7 0s4.6 1.8 7 0 3.8-1.8 5 0" />
        }
        @case ('teclado') {
          <rect x="2.5" y="6" width="19" height="12" rx="2.5" />
          <path d="M6.5 10h.01M10 10h.01M13.5 10h.01M17 10h.01M7.5 14h9" />
        }
        @case ('contraste') {
          <circle cx="12" cy="12" r="9" />
          <path d="M12 3a9 9 0 0 1 0 18Z" fill="currentColor" />
        }
        @case ('sin-color') {
          <path d="M12 3.5s6 6.3 6 10.5a6 6 0 0 1-12 0c0-4.2 6-10.5 6-10.5Z" />
          <path d="M3.5 3.5l17 17" />
        }
        @case ('enlace') {
          <path d="M10 14a4.5 4.5 0 0 0 6.4 0l3-3a4.5 4.5 0 0 0-6.4-6.4l-1 1" />
          <path d="M14 10a4.5 4.5 0 0 0-6.4 0l-3 3a4.5 4.5 0 0 0 6.4 6.4l1-1" />
        }
        @case ('titulos') {
          <path d="M5 5v10M13 5v10M5 10h8M16.5 8.5l2.5-2v8.5M4 19.5h16" />
        }
        @case ('fuente') {
          <path d="M4 7V5h16v2M12 5v14M9 19h6" />
        }
        @case ('espaciado') {
          <path d="M10 6h11M10 12h11M10 18h11M5 4v16M3 6l2-2 2 2M3 18l2 2 2-2" />
        }
        @case ('lupa') {
          <circle cx="10.5" cy="10.5" r="6.5" />
          <path d="m20 20-4.5-4.5M8 10.5h5M10.5 8v5" />
        }
        @case ('cursor') {
          <path d="M5 3.5 18.5 10l-5.9 1.7-2.1 5.8Z" />
          <path d="m13 12.5 5 5" />
        }
        @case ('guia') {
          <path d="M4 5h16M4 19h11" />
          <rect x="2.5" y="9" width="19" height="6" rx="1.5" />
        }
        @case ('foco') {
          <path d="M4 8.5V6a2 2 0 0 1 2-2h2.5M15.5 4H18a2 2 0 0 1 2 2v2.5M20 15.5V18a2 2 0 0 1-2 2h-2.5M8.5 20H6a2 2 0 0 1-2-2v-2.5" />
          <circle cx="12" cy="12" r="3.2" />
        }
        @case ('pausa') {
          <circle cx="12" cy="12" r="9" />
          <path d="M10 9v6M14 9v6" />
        }
        @case ('voz') {
          <path d="M11 5 6.5 9H3.5v6h3L11 19Z" />
          <path d="M15.5 8.5a5 5 0 0 1 0 7M18.5 5.5a9 9 0 0 1 0 13" />
        }
      }
    </svg>
  `,
})
export class IconoA11y {
  readonly nombre = input.required<NombreIconoA11y>();
}
