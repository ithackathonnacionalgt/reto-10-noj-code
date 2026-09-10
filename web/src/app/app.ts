import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { Cabecera } from './layout/cabecera/cabecera';
import { ChatAsistente } from './layout/chat-asistente/chat-asistente';
import { PieSitio } from './layout/pie-sitio/pie-sitio';

/**
 * Cascarón de la aplicación: solo compone el layout.
 *
 * No tiene lógica de negocio a propósito — cada pieza es un componente
 * independiente que se puede mover, quitar o probar por separado.
 */
@Component({
  selector: 'app-root',
  imports: [RouterOutlet, Cabecera, PieSitio, ChatAsistente],
  templateUrl: './app.html',
  styleUrl: './app.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class App {}
