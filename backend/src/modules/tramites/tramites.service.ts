import { randomBytes } from 'node:crypto';
import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import {
  DataSource,
  In,
  Not,
  QueryFailedError,
  Repository,
  type EntityManager,
  type ObjectLiteral,
  type SelectQueryBuilder,
} from 'typeorm';
import { paginar } from '../../common/dto/respuesta-paginada.js';
import { asegurarSlugUnico, generarSlug } from '../../common/utils/slug.js';
import {
  EstadoContenido,
  EstadoPublicacion,
} from '../../database/entities/enums.js';
import {
  Categoria,
  Institucion,
  Tramite,
  TramiteCategoria,
  TramiteHistorialEstado,
  TramitePaso,
  TramiteRequisito,
  TramiteVersion,
  VideoSenas,
} from '../../database/entities/schema.js';
import { aDetalle, aResumen } from './tramites.mapper.js';
import type {
  ActualizarEtiquetasDto,
  ActualizarTramiteDto,
  CrearPasoDto,
  CrearRequisitoDto,
  CrearTramiteDto,
  CrearVideoSenasDto,
  FiltrosTramiteDto,
} from './dto/tramites.dto.js';

const CODIGO_FK_VIOLATION = '23503';
const CODIGO_UNIQUE_VIOLATION = '23505';

/** Escapa los comodines de LIKE (%, _, \) para que se busquen como texto literal. */
function escaparLike(valor: string): string {
  return valor.replace(/[\\%_]/g, '\\$&');
}

const RELACIONES_DETALLE = {
  institucion: true,
  categorias: { categoria: true },
  requisitos: true,
  pasos: true,
  normativas: true,
  enlaces: true,
  costos: true,
  tiempos: true,
  videosSenas: true,
};

@Injectable()
export class TramitesService {
  constructor(
    @InjectDataSource() private readonly dataSource: DataSource,
    @InjectRepository(Tramite)
    private readonly repo: Repository<Tramite>,
    @InjectRepository(TramiteRequisito)
    private readonly requisitos: Repository<TramiteRequisito>,
    @InjectRepository(TramitePaso)
    private readonly pasos: Repository<TramitePaso>,
    @InjectRepository(Institucion)
    private readonly instituciones: Repository<Institucion>,
    @InjectRepository(Categoria)
    private readonly categorias: Repository<Categoria>,
    @InjectRepository(VideoSenas)
    private readonly videosSenas: Repository<VideoSenas>,
  ) {}

  // ---- Lectura publica -----------------------------------------------------

  async listarPublicos(filtros: FiltrosTramiteDto) {
    return this.listar(filtros, EstadoPublicacion.PUBLICADO);
  }

  async obtenerPublico(param: string) {
    const tramite = await this.repo.findOne({
      where: [
        { slug: param, estado: EstadoPublicacion.PUBLICADO },
        { publicId: param, estado: EstadoPublicacion.PUBLICADO },
      ],
      relations: RELACIONES_DETALLE,
    });
    if (!tramite) {
      throw new NotFoundException('Tramite no encontrado');
    }
    void this.repo.increment({ id: tramite.id }, 'vistas', 1).catch(() => {});
    return aDetalle(tramite);
  }

  // ---- Lectura administrativa --------------------------------------------

  async listarAdmin(filtros: FiltrosTramiteDto) {
    return this.listar(filtros, filtros.estado ?? null);
  }

  async obtenerAdmin(id: string) {
    const tramite = await this.cargarCompleto(id);
    return aDetalle(tramite);
  }

  // ---- Escritura -------------------------------------------------------------

  async crear(dto: CrearTramiteDto, usuarioId: string) {
    await this.asegurarInstitucion(dto.institucionId);

    const publicId = await this.generarPublicIdUnico();
    const slug = await asegurarSlugUnico(
      generarSlug(dto.slug ?? dto.nombre),
      (candidato) => this.repo.existsBy({ slug: candidato }),
    );

    const id = await this.dataSource.transaction(async (manager) => {
      const tramite = await manager.getRepository(Tramite).save(
        manager.getRepository(Tramite).create({
          ...this.camposDesdeDto(dto),
          nombre: dto.nombre.trim(),
          institucionId: dto.institucionId,
          publicId,
          slug,
          codigo: dto.codigo?.trim() ?? null,
          estado: EstadoPublicacion.BORRADOR,
          creadoPor: usuarioId,
          actualizadoPor: usuarioId,
        }),
      );
      if (dto.categoriaIds?.length) {
        await this.sincronizarCategorias(manager, tramite.id, dto.categoriaIds);
      }
      return tramite.id;
    }).catch((error: unknown) => this.traducirError(error));

    return this.obtenerAdmin(id);
  }

  async actualizar(
    id: string,
    dto: ActualizarTramiteDto,
    usuarioId: string,
  ) {
    const tramite = await this.cargarBasico(id);

    if (dto.institucionId) {
      await this.asegurarInstitucion(dto.institucionId);
      tramite.institucionId = dto.institucionId;
    }
    if (dto.slug !== undefined) {
      tramite.slug = await asegurarSlugUnico(
        generarSlug(dto.slug || tramite.nombre),
        (candidato) => this.repo.existsBy({ slug: candidato, id: Not(id) }),
      );
    }
    if (dto.nombre !== undefined) tramite.nombre = dto.nombre.trim();
    if (dto.codigo !== undefined) tramite.codigo = dto.codigo?.trim() ?? null;
    Object.assign(tramite, this.camposDesdeDto(dto));
    tramite.actualizadoPor = usuarioId;

    await this.dataSource
      .transaction(async (manager) => {
        await manager.getRepository(Tramite).save(tramite);
        if (dto.categoriaIds !== undefined) {
          await this.sincronizarCategorias(manager, id, dto.categoriaIds);
        }
      })
      .catch((error: unknown) => this.traducirError(error));

    return this.obtenerAdmin(id);
  }

  async publicar(id: string, usuarioId: string) {
    const tramite = await this.cargarBasico(id);
    const estadoAnterior = tramite.estado;
    tramite.estado = EstadoPublicacion.PUBLICADO;
    tramite.publicadoEn = tramite.publicadoEn ?? new Date();
    tramite.actualizadoPor = usuarioId;

    await this.dataSource.transaction(async (manager) => {
      await manager.getRepository(Tramite).save(tramite);
      await manager.getRepository(TramiteHistorialEstado).save({
        tramiteId: id,
        estadoAnterior,
        estadoNuevo: EstadoPublicacion.PUBLICADO,
        cambiadoPor: usuarioId,
      });
    });

    // Snapshot de version publicada (CLAUDE.md 26).
    const completo = await this.cargarCompleto(id);
    const versiones = await this.dataSource
      .getRepository(TramiteVersion)
      .countBy({ tramiteId: id });
    await this.dataSource.getRepository(TramiteVersion).save({
      tramiteId: id,
      version: versiones + 1,
      snapshot: aDetalle(completo) as unknown as Record<string, unknown>,
      creadoPor: usuarioId,
      publicadoEn: new Date(),
    });

    return aDetalle(completo);
  }

  async cambiarEstado(
    id: string,
    nuevoEstado: EstadoPublicacion,
    usuarioId: string,
  ) {
    const tramite = await this.cargarBasico(id);
    const estadoAnterior = tramite.estado;
    tramite.estado = nuevoEstado;
    tramite.actualizadoPor = usuarioId;

    await this.dataSource.transaction(async (manager) => {
      await manager.getRepository(Tramite).save(tramite);
      await manager.getRepository(TramiteHistorialEstado).save({
        tramiteId: id,
        estadoAnterior,
        estadoNuevo: nuevoEstado,
        cambiadoPor: usuarioId,
      });
    });

    return this.obtenerAdmin(id);
  }

  async eliminar(id: string): Promise<void> {
    const tramite = await this.cargarBasico(id);
    try {
      await this.repo.remove(tramite);
    } catch (error) {
      if (
        error instanceof QueryFailedError &&
        (error.driverError as { code?: string })?.code === CODIGO_FK_VIOLATION
      ) {
        throw new ConflictException(
          'No se puede eliminar: el tramite tiene solicitudes o registros asociados',
        );
      }
      throw error;
    }
  }

  // ---- Requisitos ---------------------------------------------------------

  async agregarRequisito(tramiteId: string, dto: CrearRequisitoDto) {
    await this.cargarBasico(tramiteId);
    const orden = dto.orden ?? (await this.siguienteOrden(this.requisitos, tramiteId));
    return this.requisitos.save(
      this.requisitos.create({
        tramiteId,
        titulo: dto.titulo.trim(),
        descripcion: dto.descripcion?.trim() ?? null,
        tipo: dto.tipo,
        esObligatorio: dto.esObligatorio ?? true,
        cantidad: dto.cantidad ?? null,
        requiereArchivo: dto.requiereArchivo ?? false,
        tiposArchivoPermitidos: dto.tiposArchivoPermitidos ?? null,
        diasValidez: dto.diasValidez ?? null,
        notas: dto.notas?.trim() ?? null,
        orden,
      }),
    );
  }

  async listarRequisitos(tramiteId: string) {
    await this.cargarBasico(tramiteId);
    return this.requisitos.find({
      where: { tramiteId },
      order: { orden: 'ASC' },
    });
  }

  async eliminarRequisito(tramiteId: string, requisitoId: string) {
    const res = await this.requisitos.delete({ id: requisitoId, tramiteId });
    if (!res.affected) {
      throw new NotFoundException('Requisito no encontrado');
    }
  }

  // ---- Pasos ------------------------------------------------------------

  async agregarPaso(tramiteId: string, dto: CrearPasoDto) {
    await this.cargarBasico(tramiteId);
    const orden = dto.orden ?? (await this.siguienteOrden(this.pasos, tramiteId));
    return this.pasos.save(
      this.pasos.create({
        tramiteId,
        titulo: dto.titulo.trim(),
        descripcion: dto.descripcion?.trim() ?? null,
        orden,
        parteResponsable: dto.parteResponsable,
        tiempoEstimado: dto.tiempoEstimado?.trim() ?? null,
        canal: dto.canal ?? null,
        ubicacion: dto.ubicacion?.trim() ?? null,
        requierePago: dto.requierePago ?? false,
        requiereDocumento: dto.requiereDocumento ?? false,
        urlExterna: dto.urlExterna ?? null,
      }),
    );
  }

  async listarPasos(tramiteId: string) {
    await this.cargarBasico(tramiteId);
    return this.pasos.find({
      where: { tramiteId },
      order: { orden: 'ASC' },
    });
  }

  async eliminarPaso(tramiteId: string, pasoId: string) {
    const res = await this.pasos.delete({ id: pasoId, tramiteId });
    if (!res.affected) {
      throw new NotFoundException('Paso no encontrado');
    }
  }

  // ---- Videos LENSEGUA (CLAUDE.md 11) ------------------------------------

  /**
   * Agrega un video: uno de descripcion corta y otro de los pasos por
   * tramite (por idioma de senas). Si ya existe uno del mismo tipo, lo
   * reemplaza (evita acumular videos obsoletos).
   */
  async agregarVideoSenas(tramiteId: string, dto: CrearVideoSenasDto) {
    await this.cargarBasico(tramiteId);
    const lenguaSenas = dto.lenguaSenas?.trim() || 'LENSEGUA';
    const existente = await this.videosSenas.findOne({
      where: { tramiteId, tipo: dto.tipo, lenguaSenas },
    });

    const datos = {
      titulo: dto.titulo.trim(),
      descripcion: dto.descripcion?.trim() ?? null,
      urlVideo: dto.urlVideo,
      urlMiniatura: dto.urlMiniatura ?? null,
      duracionSegundos: dto.duracionSegundos ?? null,
      transcripcion: dto.transcripcion?.trim() ?? null,
      estado: EstadoContenido.PUBLICADO,
    };

    if (existente) {
      Object.assign(existente, datos);
      return this.videosSenas.save(existente);
    }
    return this.videosSenas.save(
      this.videosSenas.create({
        tramiteId,
        tipo: dto.tipo,
        lenguaSenas,
        ...datos,
      }),
    );
  }

  async listarVideosSenas(tramiteId: string) {
    await this.cargarBasico(tramiteId);
    return this.videosSenas.find({
      where: { tramiteId },
      order: { tipo: 'ASC' },
    });
  }

  async eliminarVideoSenas(tramiteId: string, videoId: string) {
    const res = await this.videosSenas.delete({ id: videoId, tramiteId });
    if (!res.affected) {
      throw new NotFoundException('Video no encontrado');
    }
  }

  // ---- Etiquetas de busqueda (CLAUDE.md 28) ------------------------------

  async actualizarEtiquetas(tramiteId: string, dto: ActualizarEtiquetasDto) {
    const tramite = await this.cargarBasico(tramiteId);
    const limpias = [
      ...new Set(
        dto.etiquetas
          .map((e) => e.trim().toLowerCase())
          .filter((e) => e.length >= 2),
      ),
    ].slice(0, 30);
    tramite.etiquetas = limpias;
    await this.repo.save(tramite);
    return { id: tramiteId, etiquetas: limpias };
  }

  // ---- Internos ---------------------------------------------------------

  /**
   * Listado con filtros, busqueda y paginacion (CLAUDE.md 28, 29, 40).
   *
   * Estrategia en dos pasos para no romper la paginacion con las relaciones:
   *   1) query de ids + rango de relevancia (sin joins de coleccion), paginada;
   *   2) carga de esos tramites con sus relaciones, respetando el orden.
   */
  private async listar(
    filtros: FiltrosTramiteDto,
    estado: EstadoPublicacion | null,
  ) {
    const q = filtros.q?.trim();
    const busquedaCompleta = Boolean(q) && (q as string).length >= 2;

    const idQb = this.repo.createQueryBuilder('t').select('t.id', 'id');
    this.aplicarFiltros(idQb, filtros, estado, q);

    if (busquedaCompleta) {
      idQb
        .addSelect(
          `ts_rank("t".busqueda_tsv, websearch_to_tsquery('spanish', :q))
           + ts_rank(
               to_tsvector('spanish', f_array_to_string("t".etiquetas, ' ')),
               websearch_to_tsquery('spanish', :q)
             )
           + similarity(lower("t".nombre), lower(:q))`,
          'rango',
        )
        .setParameter('q', q)
        .orderBy('rango', 'DESC')
        .addOrderBy('t.publicadoEn', 'DESC', 'NULLS LAST');
    } else {
      this.aplicarOrden(idQb, filtros.orden);
    }
    idQb.offset(filtros.offset).limit(filtros.limit);

    const countQb = this.repo.createQueryBuilder('t');
    this.aplicarFiltros(countQb, filtros, estado, q);

    const [filas, total] = await Promise.all([
      idQb.getRawMany<{ id: string }>(),
      countQb.getCount(),
    ]);

    const ids = filas.map((f) => f.id);
    const tramites = ids.length
      ? await this.repo.find({
          where: { id: In(ids) },
          relations: RELACIONES_DETALLE,
        })
      : [];
    const posicion = new Map(ids.map((id, indice) => [id, indice]));
    tramites.sort(
      (a, b) => (posicion.get(a.id) ?? 0) - (posicion.get(b.id) ?? 0),
    );

    return paginar(
      tramites.map(aResumen),
      total,
      filtros.page,
      filtros.limit,
    );
  }

  private aplicarFiltros(
    qb: SelectQueryBuilder<Tramite>,
    filtros: FiltrosTramiteDto,
    estado: EstadoPublicacion | null,
    q: string | undefined,
  ): void {
    if (estado) {
      qb.andWhere('t.estado = :estado', { estado });
    }
    if (filtros.institucionId) {
      qb.andWhere('t.institucionId = :institucionId', {
        institucionId: filtros.institucionId,
      });
    }
    if (filtros.modalidad) {
      qb.andWhere('t.modalidad = :modalidad', { modalidad: filtros.modalidad });
    }
    if (filtros.modoEjecucion) {
      qb.andWhere('t.modoEjecucion = :modoEjecucion', {
        modoEjecucion: filtros.modoEjecucion,
      });
    }
    if (filtros.tipoCosto) {
      qb.andWhere('t.tipoCosto = :tipoCosto', { tipoCosto: filtros.tipoCosto });
    }
    if (filtros.disponibleEnLinea !== undefined) {
      qb.andWhere('t.disponibleEnLinea = :disp', {
        disp: filtros.disponibleEnLinea,
      });
    }
    if (filtros.departamentoId) {
      qb.andWhere('t.departamentoId = :departamentoId', {
        departamentoId: filtros.departamentoId,
      });
    }
    if (filtros.municipioId) {
      qb.andWhere('t.municipioId = :municipioId', {
        municipioId: filtros.municipioId,
      });
    }
    if (filtros.categoriaId) {
      qb.andWhere(
        `EXISTS (SELECT 1 FROM tramites_categorias x
                 WHERE x.tramite_id = "t".id AND x.categoria_id = :categoriaId)`,
        { categoriaId: filtros.categoriaId },
      );
    }
    if (q) {
      // Por palabra (no por frase completa): asi "policia antecedentes" y
      // "antecedentes policiacos" encuentran lo mismo sin importar el orden,
      // y una palabra con error/variante ("policiacos") no arruina las demas.
      const palabras = [
        ...new Set(q.toLowerCase().split(/\s+/).filter((p) => p.length >= 2)),
      ].slice(0, 6);

      if (palabras.length === 0) {
        qb.andWhere('"t".nombre ILIKE :qCorto', {
          qCorto: `%${escaparLike(q.trim())}%`,
        });
      } else {
        palabras.forEach((palabra, i) => {
          const p = `qp${i}`;
          const pLike = `qpLike${i}`;
          qb.andWhere(
            `(
              "t".busqueda_tsv @@ websearch_to_tsquery('spanish', :${p})
              OR to_tsvector('spanish', f_array_to_string("t".etiquetas, ' '))
                 @@ websearch_to_tsquery('spanish', :${p})
              OR similarity(lower("t".nombre), :${p}) > 0.28
              OR EXISTS (
                SELECT 1 FROM unnest("t".etiquetas) AS et
                WHERE similarity(lower(et), :${p}) > 0.3
              )
              OR "t".codigo ILIKE :${pLike}
            )`,
            { [p]: palabra, [pLike]: `%${escaparLike(palabra)}%` },
          );
        });
      }
    }
  }

  private aplicarOrden(
    qb: SelectQueryBuilder<Tramite>,
    orden: FiltrosTramiteDto['orden'],
  ): void {
    switch (orden) {
      case 'nombre':
        qb.orderBy('t.nombre', 'ASC');
        break;
      case 'populares':
        qb.orderBy('t.vistas', 'DESC').addOrderBy('t.nombre', 'ASC');
        break;
      default:
        qb.orderBy('t.publicadoEn', 'DESC', 'NULLS LAST').addOrderBy(
          't.fechaActualizacion',
          'DESC',
        );
    }
  }

  private async cargarBasico(id: string): Promise<Tramite> {
    const tramite = await this.repo.findOne({ where: { id } });
    if (!tramite) {
      throw new NotFoundException('Tramite no encontrado');
    }
    return tramite;
  }

  private async cargarCompleto(id: string): Promise<Tramite> {
    const tramite = await this.repo.findOne({
      where: { id },
      relations: RELACIONES_DETALLE,
    });
    if (!tramite) {
      throw new NotFoundException('Tramite no encontrado');
    }
    return tramite;
  }

  private async asegurarInstitucion(id: string): Promise<void> {
    if (!(await this.instituciones.existsBy({ id }))) {
      throw new NotFoundException('La institucion indicada no existe');
    }
  }

  private async sincronizarCategorias(
    manager: EntityManager,
    tramiteId: string,
    categoriaIds: string[],
  ): Promise<void> {
    if (categoriaIds.length > 0) {
      const existentes = await manager
        .getRepository(Categoria)
        .countBy({ id: In(categoriaIds) });
      if (existentes !== categoriaIds.length) {
        throw new BadRequestException(
          'Una o mas categorias indicadas no existen',
        );
      }
    }
    await manager.getRepository(TramiteCategoria).delete({ tramiteId });
    if (categoriaIds.length > 0) {
      await manager.getRepository(TramiteCategoria).save(
        categoriaIds.map((categoriaId, indice) => ({
          tramiteId,
          categoriaId,
          esPrincipal: indice === 0,
        })),
      );
    }
  }

  private async siguienteOrden<T extends ObjectLiteral>(
    repo: Repository<T>,
    tramiteId: string,
  ): Promise<number> {
    const fila = await repo
      .createQueryBuilder('r')
      .select('COALESCE(MAX(r.orden), -1)', 'max')
      .where('r.tramite_id = :tramiteId', { tramiteId })
      .getRawOne<{ max: number }>();
    return Number(fila?.max ?? -1) + 1;
  }

  private async generarPublicIdUnico(): Promise<string> {
    for (let intento = 0; intento < 12; intento += 1) {
      const candidato = `TR-${randomBytes(5).toString('hex').toUpperCase()}`;
      if (!(await this.repo.existsBy({ publicId: candidato }))) {
        return candidato;
      }
    }
    return `TR-${Date.now().toString(36).toUpperCase()}`;
  }

  /** Campos escalares comunes entre crear y actualizar. */
  private camposDesdeDto(
    dto: CrearTramiteDto | ActualizarTramiteDto,
  ): Partial<Tramite> {
    const campos: Partial<Tramite> = {};
    const asignar = <K extends keyof Tramite>(
      clave: K,
      valor: Tramite[K] | undefined,
    ) => {
      if (valor !== undefined) campos[clave] = valor;
    };

    asignar('descripcionCorta', dto.descripcionCorta?.trim() ?? undefined);
    asignar('descripcion', dto.descripcion ?? undefined);
    asignar('resultado', dto.resultado?.trim() ?? undefined);
    asignar('modoEjecucion', dto.modoEjecucion);
    asignar('modalidad', dto.modalidad);
    asignar('dirigidoA', dto.dirigidoA?.trim() ?? undefined);
    asignar('disponibleEnLinea', dto.disponibleEnLinea);
    asignar('urlExterna', dto.urlExterna);
    asignar('urlFuenteOficial', dto.urlFuenteOficial);
    asignar('tipoCosto', dto.tipoCosto);
    asignar('costo', dto.costo);
    asignar('moneda', dto.moneda);
    asignar('tiempoRespuestaValor', dto.tiempoRespuestaValor);
    asignar('tiempoRespuestaUnidad', dto.tiempoRespuestaUnidad);
    asignar('tiempoRespuestaTexto', dto.tiempoRespuestaTexto?.trim() ?? undefined);
    asignar('fechaInicio', dto.fechaInicio);
    asignar('fechaVencimiento', dto.fechaVencimiento);
    asignar('periodoValidez', dto.periodoValidez?.trim() ?? undefined);
    asignar('departamentoId', dto.departamentoId);
    asignar('municipioId', dto.municipioId);
    asignar('calidadDatos', dto.calidadDatos);
    return campos;
  }

  private traducirError(error: unknown): never {
    if (error instanceof QueryFailedError) {
      const code = (error.driverError as { code?: string })?.code;
      if (code === CODIGO_UNIQUE_VIOLATION) {
        throw new ConflictException('Ya existe un tramite con ese slug o codigo');
      }
      if (code === CODIGO_FK_VIOLATION) {
        throw new BadRequestException('Referencia invalida a otra entidad');
      }
    }
    throw error as Error;
  }
}
