import { DOCUMENT, Injectable, computed, effect, inject, signal } from '@angular/core';

/** Preferencias de accesibilidad que la persona puede ajustar. */
export interface PreferenciasAccesibilidad {
  /** Escala tipografica: 1 = 100 %. */
  escalaTexto: number;
  altoContraste: boolean;
  subrayarEnlaces: boolean;
  reducirMovimiento: boolean;
  /** Tipografia pensada para dislexia. */
  fuenteLegible: boolean;
}

const POR_DEFECTO: PreferenciasAccesibilidad = {
  escalaTexto: 1,
  altoContraste: false,
  subrayarEnlaces: false,
  reducirMovimiento: false,
  fuenteLegible: false,
};

const CLAVE = 'accesibilidad';
export const ESCALAS = [0.9, 1, 1.15, 1.3, 1.5] as const;

/**
 * Estado global de accesibilidad.
 *
 * Vive en `core` porque es transversal: el panel lo edita, pero cualquier parte
 * de la app puede leerlo. Las preferencias se reflejan como atributos `data-*`
 * y una variable CSS en `<html>`, de modo que los estilos reaccionan sin que
 * ningun componente tenga que enterarse.
 */
@Injectable({ providedIn: 'root' })
export class AccesibilidadStore {
  private readonly doc = inject(DOCUMENT);

  private readonly estado = signal<PreferenciasAccesibilidad>(this.leerGuardadas());

  readonly preferencias = this.estado.asReadonly();
  readonly escalaTexto = computed(() => this.estado().escalaTexto);
  readonly altoContraste = computed(() => this.estado().altoContraste);
  readonly subrayarEnlaces = computed(() => this.estado().subrayarEnlaces);
  readonly reducirMovimiento = computed(() => this.estado().reducirMovimiento);
  readonly fuenteLegible = computed(() => this.estado().fuenteLegible);

  /** true si hay al menos un ajuste distinto del valor por defecto. */
  readonly hayAjustes = computed(() => {
    const p = this.estado();
    return (
      p.escalaTexto !== POR_DEFECTO.escalaTexto ||
      p.altoContraste ||
      p.subrayarEnlaces ||
      p.reducirMovimiento ||
      p.fuenteLegible
    );
  });

  constructor() {
    // Un unico efecto sincroniza estado -> DOM -> almacenamiento.
    effect(() => {
      const p = this.estado();
      const raiz = this.doc.documentElement;

      raiz.style.setProperty('--escala-texto', String(p.escalaTexto));
      this.alternar(raiz, 'data-alto-contraste', p.altoContraste);
      this.alternar(raiz, 'data-subrayar-enlaces', p.subrayarEnlaces);
      this.alternar(raiz, 'data-reducir-movimiento', p.reducirMovimiento);
      this.alternar(raiz, 'data-fuente-legible', p.fuenteLegible);

      this.guardar(p);
    });
  }

  private alternar(el: HTMLElement, atributo: string, activo: boolean): void {
    if (activo) el.setAttribute(atributo, '');
    else el.removeAttribute(atributo);
  }

  /* --- Acciones --------------------------------------------------------- */

  actualizar(cambios: Partial<PreferenciasAccesibilidad>): void {
    this.estado.update((p) => ({ ...p, ...cambios }));
  }

  alternarPreferencia(
    clave: Exclude<keyof PreferenciasAccesibilidad, 'escalaTexto'>,
  ): void {
    this.estado.update((p) => ({ ...p, [clave]: !p[clave] }));
  }

  agrandarTexto(): void {
    this.moverEscala(1);
  }

  achicarTexto(): void {
    this.moverEscala(-1);
  }

  private moverEscala(delta: number): void {
    this.estado.update((p) => {
      const i = ESCALAS.indexOf(p.escalaTexto as (typeof ESCALAS)[number]);
      const actual = i === -1 ? ESCALAS.indexOf(1) : i;
      const siguiente = Math.min(Math.max(actual + delta, 0), ESCALAS.length - 1);
      return { ...p, escalaTexto: ESCALAS[siguiente] };
    });
  }

  restablecer(): void {
    this.estado.set({ ...POR_DEFECTO });
  }

  /* --- Persistencia ----------------------------------------------------- */

  /**
   * `localStorage` puede lanzar (modo privado, cookies bloqueadas), asi que
   * toda lectura y escritura va protegida: la app debe funcionar igual sin el.
   */
  private leerGuardadas(): PreferenciasAccesibilidad {
    try {
      const crudo = this.doc.defaultView?.localStorage.getItem(CLAVE);
      if (!crudo) return { ...POR_DEFECTO };
      return { ...POR_DEFECTO, ...(JSON.parse(crudo) as PreferenciasAccesibilidad) };
    } catch {
      return { ...POR_DEFECTO };
    }
  }

  private guardar(p: PreferenciasAccesibilidad): void {
    try {
      this.doc.defaultView?.localStorage.setItem(CLAVE, JSON.stringify(p));
    } catch {
      // Sin almacenamiento las preferencias duran lo que la sesion. Aceptable.
    }
  }
}
