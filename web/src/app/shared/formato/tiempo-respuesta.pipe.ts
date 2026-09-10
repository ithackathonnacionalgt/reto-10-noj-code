import { Pipe, type PipeTransform } from '@angular/core';
import {
  ETIQUETA_UNIDAD_TIEMPO,
  type UnidadTiempo,
} from '../../core/models/enums';
import type { TiempoRespuesta } from '../../core/models/catalogo.model';

/**
 * Formatea el plazo de respuesta.
 *
 * El reto senala que el catalogo mezcla unidades entre fichas (minutos en una,
 * semanas en otra). No se normaliza aca: se muestra la unidad tal como la publica
 * la fuente y se deja que el reporte de calidad marque la inconsistencia.
 */
@Pipe({ name: 'tiempoRespuesta' })
export class TiempoRespuestaPipe implements PipeTransform {
  transform(tiempo: TiempoRespuesta | null | undefined): string {
    if (!tiempo) return 'Tiempo no disponible';
    if (tiempo.texto) return tiempo.texto;
    if (tiempo.valor === null || tiempo.unidad === null) {
      return 'Tiempo no disponible';
    }

    const unidad = ETIQUETA_UNIDAD_TIEMPO[tiempo.unidad as UnidadTiempo];
    return `${tiempo.valor} ${unidad ?? tiempo.unidad}`;
  }
}
