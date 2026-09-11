import { DOCUMENT, Injectable, computed, effect, inject, signal } from '@angular/core';

/** Preferencias de accesibilidad que la persona puede ajustar. */
export interface PreferenciasAccesibilidad {
  /** Escala tipografica: 1 = 100 %. */
  escalaTexto: number;
  altoContraste: boolean;
  /** La pagina en grises: para sensibilidad al color o para bajar estimulos. */
  escalaGrises: boolean;
  subrayarEnlaces: boolean;
  /** Marca los titulos para leer la estructura de la pagina de un vistazo. */
  resaltarTitulos: boolean;
  /** Tipografia pensada para baja vision y dislexia (Atkinson Hyperlegible). */
  fuenteLegible: boolean;
  /** Mas espacio entre lineas, letras y palabras (WCAG 1.4.12). */
  espaciadoTexto: boolean;
  /** Muestra en grande el texto que esta bajo el cursor. */
  lupaTexto: boolean;
  cursorGrande: boolean;
  /** Franja que sigue al cursor y oscurece el resto para leer linea por linea. */
  guiaLectura: boolean;
  /** Marca muy visible en el elemento enfocado con el teclado. */
  resaltarFoco: boolean;
  /** Sin animaciones ni videos que arranquen solos. */
  reducirMovimiento: boolean;
  /** Lee en voz alta el texto que se toca o se selecciona. */
  lecturaVoz: boolean;
}

/** Todo lo que se prende y se apaga (todo menos la escala). */
export type ClaveHerramienta = Exclude<keyof PreferenciasAccesibilidad, 'escalaTexto'>;

const POR_DEFECTO: PreferenciasAccesibilidad = {
  escalaTexto: 1,
  altoContraste: false,
  escalaGrises: false,
  subrayarEnlaces: false,
  resaltarTitulos: false,
  fuenteLegible: false,
  espaciadoTexto: false,
  lupaTexto: false,
  cursorGrande: false,
  guiaLectura: false,
  resaltarFoco: false,
  reducirMovimiento: false,
  lecturaVoz: false,
};

/**
 * Preferencias que resuelve el CSS solo: cada una marca `<html>` con un
 * atributo y `styles.scss` hace el resto. La guia, la lupa y la voz necesitan
 * JavaScript y las resuelve `HerramientasAccesibilidad`.
 */
const ATRIBUTOS: Partial<Record<ClaveHerramienta, string>> = {
  altoContraste: 'data-alto-contraste',
  escalaGrises: 'data-escala-grises',
  subrayarEnlaces: 'data-subrayar-enlaces',
  resaltarTitulos: 'data-resaltar-titulos',
  fuenteLegible: 'data-fuente-legible',
  espaciadoTexto: 'data-espaciado-texto',
  cursorGrande: 'data-cursor-grande',
  resaltarFoco: 'data-resaltar-foco',
  reducirMovimiento: 'data-reducir-movimiento',
};

/** Combinaciones listas para una necesidad concreta, a un toque. */
export type IdPerfil = 'baja-vision' | 'dislexia' | 'calma' | 'teclado';

export const PERFILES: Record<IdPerfil, Partial<PreferenciasAccesibilidad>> = {
  'baja-vision': { escalaTexto: 1.3, altoContraste: true, cursorGrande: true, lupaTexto: true },
  dislexia: { fuenteLegible: true, espaciadoTexto: true, guiaLectura: true },
  // Epilepsia fotosensible, TDAH, migraña: nada que se mueva ni que brille.
  calma: { reducirMovimiento: true, escalaGrises: true },
  teclado: { resaltarFoco: true, subrayarEnlaces: true, resaltarTitulos: true },
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
  readonly lupaTexto = computed(() => this.estado().lupaTexto);
  readonly guiaLectura = computed(() => this.estado().guiaLectura);
  readonly lecturaVoz = computed(() => this.estado().lecturaVoz);

  /** true si hay al menos un ajuste distinto del valor por defecto. */
  readonly hayAjustes = computed(() => {
    const p = this.estado();
    return (Object.keys(POR_DEFECTO) as (keyof PreferenciasAccesibilidad)[]).some(
      (k) => p[k] !== POR_DEFECTO[k],
    );
  });

  constructor() {
    // Un unico efecto sincroniza estado -> DOM -> almacenamiento.
    effect(() => {
      const p = this.estado();
      const raiz = this.doc.documentElement;

      raiz.style.setProperty('--escala-texto', String(p.escalaTexto));
      for (const [clave, atributo] of Object.entries(ATRIBUTOS)) {
        this.alternar(raiz, atributo, p[clave as ClaveHerramienta]);
      }

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

  alternarPreferencia(clave: ClaveHerramienta): void {
    this.estado.update((p) => ({ ...p, [clave]: !p[clave] }));
  }

  /** Un perfil esta activo si todos sus ajustes lo estan. */
  perfilActivo(id: IdPerfil): boolean {
    const p = this.estado();
    return Object.entries(PERFILES[id]).every(
      ([k, v]) => p[k as keyof PreferenciasAccesibilidad] === v,
    );
  }

  /** Enciende el perfil; si ya estaba encendido, devuelve sus ajustes a cero. */
  aplicarPerfil(id: IdPerfil): void {
    const perfil = PERFILES[id];
    if (this.perfilActivo(id)) {
      const apagado = Object.fromEntries(
        Object.keys(perfil).map((k) => [k, POR_DEFECTO[k as keyof PreferenciasAccesibilidad]]),
      );
      this.actualizar(apagado);
    } else {
      this.actualizar(perfil);
    }
  }

  agrandarTexto(): void {
    this.moverEscala(1);
  }

  achicarTexto(): void {
    this.moverEscala(-1);
  }

  fijarEscala(valor: (typeof ESCALAS)[number]): void {
    this.actualizar({ escalaTexto: valor });
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
   * Las preferencias nuevas arrancan apagadas aunque haya un guardado viejo.
   */
  private leerGuardadas(): PreferenciasAccesibilidad {
    try {
      const crudo = this.doc.defaultView?.localStorage.getItem(CLAVE);
      if (!crudo) return { ...POR_DEFECTO };
      return { ...POR_DEFECTO, ...(JSON.parse(crudo) as Partial<PreferenciasAccesibilidad>) };
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
