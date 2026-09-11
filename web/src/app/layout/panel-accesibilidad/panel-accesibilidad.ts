import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  Injector,
  afterNextRender,
  computed,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import {
  AccesibilidadStore,
  ESCALAS,
  type ClaveHerramienta,
  type IdPerfil,
} from '../../core/accesibilidad/accesibilidad.store';
import { IconoA11y, type NombreIconoA11y } from './icono-a11y';
import { SelectorIdioma } from './selector-idioma';

interface Herramienta {
  clave: ClaveHerramienta;
  /** Una o dos palabras: el ícono explica, el rótulo confirma. */
  rotulo: string;
  /** La explicación completa: `title` y nombre accesible del botón. */
  ayuda: string;
  icono: NombreIconoA11y;
}

interface Perfil {
  id: IdPerfil;
  rotulo: string;
  ayuda: string;
  icono: NombreIconoA11y;
}

const PERFILES_UI: readonly Perfil[] = [
  {
    id: 'baja-vision',
    rotulo: 'Baja visión',
    ayuda: 'Texto más grande, contraste alto, cursor grande y lupa',
    icono: 'ojo',
  },
  {
    id: 'dislexia',
    rotulo: 'Dislexia',
    ayuda: 'Tipografía legible, más espaciado y guía de lectura',
    icono: 'libro',
  },
  {
    id: 'calma',
    rotulo: 'Calma',
    ayuda: 'Sin animaciones, sin videos automáticos y sin color',
    icono: 'calma',
  },
  {
    id: 'teclado',
    rotulo: 'Teclado',
    ayuda: 'Foco muy visible, enlaces subrayados y títulos marcados',
    icono: 'teclado',
  },
];

const HERRAMIENTAS: readonly Herramienta[] = [
  { clave: 'altoContraste', rotulo: 'Contraste', ayuda: 'Contraste alto entre texto y fondo', icono: 'contraste' },
  { clave: 'escalaGrises', rotulo: 'Sin color', ayuda: 'Muestra la página en escala de grises', icono: 'sin-color' },
  { clave: 'subrayarEnlaces', rotulo: 'Enlaces', ayuda: 'Subraya y resalta todos los enlaces', icono: 'enlace' },
  { clave: 'resaltarTitulos', rotulo: 'Títulos', ayuda: 'Marca los títulos para ver la estructura de la página', icono: 'titulos' },
  { clave: 'fuenteLegible', rotulo: 'Legible', ayuda: 'Tipografía pensada para baja visión y dislexia', icono: 'fuente' },
  { clave: 'espaciadoTexto', rotulo: 'Espaciado', ayuda: 'Más espacio entre líneas, letras y palabras', icono: 'espaciado' },
  { clave: 'lupaTexto', rotulo: 'Lupa', ayuda: 'Muestra en grande el texto que está bajo el cursor', icono: 'lupa' },
  { clave: 'cursorGrande', rotulo: 'Cursor', ayuda: 'Cursor grande y de alto contraste', icono: 'cursor' },
  { clave: 'guiaLectura', rotulo: 'Guía', ayuda: 'Franja que sigue al cursor y oscurece el resto para leer línea por línea', icono: 'guia' },
  { clave: 'resaltarFoco', rotulo: 'Foco', ayuda: 'Marca muy visible en el elemento enfocado con el teclado', icono: 'foco' },
  { clave: 'reducirMovimiento', rotulo: 'Sin animar', ayuda: 'Detiene animaciones y videos que arrancan solos', icono: 'pausa' },
  { clave: 'lecturaVoz', rotulo: 'Leer', ayuda: 'Lee en voz alta el texto que toques o selecciones', icono: 'voz' },
];

/**
 * Panel de ajustes de accesibilidad.
 *
 * Maneja apertura, cierre y foco; todo el estado de preferencias vive en
 * `AccesibilidadStore`, así que otro punto de entrada puede cambiarlas sin
 * pasar por acá. Se abre también con Alt + A desde cualquier parte.
 */
@Component({
  selector: 'app-panel-accesibilidad',
  imports: [IconoA11y, SelectorIdioma],
  templateUrl: './panel-accesibilidad.html',
  styleUrl: './panel-accesibilidad.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '(document:keydown)': 'alTeclear($event)',
  },
})
export class PanelAccesibilidad {
  protected readonly a11y = inject(AccesibilidadStore);
  private readonly injector = inject(Injector);
  private readonly disparador = viewChild.required<ElementRef<HTMLButtonElement>>('disparador');
  private readonly panel = viewChild<ElementRef<HTMLElement>>('panel');

  protected readonly abierto = signal(false);
  protected readonly perfiles = PERFILES_UI;
  protected readonly herramientas = HERRAMIENTAS;
  protected readonly niveles = ESCALAS;
  protected readonly vozSoportada = typeof speechSynthesis !== 'undefined';

  protected readonly porcentaje = computed(() => this.porcentajeDe(this.a11y.escalaTexto()));

  protected readonly nivelActual = computed(() =>
    ESCALAS.indexOf(this.a11y.escalaTexto() as (typeof ESCALAS)[number]),
  );

  protected readonly enElMinimo = computed(() => this.a11y.escalaTexto() <= ESCALAS[0]);
  protected readonly enElMaximo = computed(
    () => this.a11y.escalaTexto() >= ESCALAS[ESCALAS.length - 1],
  );

  protected porcentajeDe(escala: number): string {
    return `${Math.round(escala * 100)} %`;
  }

  protected activa(clave: ClaveHerramienta): boolean {
    return this.a11y.preferencias()[clave];
  }

  protected alternar(): void {
    if (this.abierto()) this.cerrar();
    else this.abrir();
  }

  /** Al abrir, el foco entra al panel: el teclado sigue donde está la vista. */
  private abrir(): void {
    this.abierto.set(true);
    afterNextRender(() => this.panel()?.nativeElement.focus(), { injector: this.injector });
  }

  /** Al cerrar, el foco vuelve al botón que lo abrió (salvo un clic afuera). */
  protected cerrar(devolverFoco = true): void {
    if (!this.abierto()) return;
    this.abierto.set(false);
    if (devolverFoco) this.disparador().nativeElement.focus();
  }

  /** Alt + A. Se mira `code` y no `key`: funciona en cualquier distribución de teclado. */
  protected alTeclear(e: KeyboardEvent): void {
    if (e.altKey && !e.ctrlKey && !e.metaKey && e.code === 'KeyA') {
      e.preventDefault();
      this.alternar();
    }
  }
}
