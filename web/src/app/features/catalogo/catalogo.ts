import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router } from '@angular/router';
import { catchError, forkJoin, map, of, startWith, switchMap } from 'rxjs';
import { CatalogoApi } from '../../core/api/catalogo-api';
import { ErrorApi } from '../../core/api/error-api.interceptor';
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
import {
  ChipsCategorias,
  type CategoriaConteo,
} from './componentes/chips-categorias/chips-categorias';
import {
  FiltrosAvanzados,
  type CambioFiltro,
  type InstitucionConteo,
} from './componentes/filtros-avanzados/filtros-avanzados';

type Estado =
  | { fase: 'cargando' }
  | { fase: 'listo'; pagina: Paginada<Tramite> }
  | { fase: 'error'; mensaje: string };

const POR_PAGINA = 12;

/** Tope al leer el catálogo completo para calcular conteos. */
const TOPE_FACETAS = 100;

/**
 * Pantalla principal: el catálogo entero.
 *
 * Deliberadamente una sola vista. Antes había una portada de bienvenida y un
 * listado aparte; ahora los trámites se ven de inmediato bajo el buscador,
 * sin un paso intermedio que no aportaba nada.
 */
@Component({
  selector: 'app-catalogo',
  imports: [
    Buscador,
    ChipsCategorias,
    FiltrosAvanzados,
    TarjetaTramite,
    Paginacion,
    Aviso,
  ],
  templateUrl: './catalogo.html',
  styleUrl: './catalogo.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Catalogo {
  private readonly api = inject(CatalogoApi);
  private readonly router = inject(Router);
  private readonly ruta = inject(ActivatedRoute);

  /* --- Filtros: la URL es la fuente de verdad --------------------------- */

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

  /* --- Facetas: conteos reales por categoría e institución -------------- */

  /**
   * Conteos calculados en el cliente sobre el catálogo completo.
   *
   * La API todavía no expone facetas, así que se lee una vez el listado
   * publicado (hasta `TOPE_FACETAS`) y se cuenta acá. Es un puente, no una
   * solución: cuando el catálogo crezca, esto tiene que moverse al backend
   * como un endpoint de agregados.
   */
  private readonly facetas = toSignal(
    forkJoin({
      todos: this.api.listarTramites({ limit: TOPE_FACETAS }),
      categorias: this.api.listarCategorias(),
      instituciones: this.api.listarInstituciones(),
      departamentos: this.api.listarDepartamentos(),
    }).pipe(
      map(({ todos, categorias, instituciones, departamentos }) => {
        const porCategoria = new Map<string, number>();
        const porInstitucion = new Map<string, number>();

        for (const t of todos.data) {
          porInstitucion.set(
            t.institucion.id,
            (porInstitucion.get(t.institucion.id) ?? 0) + 1,
          );
          for (const c of t.categorias) {
            porCategoria.set(c.id, (porCategoria.get(c.id) ?? 0) + 1);
          }
        }

        return {
          categorias: categorias.map<CategoriaConteo>((c) => ({
            ...c,
            conteo: porCategoria.get(c.id) ?? 0,
          })),
          instituciones: instituciones.map<InstitucionConteo>((i) => ({
            ...i,
            conteo: porInstitucion.get(i.id) ?? 0,
          })),
          departamentos,
          total: todos.meta.total,
        };
      }),
      catchError(() =>
        of({ categorias: [], instituciones: [], departamentos: [], total: 0 }),
      ),
    ),
    {
      initialValue: {
        categorias: [] as CategoriaConteo[],
        instituciones: [] as InstitucionConteo[],
        departamentos: [] as { id: string; nombre: string }[],
        total: 0,
      },
    },
  );

  protected readonly categorias = computed(() => this.facetas().categorias);
  protected readonly instituciones = computed(() => this.facetas().instituciones);
  protected readonly departamentos = computed(() => this.facetas().departamentos);
  protected readonly totalCatalogo = computed(() => this.facetas().total);

  /**
   * Cuántos trámites tienen departamento asignado.
   *
   * Hoy es 0: ningún trámite lo trae, así que filtrar por departamento no
   * devuelve nada. El panel de filtros lo avisa en vez de dejar que la persona
   * crea que la búsqueda está rota.
   */
  protected readonly conDepartamento = computed(() => 0);

  /* --- Resultados ------------------------------------------------------- */

  private readonly resultado = toSignal(
    toObservable(this.filtros).pipe(
      switchMap((filtros) =>
        this.api.listarTramites(filtros).pipe(
          map((pagina): Estado => ({ fase: 'listo', pagina })),
          catchError((e: unknown) =>
            of<Estado>({
              fase: 'error',
              mensaje:
                e instanceof ErrorApi
                  ? e.message
                  : 'No se pudo cargar el catálogo.',
            }),
          ),
          startWith<Estado>({ fase: 'cargando' }),
        ),
      ),
    ),
    { initialValue: { fase: 'cargando' } as Estado },
  );

  protected readonly estado = this.resultado;
  protected readonly esqueletos = Array.from({ length: 6 });

  protected readonly hayFiltros = computed(() => {
    const f = this.filtros();
    return Boolean(
      f.q ||
        f.institucionId ||
        f.categoriaId ||
        f.modalidad ||
        f.tipoCosto ||
        f.departamentoId ||
        f.disponibleEnLinea,
    );
  });

  /* --- Acciones --------------------------------------------------------- */

  /** Cualquier cambio de filtro vuelve a la página 1. */
  protected aplicar(cambios: CambioFiltro): void {
    void this.router.navigate([], {
      relativeTo: this.ruta,
      queryParams: { ...cambios, page: null },
      queryParamsHandling: 'merge',
    });
  }

  protected buscar(termino: string): void {
    this.aplicar({ q: termino || null });
  }

  protected elegirCategoria(id: string | null): void {
    this.aplicar({ categoriaId: id });
  }

  protected limpiar(): void {
    void this.router.navigate([], { relativeTo: this.ruta, queryParams: {} });
  }

  protected irAPagina(page: number): void {
    void this.router.navigate([], {
      relativeTo: this.ruta,
      queryParams: { page },
      queryParamsHandling: 'merge',
    });
  }
}
