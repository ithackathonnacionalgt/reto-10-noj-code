import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { TemaStore } from '../../core/tema/tema.store';
import { RouterLink } from '@angular/router';
import { PanelAccesibilidad } from '../panel-accesibilidad/panel-accesibilidad';

/**
 * Cabecera del sitio.
 *
 * Deliberadamente casi vacía: solo accesibilidad y tema, arriba a la derecha.
 * La pantalla principal es el buscador y cualquier otra cosa en esta barra
 * competiría con él. El asistente ya no tiene botón propio: vive dentro del
 * buscador como «modo IA».
 */
@Component({
  selector: 'app-cabecera',
  imports: [PanelAccesibilidad, RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './cabecera.html',
  styleUrl: './cabecera.scss',
})
export class Cabecera {
  protected readonly tema = inject(TemaStore);

  protected readonly esOscuro = computed(() => this.tema.efectivo() === 'oscuro');

  protected readonly etiquetaTema = computed(() =>
    this.esOscuro() ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro',
  );
}
