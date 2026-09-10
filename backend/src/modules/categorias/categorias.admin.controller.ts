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
import { PERMISOS } from '../auth/auth.constants.js';
import { EstadoPublicacion } from '../../database/entities/enums.js';
import { CategoriasService } from './categorias.service.js';
import {
  ActualizarCategoriaDto,
  CrearCategoriaDto,
  FiltrosCategoriaDto,
} from './dto/categorias.dto.js';

/** API administrativa de categorias (CLAUDE.md 24). */
@Controller('admin/categories')
export class CategoriasAdminController {
  constructor(private readonly categorias: CategoriasService) {}

  @Permisos(PERMISOS.CATEGORIAS_LEER)
  @Get()
  listar(@Query() filtros: FiltrosCategoriaDto) {
    return this.categorias.listarAdmin(filtros);
  }

  @Permisos(PERMISOS.CATEGORIAS_LEER)
  @Get(':id')
  obtener(@Param('id', ParseUUIDPipe) id: string) {
    return this.categorias.obtenerAdmin(id);
  }

  @Permisos(PERMISOS.CATEGORIAS_ESCRIBIR)
  @Post()
  crear(@Body() dto: CrearCategoriaDto) {
    return this.categorias.crear(dto);
  }

  @Permisos(PERMISOS.CATEGORIAS_ESCRIBIR)
  @Patch(':id')
  actualizar(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: ActualizarCategoriaDto,
  ) {
    return this.categorias.actualizar(id, dto);
  }

  @Permisos(PERMISOS.CATEGORIAS_ESCRIBIR)
  @HttpCode(HttpStatus.OK)
  @Post(':id/publicar')
  publicar(@Param('id', ParseUUIDPipe) id: string) {
    return this.categorias.cambiarEstado(id, EstadoPublicacion.PUBLICADO);
  }

  @Permisos(PERMISOS.CATEGORIAS_ESCRIBIR)
  @HttpCode(HttpStatus.OK)
  @Post(':id/archivar')
  archivar(@Param('id', ParseUUIDPipe) id: string) {
    return this.categorias.cambiarEstado(id, EstadoPublicacion.ARCHIVADO);
  }

  @Permisos(PERMISOS.CATEGORIAS_ESCRIBIR)
  @HttpCode(HttpStatus.NO_CONTENT)
  @Delete(':id')
  async eliminar(@Param('id', ParseUUIDPipe) id: string) {
    await this.categorias.eliminar(id);
  }
}
