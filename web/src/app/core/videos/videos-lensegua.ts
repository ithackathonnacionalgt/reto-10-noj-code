import { Injectable, inject } from '@angular/core';
import { catchError, map, of, shareReplay, type Observable } from 'rxjs';
import { CatalogoApi } from '../api/catalogo-api';
import type { Tramite, VideoSenas } from '../models/catalogo.model';

/** Los dos videos de un trámite, cada uno en su lugar. */
export interface VideosDeTramite {
  /** Descripción corta: la vista previa de la tarjeta. */
  descripcion: VideoSenas | null;
  /** Paso a paso completo: el panel lateral de la ficha. */
  pasos: VideoSenas | null;
}

export const SIN_VIDEOS: VideosDeTramite = { descripcion: null, pasos: null };

export function agruparVideos(videos: readonly VideoSenas[] | undefined): VideosDeTramite {
  const lista = videos ?? [];
  return {
    descripcion: lista.find((v) => v.tipo === 'descripcion') ?? null,
    pasos: lista.find((v) => v.tipo === 'pasos') ?? null,
  };
}

/**
 * Videos LENSEGUA de un trámite.
 *
 * Si el trámite ya los trae (la ficha siempre, el listado cuando el backend
 * los incluye) se usan tal cual. Si no, se pide la ficha una sola vez por
 * trámite: la respuesta queda en memoria y pasar el cursor de nuevo no
 * vuelve a golpear la API.
 */
@Injectable({ providedIn: 'root' })
export class VideosLensegua {
  private readonly api = inject(CatalogoApi);
  private readonly pedidos = new Map<string, Observable<VideosDeTramite>>();

  de(tramite: Tramite): Observable<VideosDeTramite> {
    if (tramite.accesibilidad) {
      return of(agruparVideos(tramite.accesibilidad.videosSenas));
    }

    const guardado = this.pedidos.get(tramite.slug);
    if (guardado) return guardado;

    const pedido = this.api.obtenerTramite(tramite.slug).pipe(
      map((t) => agruparVideos(t.accesibilidad?.videosSenas)),
      catchError(() => {
        // Un fallo de red no se recuerda: el próximo intento vuelve a pedir.
        this.pedidos.delete(tramite.slug);
        return of(SIN_VIDEOS);
      }),
      shareReplay(1),
    );
    this.pedidos.set(tramite.slug, pedido);
    return pedido;
  }
}
