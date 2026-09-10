import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Req,
} from '@nestjs/common';
import type { Request } from 'express';
import { Publico } from '../../common/decorators/publico.decorator.js';
import { UsuarioActual } from '../../common/decorators/usuario-actual.decorator.js';
import type { UsuarioAutenticado } from '../../common/interfaces/usuario-autenticado.interface.js';
import type { ContextoPeticion } from './servicios/token.service.js';
import { AuthService } from './auth.service.js';
import { LoginDto } from './dto/login.dto.js';
import { RefrescarTokenDto } from './dto/refrescar-token.dto.js';
import { RegistroDto } from './dto/registro.dto.js';

@Controller('auth')
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  private contexto(req: Request): ContextoPeticion {
    return {
      userAgent: req.headers['user-agent'] ?? null,
      ip: req.ip ?? null,
    };
  }

  @Publico()
  @Post('registro')
  registro(@Body() dto: RegistroDto, @Req() req: Request) {
    return this.auth.registrar(dto, this.contexto(req));
  }

  @Publico()
  @HttpCode(HttpStatus.OK)
  @Post('login')
  login(@Body() dto: LoginDto, @Req() req: Request) {
    return this.auth.login(dto, this.contexto(req));
  }

  @Publico()
  @HttpCode(HttpStatus.OK)
  @Post('refrescar')
  refrescar(@Body() dto: RefrescarTokenDto, @Req() req: Request) {
    return this.auth.refrescar(dto.refreshToken, this.contexto(req));
  }

  @HttpCode(HttpStatus.NO_CONTENT)
  @Post('logout')
  async logout(@UsuarioActual() usuario: UsuarioAutenticado) {
    await this.auth.logout(usuario.sesionId);
  }

  @Get('perfil')
  perfil(@UsuarioActual() usuario: UsuarioAutenticado) {
    return this.auth.perfil(usuario);
  }
}
