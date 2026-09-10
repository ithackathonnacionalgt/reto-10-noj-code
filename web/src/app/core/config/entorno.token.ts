import { InjectionToken } from '@angular/core';
import { environment } from '../../../environments/environment';
import type { EntornoApp } from './entorno.model';

/**
 * Token de configuracion del entorno.
 *
 * Los servicios inyectan este token en vez de importar `environment` directo:
 * asi se puede sustituir en tests sin tocar el bundler, y el codigo de dominio
 * no depende de la ubicacion fisica del archivo de entorno.
 */
export const ENTORNO = new InjectionToken<EntornoApp>('ENTORNO', {
  providedIn: 'root',
  factory: () => environment,
});
