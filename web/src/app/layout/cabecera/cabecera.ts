import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ChatStore } from '../../core/asistente/chat.store';
import { TemaStore } from '../../core/tema/tema.store';
import { PanelAccesibilidad } from '../panel-accesibilidad/panel-accesibilidad';

/**
 * Cabecera del sitio.
 *
 * Agrupa a la derecha las tres herramientas transversales —accesibilidad, tema
 * y asistente— para que estén siempre en el mismo lugar y no compitan con el
 * contenido. No hay navegación: la app tiene una sola pantalla principal, y un
 * enlace "Catálogo" que apunta a donde ya estás es ruido.
 */
@Component({
  selector: 'app-cabecera',
  imports: [RouterLink, PanelAccesibilidad],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './cabecera.html',
  styleUrl: './cabecera.scss',
})
export class Cabecera {
  protected readonly chat = inject(ChatStore);
  protected readonly tema = inject(TemaStore);

  protected readonly esOscuro = computed(() => this.tema.efectivo() === 'oscuro');

  protected readonly etiquetaTema = computed(() =>
    this.esOscuro() ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro',
  );
}
