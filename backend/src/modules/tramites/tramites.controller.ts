import { Controller, Get, Param, Query } from '@nestjs/common';
import { Publico } from '../../common/decorators/publico.decorator.js';
import { TramitesService } from './tramites.service.js';
import { FiltrosTramiteDto } from './dto/tramites.dto.js';

/** API publica de tramites (CLAUDE.md 16, 30, 38). */
@Publico()
@Controller('procedures')
export class TramitesController {
  constructor(private readonly tramites: TramitesService) {}

  @Get()
  listar(@Query() filtros: FiltrosTramiteDto) {
    return this.tramites.listarPublicos(filtros);
  }

  /** Acepta slug o publicId (ej. TR-AB12CD34). */
  @Get(':slug')
  obtener(@Param('slug') slug: string) {
    return this.tramites.obtenerPublico(slug);
  }
}
