import { Controller, Get, Param, Query } from '@nestjs/common';
import { Publico } from '../../common/decorators/publico.decorator.js';
import { InstitucionesService } from './instituciones.service.js';
import { FiltrosInstitucionDto } from './dto/instituciones.dto.js';

/** API publica de instituciones (CLAUDE.md 16, 38). */
@Publico()
@Controller('institutions')
export class InstitucionesController {
  constructor(private readonly instituciones: InstitucionesService) {}

  @Get()
  listar(@Query() filtros: FiltrosInstitucionDto) {
    return this.instituciones.listarPublicas(filtros);
  }

  @Get(':slug')
  obtener(@Param('slug') slug: string) {
    return this.instituciones.obtenerPublicaPorSlug(slug);
  }
}
