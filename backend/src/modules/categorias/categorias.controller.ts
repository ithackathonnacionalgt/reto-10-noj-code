import { Controller, Get, Param, Query } from '@nestjs/common';
import { Publico } from '../../common/decorators/publico.decorator.js';
import { CategoriasService } from './categorias.service.js';
import { FiltrosCategoriaDto } from './dto/categorias.dto.js';

/** API publica de categorias (CLAUDE.md 16). */
@Publico()
@Controller('categories')
export class CategoriasController {
  constructor(private readonly categorias: CategoriasService) {}

  @Get()
  listar(@Query() filtros: FiltrosCategoriaDto) {
    return this.categorias.listarPublicas(filtros);
  }

  @Get(':slug')
  obtener(@Param('slug') slug: string) {
    return this.categorias.obtenerPublicaPorSlug(slug);
  }
}
