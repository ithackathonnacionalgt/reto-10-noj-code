import { Injectable, computed, inject, signal } from '@angular/core';
import { AsistenteService } from './asistente.service';
import type { Mensaje } from './asistente.model';

/**
 * Estado del asistente de IA.
 *
 * Vive en `core` y no en el componente por dos razones: el botón que lo abre
 * está en la cabecera y el panel es otro componente, y la conversación tiene
 * que sobrevivir a la navegación entre rutas.
 */
@Injectable({ providedIn: 'root' })
export class ChatStore {
  private readonly asistente = inject(AsistenteService);

  private readonly _abierto = signal(false);
  private readonly _mensajes = signal<Mensaje[]>([]);
  private readonly _pensando = signal(false);

  readonly abierto = this._abierto.asReadonly();
  readonly mensajes = this._mensajes.asReadonly();
  readonly pensando = this._pensando.asReadonly();
  readonly vacio = computed(() => this._mensajes().length === 0);

  abrir(): void {
    this._abierto.set(true);
  }

  cerrar(): void {
    this._abierto.set(false);
  }

  alternar(): void {
    this._abierto.update((v) => !v);
  }

  preguntar(texto: string): void {
    const consulta = texto.trim();
    if (!consulta || this._pensando()) return;

    // Se toma antes de agregar el turno nuevo: la pregunta va aparte, el
    // historial es lo que ya se dijo. Sin esto llegaría duplicada al modelo.
    const historial = this._mensajes();

    this.agregar({ autor: 'persona', texto: consulta });
    this._pensando.set(true);

    this.asistente.preguntar(consulta, historial).subscribe({
      next: (r) => {
        this.agregar({ autor: 'asistente', texto: r.texto, tramites: r.tramites });
        this._pensando.set(false);
      },
      // El servicio ya captura sus errores; esto cubre lo verdaderamente inesperado.
      error: () => {
        this.agregar({
          autor: 'asistente',
          texto: 'Algo salió mal. Intentá de nuevo.',
        });
        this._pensando.set(false);
      },
    });
  }

  limpiarConversacion(): void {
    this._mensajes.set([]);
  }

  private agregar(parcial: Omit<Mensaje, 'id' | 'enviadoEn'>): void {
    this._mensajes.update((lista) => [
      ...lista,
      { ...parcial, id: crypto.randomUUID(), enviadoEn: new Date() },
    ]);
  }
}
