import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
} from '@nestjs/common';
import { Publico } from '../../common/decorators/publico.decorator.js';
import { UsuarioActual } from '../../common/decorators/usuario-actual.decorator.js';
import {
  DESCRIPCION_SCOPES,
  SCOPES_DISPONIBLES,
} from './api-keys.constants.js';
import {
  LlaveApiActual,
  RequiereApiKey,
} from './api-keys.guard.js';
import type { ContextoLlaveApi } from './api-keys.service.js';
import { ApiKeysService } from './api-keys.service.js';
import { CrearLlaveApiDto } from './dto/api-keys.dto.js';

@Controller('api-keys')
export class ApiKeysController {
  constructor(private readonly service: ApiKeysService) {}

  /** Catalogo de scopes disponibles. Publico, para la documentacion. */
  @Publico()
  @Get('scopes')
  scopes() {
    return SCOPES_DISPONIBLES.map((scope) => ({
      scope,
      descripcion: DESCRIPCION_SCOPES[scope],
    }));
  }

  /**
   * Informacion de la propia API key. Sirve para que el desarrollador
   * verifique que su llave funciona. Requiere X-API-Key, no JWT.
   */
  @Publico()
  @RequiereApiKey()
  @Get('uso')
  uso(@LlaveApiActual() llave: ContextoLlaveApi) {
    return {
      nombre: llave.nombre,
      scopes: llave.scopes,
      limiteTasa: llave.limiteTasa,
      nota: 'El estado del limite de tasa va en los headers X-RateLimit-*.',
    };
  }

  // ---- Gestion (requiere sesion de usuario / JWT) ---------------------

  @Post()
  crear(
    @UsuarioActual('id') usuarioId: string,
    @Body() dto: CrearLlaveApiDto,
  ) {
    return this.service.crear(usuarioId, dto);
  }

  @Get()
  listar(@UsuarioActual('id') usuarioId: string) {
    return this.service.listar(usuarioId);
  }

  @Get(':id')
  obtener(
    @UsuarioActual('id') usuarioId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.service.obtenerResumen(usuarioId, id);
  }

  @HttpCode(HttpStatus.OK)
  @Post(':id/regenerar')
  regenerar(
    @UsuarioActual('id') usuarioId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.service.regenerar(usuarioId, id);
  }

  @HttpCode(HttpStatus.OK)
  @Post(':id/revocar')
  revocar(
    @UsuarioActual('id') usuarioId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.service.revocar(usuarioId, id);
  }

  @HttpCode(HttpStatus.NO_CONTENT)
  @Delete(':id')
  async eliminar(
    @UsuarioActual('id') usuarioId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    await this.service.eliminar(usuarioId, id);
  }
}
