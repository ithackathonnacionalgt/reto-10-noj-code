import { Controller, Get, Param, ParseUUIDPipe, Query } from '@nestjs/common';
import { Publico } from '../../common/decorators/publico.decorator.js';
import { UbicacionesService } from './ubicaciones.service.js';

/** API publica de departamentos y municipios de Guatemala. */
@Publico()
@Controller()
export class UbicacionesController {
  constructor(private readonly ubicaciones: UbicacionesService) {}

  @Get('departments')
  departamentos() {
    return this.ubicaciones.listarDepartamentos();
  }

  @Get('municipalities')
  municipios(@Query('departmentId') departamentoId?: string) {
    return this.ubicaciones.listarMunicipios(departamentoId);
  }

  @Get('departments/:id/municipalities')
  municipiosDe(@Param('id', ParseUUIDPipe) id: string) {
    return this.ubicaciones.listarMunicipios(id);
  }
}
