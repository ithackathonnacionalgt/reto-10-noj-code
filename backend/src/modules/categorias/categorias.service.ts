import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ILike, Not, QueryFailedError, Repository } from 'typeorm';
import {
  paginar,
  type RespuestaPaginada,
} from '../../common/dto/respuesta-paginada.js';
import { asegurarSlugUnico, generarSlug } from '../../common/utils/slug.js';
import { EstadoPublicacion } from '../../database/entities/enums.js';
import { Categoria } from '../../database/entities/schema.js';
import type {
  ActualizarCategoriaDto,
  CrearCategoriaDto,
  FiltrosCategoriaDto,
} from './dto/categorias.dto.js';

const CODIGO_FK_VIOLATION = '23503';

@Injectable()
export class CategoriasService {
  constructor(
    @InjectRepository(Categoria)
    private readonly repo: Repository<Categoria>,
  ) {}

  listarPublicas(
    filtros: FiltrosCategoriaDto,
  ): Promise<RespuestaPaginada<Categoria>> {
    return this.listar(filtros, EstadoPublicacion.PUBLICADO);
  }

  listarAdmin(
    filtros: FiltrosCategoriaDto,
  ): Promise<RespuestaPaginada<Categoria>> {
    return this.listar(filtros, filtros.estado ?? null);
  }

  private async listar(
    filtros: FiltrosCategoriaDto,
    estado: EstadoPublicacion | null,
  ): Promise<RespuestaPaginada<Categoria>> {
    const base: Record<string, unknown> = {};
    if (estado) base.estado = estado;
    const where = filtros.q
      ? [{ ...base, nombre: ILike(`%${filtros.q}%`) }]
      : base;

    const [data, total] = await this.repo.findAndCount({
      where,
      order: { orden: 'ASC', nombre: 'ASC' },
      skip: filtros.offset,
      take: filtros.limit,
    });
    return paginar(data, total, filtros.page, filtros.limit);
  }

  async obtenerPublicaPorSlug(slug: string): Promise<Categoria> {
    const categoria = await this.repo.findOne({
      where: { slug, estado: EstadoPublicacion.PUBLICADO },
      relations: { traducciones: true },
    });
    if (!categoria) {
      throw new NotFoundException('Categoria no encontrada');
    }
    return categoria;
  }

  async obtenerAdmin(id: string): Promise<Categoria> {
    const categoria = await this.repo.findOne({ where: { id } });
    if (!categoria) {
      throw new NotFoundException('Categoria no encontrada');
    }
    return categoria;
  }

  async crear(dto: CrearCategoriaDto): Promise<Categoria> {
    const slug = await asegurarSlugUnico(
      generarSlug(dto.slug ?? dto.nombre),
      (candidato) => this.repo.existsBy({ slug: candidato }),
    );
    return this.repo.save(
      this.repo.create({
        nombre: dto.nombre.trim(),
        urlIcono: dto.urlIcono ?? null,
        descripcion: dto.descripcion?.trim() ?? null,
        orden: dto.orden ?? 0,
        slug,
        estado: EstadoPublicacion.BORRADOR,
      }),
    );
  }

  async actualizar(
    id: string,
    dto: ActualizarCategoriaDto,
  ): Promise<Categoria> {
    const categoria = await this.obtenerAdmin(id);
    if (dto.slug !== undefined) {
      categoria.slug = await asegurarSlugUnico(
        generarSlug(dto.slug || categoria.nombre),
        (candidato) => this.repo.existsBy({ slug: candidato, id: Not(id) }),
      );
    }
    if (dto.nombre !== undefined) categoria.nombre = dto.nombre.trim();
    if (dto.urlIcono !== undefined) categoria.urlIcono = dto.urlIcono ?? null;
    if (dto.descripcion !== undefined)
      categoria.descripcion = dto.descripcion?.trim() ?? null;
    if (dto.orden !== undefined) categoria.orden = dto.orden;
    return this.repo.save(categoria);
  }

  async cambiarEstado(
    id: string,
    nuevoEstado: EstadoPublicacion,
  ): Promise<Categoria> {
    const categoria = await this.obtenerAdmin(id);
    categoria.estado = nuevoEstado;
    return this.repo.save(categoria);
  }

  async eliminar(id: string): Promise<void> {
    const categoria = await this.obtenerAdmin(id);
    try {
      await this.repo.remove(categoria);
    } catch (error) {
      if (
        error instanceof QueryFailedError &&
        (error.driverError as { code?: string })?.code === CODIGO_FK_VIOLATION
      ) {
        throw new ConflictException(
          'No se puede eliminar: la categoria tiene tramites asociados',
        );
      }
      throw error;
    }
  }
}
