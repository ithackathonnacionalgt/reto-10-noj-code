import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { ChatStore } from '../../core/asistente/chat.store';
import { CostoPipe } from '../../shared/formato/costo.pipe';
import { TiempoRespuestaPipe } from '../../shared/formato/tiempo-respuesta.pipe';

const SUGERENCIAS = [
  '¿Cómo registro una empresa?',
  'Trámites en línea',
  'Licencias forestales',
] as const;

/**
 * Panel lateral del asistente de IA.
 *
 * Solo dibuja: el estado (abierto, mensajes, consulta en curso) vive en
 * `ChatStore`, porque quien lo abre es el botón de la cabecera y la
 * conversación tiene que sobrevivir a la navegación.
 */
@Component({
  selector: 'app-chat-asistente',
  imports: [FormsModule, RouterLink, CostoPipe, TiempoRespuestaPipe],
  templateUrl: './chat-asistente.html',
  styleUrl: './chat-asistente.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ChatAsistente {
  protected readonly chat = inject(ChatStore);

  protected readonly borrador = signal('');
  protected readonly sugerencias = SUGERENCIAS;

  protected readonly puedeEnviar = computed(
    () => this.borrador().trim().length > 0 && !this.chat.pensando(),
  );

  protected enviar(): void {
    if (!this.puedeEnviar()) return;
    this.chat.preguntar(this.borrador());
    this.borrador.set('');
  }

  protected usarSugerencia(texto: string): void {
    this.chat.preguntar(texto);
  }
}
