import { Injectable, signal } from '@angular/core';

/**
 * Qué tarjeta tiene la vista previa de video abierta: una sola a la vez.
 *
 * `mouseleave` no siempre llega (una tarjeta que aparece debajo de un cursor
 * quieto, un scroll con la rueda). Con esta regla, abrir una vista previa
 * cierra la anterior y nunca quedan dos videos sonando en la grilla.
 */
@Injectable({ providedIn: 'root' })
export class VistaPreviaActiva {
  private readonly duena = signal<object | null>(null);

  readonly actual = this.duena.asReadonly();

  tomar(quien: object): void {
    this.duena.set(quien);
  }

  soltar(quien: object): void {
    if (this.duena() === quien) this.duena.set(null);
  }
}
