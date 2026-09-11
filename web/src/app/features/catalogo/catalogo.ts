import { NgTemplateOutlet } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router } from '@angular/router';
import { catchError, map, of, startWith, switchMap, tap, type Observable } from 'rxjs';
import { CatalogoMemoria } from './catalogo-memoria';
import { CatalogoApi } from '../../core/api/catalogo-api';
import { ErrorApi } from '../../core/api/error-api.interceptor';
import {
  AsistenteService,
  type RespuestaAsistente,
} from '../../core/asistente/asistente.service';
import type {
  FiltrosTramite,
  Paginada,
  Tramite,
} from '../../core/models/catalogo.model';
import type { Modalidad, Orden, TipoCosto } from '../../core/models/enums';
import { Aviso } from '../../shared/ui/aviso/aviso';
import { Buscador } from '../../shared/ui/buscador/buscador';
import { Paginacion } from '../../shared/ui/paginacion/paginacion';
import { TarjetaTramite } from '../../shared/ui/tarjeta-tramite/tarjeta-tramite';

type Estado =
  | { fase: 'inicio' }
  | { fase: 'cargando'; ia: boolean }
  | { fase: 'listo'; pagina: Paginada<Tramite> }
  | { fase: 'ia'; respuesta: RespuestaAsistente }
  | { fase: 'error'; mensaje: string };

const POR_PAGINA = 12;

/**
 * Filtros heredados de la versión anterior, que tenía panel de filtros. Ya no
 * hay controles para ellos, pero se siguen respetando: quedaron enlaces
 * publicados con esos parámetros y tienen que seguir funcionando.
 */
function tieneFiltrosExtra(f: FiltrosTramite): boolean {
  return Boolean(
    f.institucionId ||
      f.categoriaId ||
      f.modalidad ||
      f.tipoCosto ||
      f.departamentoId ||
      f.disponibleEnLinea,
  );
}

/**
 * Pantalla principal.
 *
 * Dos escenas en un solo componente:
 *  - **Reposo**: solo el título y el buscador, centrados en la pantalla. Nada
 *    de resultados ni categorías: la única pregunta es qué trámite buscás.
 *  - **Resultados**: el buscador sube y aparecen las tarjetas. En modo IA, arriba
 *    de ellas va la respuesta del asistente.
 *
 * La URL es la fuente de verdad (`?q=…&ia=1`): una búsqueda se comparte por
 * enlace, el botón «atrás» funciona y recargar no pierde nada.
 */
@Component({
  selector: 'app-catalogo',
  imports: [NgTemplateOutlet, Buscador, TarjetaTramite, Paginacion, Aviso],
  templateUrl: './catalogo.html',
  styleUrl: './catalogo.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Catalogo {
  private readonly memoria = inject(CatalogoMemoria);
  private readonly api = inject(CatalogoApi);
  private readonly asistente = inject(AsistenteService);
  private readonly router = inject(Router);
  private readonly ruta = inject(ActivatedRoute);

  /* --- Estado de la URL ------------------------------------------------- */

  private readonly params = toSignal(this.ruta.queryParamMap, {
    initialValue: this.ruta.snapshot.queryParamMap,
  });

  protected readonly filtros = computed<FiltrosTramite>(() => {
    const p = this.params();
    const pagina = Number(p.get('page'));
    return {
      q: p.get('q') ?? undefined,
      institucionId: p.get('institucionId') ?? undefined,
      categoriaId: p.get('categoriaId') ?? undefined,
      modalidad: (p.get('modalidad') as Modalidad | null) ?? undefined,
      tipoCosto: (p.get('tipoCosto') as TipoCosto | null) ?? undefined,
      departamentoId: p.get('departamentoId') ?? undefined,
      disponibleEnLinea: p.get('disponibleEnLinea') === 'true' ? true : undefined,
      orden: (p.get('orden') as Orden | null) ?? undefined,
      page: Number.isFinite(pagina) && pagina > 0 ? pagina : 1,
      limit: POR_PAGINA,
    };
  });

  protected readonly termino = computed(() => this.filtros().q ?? '');
  protected readonly modoIa = computed(() => this.params().get('ia') === '1');
  protected readonly hayFiltrosExtra = computed(() => tieneFiltrosExtra(this.filtros()));

  /** Sin consulta la pantalla queda en reposo: solo el buscador. */
  protected readonly enReposo = computed(
    () => !this.termino() && !this.hayFiltrosExtra(),
  );

  /* --- Resultados ------------------------------------------------------- */

  private readonly consulta = computed(() => ({
    filtros: this.filtros(),
    ia: this.modoIa(),
  }));

  protected readonly estado = toSignal(
    toObservable(this.consulta).pipe(
      switchMap(({ filtros, ia }) => this.resolver(filtros, ia)),
    ),
    {
      // Si se entra con una búsqueda en la URL, arranca cargando y no en
      // reposo: si no, la portada aparece un instante y se va.
      initialValue: this.memoria.obtener(this.filtros(), this.modoIa()) ?? (this.enReposo()
        ? { fase: 'inicio' }
        : { fase: 'cargando', ia: this.modoIa() }) as Estado,
    },
  );

  protected readonly esqueletos = Array.from({ length: 6 });
  protected readonly esqueletosIa = Array.from({ length: 3 });

  private resolver(filtros: FiltrosTramite, ia: boolean): Observable<Estado> {
    const guardado = this.memoria.obtener(filtros, ia);
    if (guardado) return of(guardado);
    if (!filtros.q && !tieneFiltrosExtra(filtros)) {
      return of<Estado>({ fase: 'inicio' });
    }

    // El modo IA necesita una pregunta: con solo filtros heredados en la URL
    // no hay nada que interpretar, así que se lista como siempre.
    const pedido: Observable<Estado> =
      ia && filtros.q
        ? this.asistente
            .preguntar(filtros.q)
            .pipe(map((respuesta): Estado => ({ fase: 'ia', respuesta })))
        : this.api
            .listarTramites(filtros)
            .pipe(map((pagina): Estado => ({ fase: 'listo', pagina })));

    return pedido.pipe(
      tap((resultado) => {
        if (resultado.fase === 'listo' || resultado.fase === 'ia') {
          this.memoria.guardar(filtros, ia, resultado);
        }
      }),
      catchError((e: unknown) =>
        of<Estado>({
          fase: 'error',
          mensaje: e instanceof ErrorApi ? e.message : 'No se pudo cargar el catálogo.',
        }),
      ),
      startWith<Estado>({ fase: 'cargando', ia: ia && Boolean(filtros.q) }),
    );
  }

  /* --- Acciones --------------------------------------------------------- */

  protected buscar(termino: string): void {
    if (!termino) {
      this.limpiar();
      return;
    }
    void this.router.navigate([], {
      relativeTo: this.ruta,
      queryParams: { q: termino, page: null },
      queryParamsHandling: 'merge',
    });
  }

  /** El interruptor no es una navegación: reemplaza la entrada del historial. */
  protected cambiarModoIa(activo: boolean): void {
    void this.router.navigate([], {
      relativeTo: this.ruta,
      queryParams: { ia: activo ? 1 : null, page: null },
      queryParamsHandling: 'merge',
      replaceUrl: true,
    });
  }

  /** Vuelve al reposo, pero respeta el modo elegido. */
  protected limpiar(): void {
    void this.router.navigate([], {
      relativeTo: this.ruta,
      queryParams: this.modoIa() ? { ia: 1 } : {},
    });
  }

  protected irAPagina(page: number): void {
    void this.router.navigate([], {
      relativeTo: this.ruta,
      queryParams: { page },
      queryParamsHandling: 'merge',
    });
  }
}
