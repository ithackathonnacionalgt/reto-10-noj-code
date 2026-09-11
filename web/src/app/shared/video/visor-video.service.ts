import { Injectable, signal } from '@angular/core';
import type { VideoSenas } from '../../core/models/catalogo.model';

export interface VideoEnVisor {
  video: VideoSenas;
  /** Segundo desde el que sigue: el visor retoma donde iba el video chico. */
  inicio: number;
}

/**
 * Visor de video ampliado, único para toda la app.
 *
 * Cualquier reproductor pide abrirlo; el diálogo vive una sola vez en la raíz
 * (`<app-visor-video>`), así no queda atado a una tarjeta que se desmonta
 * cuando el cursor se va.
 */
@Injectable({ providedIn: 'root' })
export class VisorVideo {
  private readonly estado = signal<VideoEnVisor | null>(null);

  readonly actual = this.estado.asReadonly();

  abrir(video: VideoSenas, inicio = 0): void {
    this.estado.set({ video, inicio });
  }

  cerrar(): void {
    this.estado.set(null);
  }
}
