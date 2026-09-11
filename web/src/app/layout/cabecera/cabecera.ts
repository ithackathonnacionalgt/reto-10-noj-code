import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { TemaStore } from '../../core/tema/tema.store';
import { NavigationEnd, Router, RouterLink } from '@angular/router';
import { Location } from '@angular/common';
import { toSignal } from '@angular/core/rxjs-interop';
import { filter, map } from 'rxjs';
import { PanelAccesibilidad } from '../panel-accesibilidad/panel-accesibilidad';

/**
 * Cabecera del sitio.
 *
 * Deliberadamente liviana: la marca No’j a la izquierda (lleva al inicio) y
 * las herramientas transversales a la derecha. Sin fondo ni borde: la
 * pantalla principal es el buscador y nada en esta barra debe competir con
 * él. El asistente no tiene botón propio: vive dentro del buscador como
 * «modo IA».
 */
@Component({
  selector: 'app-cabecera',
  imports: [PanelAccesibilidad, RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './cabecera.html',
  styleUrl: './cabecera.scss',
})
export class Cabecera {
  private readonly router = inject(Router);
  private readonly location = inject(Location);
  private readonly url = toSignal(this.router.events.pipe(
    filter((event): event is NavigationEnd => event instanceof NavigationEnd),
    map((event) => event.urlAfterRedirects),
  ), { initialValue: this.router.url });
  protected readonly enTramite = computed(() => this.url().startsWith('/tramites/'));

  protected volver(): void {
    const anterior = this.router.lastSuccessfulNavigation()?.previousNavigation?.finalUrl;
    if (anterior && (anterior.root.children['primary']?.segments.length ?? 0) === 0) {
      this.location.back();
    } else {
      void this.router.navigateByUrl('/');
    }
  }

  protected readonly tema = inject(TemaStore);

  protected readonly esOscuro = computed(() => this.tema.efectivo() === 'oscuro');

  protected readonly etiquetaTema = computed(() =>
    this.esOscuro() ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro',
  );
}
