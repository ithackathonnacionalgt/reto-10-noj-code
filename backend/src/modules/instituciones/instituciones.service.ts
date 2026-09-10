import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ILike, QueryFailedError, Repository, Not } from 'typeorm';
import {
  paginar,
  type RespuestaPaginada,
} from '../../common/dto/respuesta-paginada.js';
import {
  asegurarSlugUnico,
  generarSlug,
} from '../../common/utils/slug.js';
import { EstadoPublicacion } from '../../database/entities/enums.js';
import { Institucion } from '../../database/entities/schema.js';
import type {
  ActualizarInstitucionDto,
  CrearInstitucionDto,
  FiltrosInstitucionDto,
} from './dto/instituciones.dto.js';

const CODIGO_FK_VIOLATION = '23503';

@Injectable()
export class InstitucionesService {
  constructor(
    @InjectRepository(Institucion)
    private readonly repo: Repository<Institucion>,
  ) {}

  /** Listado publico: solo instituciones publicadas (CLAUDE.md 23). */
  listarPublicas(
    filtros: FiltrosInstitucionDto,
  ): Promise<RespuestaPaginada<Institucion>> {
    return this.listar(filtros, EstadoPublicacion.PUBLICADO);
  }

  /** Listado administrativo: cualquier estado. */
  listarAdmin(
    filtros: FiltrosInstitucionDto,
  ): Promise<RespuestaPaginada<Institucion>> {
    return this.listar(filtros, filtros.estado ?? null);
  }

  private async listar(
    filtros: FiltrosInstitucionDto,
    estado: EstadoPublicacion | null,
  ): Promise<RespuestaPaginada<Institucion>> {
    const where: Record<string, unknown>[] = [];
    const base: Record<string, unknown> = {};
    if (estado) base.estado = estado;

    if (filtros.q) {
      where.push({ ...base, nombre: ILike(`%${filtros.q}%`) });
      where.push({ ...base, siglas: ILike(`%${filtros.q}%`) });
    }

    const [data, total] = await this.repo.findAndCount({
      where: where.length > 0 ? where : base,
      order: { nombre: 'ASC' },
      skip: filtros.offset,
      take: filtros.limit,
    });
    return paginar(data, total, filtros.page, filtros.limit);
  }

  async obtenerPublicaPorSlug(slug: string): Promise<Institucion> {
    const institucion = await this.repo.findOne({
      where: { slug, estado: EstadoPublicacion.PUBLICADO },
      relations: { contactos: true, direcciones: true },
    });
    if (!institucion) {
      throw new NotFoundException('Institucion no encontrada');
    }
    return institucion;
  }

  async obtenerAdmin(id: string): Promise<Institucion> {
    const institucion = await this.repo.findOne({
      where: { id },
      relations: { contactos: true, direcciones: true },
    });
    if (!institucion) {
      throw new NotFoundException('Institucion no encontrada');
    }
    return institucion;
  }

  async crear(
    dto: CrearInstitucionDto,
    usuarioId: string,
  ): Promise<Institucion> {
    const slug = await asegurarSlugUnico(
      generarSlug(dto.slug ?? dto.nombre),
      (candidato) => this.repo.existsBy({ slug: candidato }),
    );
    const institucion = this.repo.create({
      nombre: dto.nombre.trim(),
      siglas: dto.siglas?.trim() ?? null,
      urlLogo: dto.urlLogo ?? null,
      sitioWeb: dto.sitioWeb ?? null,
      descripcion: dto.descripcion?.trim() ?? null,
      slug,
      estado: EstadoPublicacion.BORRADOR,
      creadoPor: usuarioId,
      actualizadoPor: usuarioId,
    });
    return this.repo.save(institucion);
  }

  async actualizar(
    id: string,
    dto: ActualizarInstitucionDto,
    usuarioId: string,
  ): Promise<Institucion> {
    const institucion = await this.obtenerAdmin(id);

    if (dto.slug !== undefined) {
      institucion.slug = await asegurarSlugUnico(
        generarSlug(dto.slug || institucion.nombre),
        (candidato) =>
          this.repo.existsBy({ slug: candidato, id: Not(id) }),
      );
    }
    if (dto.nombre !== undefined) institucion.nombre = dto.nombre.trim();
    if (dto.siglas !== undefined)
      institucion.siglas = dto.siglas?.trim() ?? null;
    if (dto.urlLogo !== undefined) institucion.urlLogo = dto.urlLogo ?? null;
    if (dto.sitioWeb !== undefined)
      institucion.sitioWeb = dto.sitioWeb ?? null;
    if (dto.descripcion !== undefined)
      institucion.descripcion = dto.descripcion?.trim() ?? null;
    institucion.actualizadoPor = usuarioId;

    return this.repo.save(institucion);
  }

  async cambiarEstado(
    id: string,
    nuevoEstado: EstadoPublicacion,
    usuarioId: string,
  ): Promise<Institucion> {
    const institucion = await this.obtenerAdmin(id);
    institucion.estado = nuevoEstado;
    institucion.actualizadoPor = usuarioId;
    if (nuevoEstado === EstadoPublicacion.PUBLICADO && !institucion.publicadoEn) {
      institucion.publicadoEn = new Date();
    }
    return this.repo.save(institucion);
  }

  async eliminar(id: string): Promise<void> {
    const institucion = await this.obtenerAdmin(id);
    try {
      await this.repo.remove(institucion);
    } catch (error) {
      if (
        error instanceof QueryFailedError &&
        (error.driverError as { code?: string })?.code === CODIGO_FK_VIOLATION
      ) {
        throw new ConflictException(
          'No se puede eliminar: la institucion tiene tramites asociados',
        );
      }
      throw error;
    }
  }
}
