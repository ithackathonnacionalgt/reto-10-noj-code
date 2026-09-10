import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { AccesibilidadStore, ESCALAS } from '../../core/accesibilidad/accesibilidad.store';

/**
 * Panel flotante de ajustes de accesibilidad.
 *
 * El componente solo maneja apertura/cierre; todo el estado de preferencias vive
 * en `AccesibilidadStore`, asi que otro punto de entrada (un atajo de teclado, un
 * enlace del pie) puede cambiarlas sin pasar por aca.
 */
@Component({
  selector: 'app-panel-accesibilidad',
  templateUrl: './panel-accesibilidad.html',
  styleUrl: './panel-accesibilidad.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PanelAccesibilidad {
  protected readonly a11y = inject(AccesibilidadStore);

  protected readonly abierto = signal(false);

  protected readonly porcentaje = computed(
    () => `${Math.round(this.a11y.escalaTexto() * 100)} %`,
  );

  protected readonly enElMinimo = computed(
    () => this.a11y.escalaTexto() <= ESCALAS[0],
  );
  protected readonly enElMaximo = computed(
    () => this.a11y.escalaTexto() >= ESCALAS[ESCALAS.length - 1],
  );

  protected alternar(): void {
    this.abierto.update((v) => !v);
  }

  protected cerrar(): void {
    this.abierto.set(false);
  }
}
