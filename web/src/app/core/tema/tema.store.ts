import { DOCUMENT, Injectable, computed, effect, inject, signal } from '@angular/core';

/** Preferencia de tema. `sistema` sigue lo que tenga configurado el equipo. */
export type Tema = 'claro' | 'oscuro' | 'sistema';

const CLAVE = 'tema';

/**
 * Tema visual de la aplicación.
 *
 * Escribe `data-tema` en `<html>` y los estilos reaccionan solos. Los tres
 * estados son deliberados: sin `sistema` no habría forma de volver a "lo que
 * diga el equipo" después de elegir manualmente una vez.
 */
@Injectable({ providedIn: 'root' })
export class TemaStore {
  private readonly doc = inject(DOCUMENT);

  private readonly estado = signal<Tema>(this.leerGuardado());

  readonly tema = this.estado.asReadonly();

  /** Qué se está viendo realmente, resolviendo `sistema`. */
  readonly efectivo = computed<'claro' | 'oscuro'>(() => {
    const t = this.estado();
    return t === 'sistema' ? this.preferenciaDelSistema() : t;
  });

  constructor() {
    effect(() => {
      const t = this.estado();
      const raiz = this.doc.documentElement;

      // `sistema` no estampa nada: deja que mande la media query.
      if (t === 'sistema') raiz.removeAttribute('data-tema');
      else raiz.setAttribute('data-tema', t);

      this.guardar(t);
    });
  }

  /** Alterna claro ⇄ oscuro partiendo de lo que se ve ahora. */
  alternar(): void {
    this.estado.set(this.efectivo() === 'oscuro' ? 'claro' : 'oscuro');
  }

  fijar(tema: Tema): void {
    this.estado.set(tema);
  }

  seguirAlSistema(): void {
    this.estado.set('sistema');
  }

  private preferenciaDelSistema(): 'claro' | 'oscuro' {
    return this.doc.defaultView?.matchMedia('(prefers-color-scheme: dark)').matches
      ? 'oscuro'
      : 'claro';
  }

  /**
   * `localStorage` puede lanzar (modo privado, cookies bloqueadas), así que
   * toda lectura y escritura va protegida: la app debe funcionar igual sin él.
   */
  private leerGuardado(): Tema {
    try {
      const v = this.doc.defaultView?.localStorage.getItem(CLAVE);
      return v === 'claro' || v === 'oscuro' || v === 'sistema' ? v : 'sistema';
    } catch {
      return 'sistema';
    }
  }

  private guardar(t: Tema): void {
    try {
      this.doc.defaultView?.localStorage.setItem(CLAVE, t);
    } catch {
      // Sin almacenamiento la preferencia dura lo que la sesión. Aceptable.
    }
  }
}
