import { Pipe, type PipeTransform } from '@angular/core';
import { ETIQUETA_TIPO_COSTO, type TipoCosto } from '../../core/models/enums';

/**
 * Formatea el costo de un tramite.
 *
 * El catalogo tiene tramites con `tipoCosto: 'fijo'` pero `costo: null`; en ese
 * caso se muestra la etiqueta del tipo y no "GTQ null".
 */
@Pipe({ name: 'costo' })
export class CostoPipe implements PipeTransform {
  transform(
    monto: number | null | undefined,
    tipo: TipoCosto,
    moneda = 'GTQ',
  ): string {
    if (tipo === 'gratuito') return 'Gratuito';
    if (monto === null || monto === undefined) return ETIQUETA_TIPO_COSTO[tipo];

    const formateado = new Intl.NumberFormat('es-GT', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(monto);

    return tipo === 'variable'
      ? `Desde ${moneda} ${formateado}`
      : `${moneda} ${formateado}`;
  }
}
