import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { Cabecera } from './layout/cabecera/cabecera';
import { HerramientasAccesibilidad } from './layout/herramientas-accesibilidad/herramientas-accesibilidad';
import { VisorVideoComponente } from './shared/video/visor-video';

/**
 * Cascarón de la aplicación: solo compone el layout.
 *
 * No tiene lógica de negocio a propósito — cada pieza es un componente
 * independiente que se puede mover, quitar o probar por separado.
 */
@Component({
  selector: 'app-root',
  imports: [RouterOutlet, Cabecera, VisorVideoComponente, HerramientasAccesibilidad],
  templateUrl: './app.html',
  styleUrl: './app.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class App {}
