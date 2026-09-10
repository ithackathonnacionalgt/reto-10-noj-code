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
import { TramitesService } from './tramites.service.js';
import {
  ActualizarTramiteDto,
  CrearPasoDto,
  CrearRequisitoDto,
  CrearTramiteDto,
  FiltrosTramiteDto,
} from './dto/tramites.dto.js';

/** API administrativa de tramites (CLAUDE.md 24, 38). */
@Controller('admin/procedures')
export class TramitesAdminController {
  constructor(private readonly tramites: TramitesService) {}

  @Permisos(PERMISOS.TRAMITES_LEER)
  @Get()
  listar(@Query() filtros: FiltrosTramiteDto) {
    return this.tramites.listarAdmin(filtros);
  }

  @Permisos(PERMISOS.TRAMITES_LEER)
  @Get(':id')
  obtener(@Param('id', ParseUUIDPipe) id: string) {
    return this.tramites.obtenerAdmin(id);
  }

  @Permisos(PERMISOS.TRAMITES_ESCRIBIR)
  @Post()
  crear(@Body() dto: CrearTramiteDto, @UsuarioActual('id') usuarioId: string) {
    return this.tramites.crear(dto, usuarioId);
  }

  @Permisos(PERMISOS.TRAMITES_ESCRIBIR)
  @Patch(':id')
  actualizar(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: ActualizarTramiteDto,
    @UsuarioActual('id') usuarioId: string,
  ) {
    return this.tramites.actualizar(id, dto, usuarioId);
  }

  @Permisos(PERMISOS.TRAMITES_PUBLICAR)
  @HttpCode(HttpStatus.OK)
  @Post(':id/publicar')
  publicar(
    @Param('id', ParseUUIDPipe) id: string,
    @UsuarioActual('id') usuarioId: string,
  ) {
    return this.tramites.publicar(id, usuarioId);
  }

  @Permisos(PERMISOS.TRAMITES_PUBLICAR)
  @HttpCode(HttpStatus.OK)
  @Post(':id/archivar')
  archivar(
    @Param('id', ParseUUIDPipe) id: string,
    @UsuarioActual('id') usuarioId: string,
  ) {
    return this.tramites.cambiarEstado(
      id,
      EstadoPublicacion.ARCHIVADO,
      usuarioId,
    );
  }

  @Permisos(PERMISOS.TRAMITES_ESCRIBIR)
  @HttpCode(HttpStatus.OK)
  @Post(':id/enviar-a-revision')
  enviarARevision(
    @Param('id', ParseUUIDPipe) id: string,
    @UsuarioActual('id') usuarioId: string,
  ) {
    return this.tramites.cambiarEstado(
      id,
      EstadoPublicacion.EN_REVISION,
      usuarioId,
    );
  }

  @Permisos(PERMISOS.TRAMITES_ESCRIBIR)
  @HttpCode(HttpStatus.NO_CONTENT)
  @Delete(':id')
  async eliminar(@Param('id', ParseUUIDPipe) id: string) {
    await this.tramites.eliminar(id);
  }

  // ---- Requisitos --------------------------------------------------------

  @Permisos(PERMISOS.TRAMITES_LEER)
  @Get(':id/requisitos')
  listarRequisitos(@Param('id', ParseUUIDPipe) id: string) {
    return this.tramites.listarRequisitos(id);
  }

  @Permisos(PERMISOS.TRAMITES_ESCRIBIR)
  @Post(':id/requisitos')
  agregarRequisito(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: CrearRequisitoDto,
  ) {
    return this.tramites.agregarRequisito(id, dto);
  }

  @Permisos(PERMISOS.TRAMITES_ESCRIBIR)
  @HttpCode(HttpStatus.NO_CONTENT)
  @Delete(':id/requisitos/:requisitoId')
  async eliminarRequisito(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('requisitoId', ParseUUIDPipe) requisitoId: string,
  ) {
    await this.tramites.eliminarRequisito(id, requisitoId);
  }

  // ---- Pasos ------------------------------------------------------------

  @Permisos(PERMISOS.TRAMITES_LEER)
  @Get(':id/pasos')
  listarPasos(@Param('id', ParseUUIDPipe) id: string) {
    return this.tramites.listarPasos(id);
  }

  @Permisos(PERMISOS.TRAMITES_ESCRIBIR)
  @Post(':id/pasos')
  agregarPaso(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: CrearPasoDto,
  ) {
    return this.tramites.agregarPaso(id, dto);
  }

  @Permisos(PERMISOS.TRAMITES_ESCRIBIR)
  @HttpCode(HttpStatus.NO_CONTENT)
  @Delete(':id/pasos/:pasoId')
  async eliminarPaso(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('pasoId', ParseUUIDPipe) pasoId: string,
  ) {
    await this.tramites.eliminarPaso(id, pasoId);
  }
}
