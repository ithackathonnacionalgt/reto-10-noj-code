import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { Permisos } from '../../common/decorators/permisos.decorator.js';
import { UsuarioActual } from '../../common/decorators/usuario-actual.decorator.js';
import { PERMISOS } from '../auth/auth.constants.js';
import { EstadoPublicacion } from '../../database/entities/enums.js';
import { InstitucionesService } from './instituciones.service.js';
import {
  ActualizarInstitucionDto,
  CrearInstitucionDto,
  FiltrosInstitucionDto,
} from './dto/instituciones.dto.js';

/** API administrativa de instituciones (CLAUDE.md 24, 38). */
@Controller('admin/institutions')
export class InstitucionesAdminController {
  constructor(private readonly instituciones: InstitucionesService) {}

  @Permisos(PERMISOS.INSTITUCIONES_LEER)
  @Get()
  listar(@Query() filtros: FiltrosInstitucionDto) {
    return this.instituciones.listarAdmin(filtros);
  }

  @Permisos(PERMISOS.INSTITUCIONES_LEER)
  @Get(':id')
  obtener(@Param('id', ParseUUIDPipe) id: string) {
    return this.instituciones.obtenerAdmin(id);
  }

  @Permisos(PERMISOS.INSTITUCIONES_ESCRIBIR)
  @Post()
  crear(
    @Body() dto: CrearInstitucionDto,
    @UsuarioActual('id') usuarioId: string,
  ) {
    return this.instituciones.crear(dto, usuarioId);
  }

  @Permisos(PERMISOS.INSTITUCIONES_ESCRIBIR)
  @Patch(':id')
  actualizar(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: ActualizarInstitucionDto,
    @UsuarioActual('id') usuarioId: string,
  ) {
    return this.instituciones.actualizar(id, dto, usuarioId);
  }

  @Permisos(PERMISOS.INSTITUCIONES_ESCRIBIR)
  @HttpCode(HttpStatus.OK)
  @Post(':id/publicar')
  publicar(
    @Param('id', ParseUUIDPipe) id: string,
    @UsuarioActual('id') usuarioId: string,
  ) {
    return this.instituciones.cambiarEstado(
      id,
      EstadoPublicacion.PUBLICADO,
      usuarioId,
    );
  }

  @Permisos(PERMISOS.INSTITUCIONES_ESCRIBIR)
  @HttpCode(HttpStatus.OK)
  @Post(':id/archivar')
  archivar(
    @Param('id', ParseUUIDPipe) id: string,
    @UsuarioActual('id') usuarioId: string,
  ) {
    return this.instituciones.cambiarEstado(
      id,
      EstadoPublicacion.ARCHIVADO,
      usuarioId,
    );
  }

  @Permisos(PERMISOS.INSTITUCIONES_ESCRIBIR)
  @HttpCode(HttpStatus.NO_CONTENT)
  @Delete(':id')
  async eliminar(@Param('id', ParseUUIDPipe) id: string) {
    await this.instituciones.eliminar(id);
  }
}
