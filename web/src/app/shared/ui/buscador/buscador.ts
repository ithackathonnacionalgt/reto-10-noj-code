import { ChangeDetectionStrategy, Component, input, output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';

/**
 * Barra de busqueda reutilizable.
 *
 * Presentacional pura: no sabe de la API ni del router. La pagina que la usa
 * decide que hacer con `buscar`. El tamano se controla con `variante`, para que
 * la portada pueda mostrarla grande y el listado compacta sin duplicar codigo.
 */
@Component({
  selector: 'app-buscador',
  imports: [FormsModule],
  templateUrl: './buscador.html',
  styleUrl: './buscador.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { '[attr.data-variante]': 'variante()' },
})
export class Buscador {
  readonly variante = input<'grande' | 'compacta'>('compacta');
  readonly valorInicial = input('');
  readonly etiqueta = input('Buscar trámites');
  readonly marcador = input('Buscar por nombre, institución o código…');
  readonly autofoco = input(false);

  readonly buscar = output<string>();

  protected readonly texto = signal('');

  constructor() {
    // `valorInicial` llega despues del primer render cuando viene de la URL.
    queueMicrotask(() => this.texto.set(this.valorInicial()));
  }

  protected enviar(): void {
    this.buscar.emit(this.texto().trim());
  }

  protected limpiar(): void {
    this.texto.set('');
    this.buscar.emit('');
  }
}
