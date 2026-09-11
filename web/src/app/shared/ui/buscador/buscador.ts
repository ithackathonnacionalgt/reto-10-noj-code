import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  inject,
  input,
  linkedSignal,
  model,
  output,
  viewChild,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Dictado } from '../../voz/dictado';

let siguienteId = 0;

/**
 * Buscador principal: texto, dictado por voz e interruptor de modo IA.
 *
 * Presentacional: no sabe de la API ni del router. Emite `buscar` con el
 * texto y expone `modoIa` como `model()`, así quien lo usa decide qué hacer
 * con cada modo (hoy, el catálogo lo guarda en la URL).
 *
 * El micrófono transcribe mientras la persona habla y, al terminar la frase,
 * busca solo: dictar y después tener que tocar «Buscar» es un paso de más.
 */
@Component({
  selector: 'app-buscador',
  imports: [FormsModule],
  providers: [Dictado],
  templateUrl: './buscador.html',
  styleUrl: './buscador.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[class.con-ia]': 'modoIa()',
    '[class.escuchando]': 'dictado.escuchando()',
  },
})
export class Buscador {
  readonly valorInicial = input('');
  readonly etiqueta = input('Buscar trámites');
  readonly marcador = input('Buscá por nombre, institución o código…');
  // Corto a propósito: en un teléfono de 390px no entra una frase más larga.
  readonly marcadorIa = input('Describí lo que necesitás hacer…');

  /** Si la consulta la interpreta la IA. Bidireccional: `[(modoIa)]`. */
  readonly modoIa = model(false);

  readonly buscar = output<string>();

  protected readonly dictado = inject(Dictado);
  protected readonly id = `buscador-${++siguienteId}`;

  /* Sigue a `valorInicial` (la URL) y además se edita localmente: al volver
     atrás en el historial el campo muestra la búsqueda de esa página. */
  protected readonly texto = linkedSignal(() => this.valorInicial());

  private readonly campo = viewChild.required<ElementRef<HTMLInputElement>>('campo');

  protected enviar(): void {
    if (this.dictado.escuchando()) this.dictado.detener();
    this.buscar.emit(this.texto().trim());
  }

  protected limpiar(): void {
    this.texto.set('');
    this.buscar.emit('');
    this.campo().nativeElement.focus();
  }

  protected alternarIa(): void {
    this.modoIa.update((v) => !v);
    this.campo().nativeElement.focus();
  }

  protected alternarDictado(): void {
    if (this.dictado.escuchando()) {
      this.dictado.detener();
      return;
    }

    this.dictado.iniciar({
      parcial: (t) => this.texto.set(t),
      final: (t) => {
        this.texto.set(t);
        this.buscar.emit(t.trim());
      },
    });
  }
}
