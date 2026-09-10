import type { Tramite } from '../models/catalogo.model';

export type Autor = 'persona' | 'asistente';

export interface Mensaje {
  id: string;
  autor: Autor;
  texto: string;
  /** Trámites que respaldan la respuesta. Nunca se responde sin fuente. */
  tramites?: Tramite[];
  enviadoEn: Date;
}
