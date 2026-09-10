import { randomBytes, createHash } from 'node:crypto';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, Repository } from 'typeorm';
import { RefreshToken } from '../../../database/entities/schema.js';
import { Sesion } from '../../../database/entities/schema.js';
import { duracionAMs } from '../../../common/utils/duracion.js';
import type { PayloadJwt } from '../../../common/interfaces/usuario-autenticado.interface.js';

export interface ContextoPeticion {
  userAgent?: string | null;
  ip?: string | null;
}

export interface ClaimsUsuario {
  roles: string[];
  permisos: string[];
}

export interface DatosUsuarioToken extends ClaimsUsuario {
  email: string;
}

export interface ParDeTokens {
  accessToken: string;
  refreshToken: string;
  tokenType: 'Bearer';
  expiresIn: number;
}

/**
 * Emision, validacion y rotacion de tokens (CLAUDE.md 19).
 * - Access token: JWT corto firmado con JWT_SECRET.
 * - Refresh token: valor opaco aleatorio; en la BD solo se guarda su hash.
 *   La rotacion revoca el anterior y detecta reuso.
 */
@Injectable()
export class TokenService {
  constructor(
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
    @InjectRepository(Sesion)
    private readonly sesiones: Repository<Sesion>,
    @InjectRepository(RefreshToken)
    private readonly refreshTokens: Repository<RefreshToken>,
  ) {}

  private get ttlAccesoMs(): number {
    return duracionAMs(
      this.config.get<string>('JWT_ACCESS_EXPIRES_IN') ?? '15m',
    );
  }

  private get ttlRefreshMs(): number {
    return duracionAMs(
      this.config.get<string>('JWT_REFRESH_EXPIRES_IN') ?? '7d',
    );
  }

  private hashRefresh(valorPlano: string): string {
    return createHash('sha256').update(valorPlano).digest('hex');
  }

  /** Crea sesion + refresh token y firma el access token. */
  async generarPar(
    usuario: { id: string; email: string },
    claims: ClaimsUsuario,
    ctx: ContextoPeticion,
  ): Promise<ParDeTokens> {
    const ahora = Date.now();
    const sesion = await this.sesiones.save(
      this.sesiones.create({
        usuarioId: usuario.id,
        userAgent: ctx.userAgent ?? null,
        ip: ctx.ip ?? null,
        expiraEn: new Date(ahora + this.ttlRefreshMs),
        ultimaActividadEn: new Date(ahora),
      }),
    );
    const refreshPlano = await this.crearRefresh(sesion.id);
    const accessToken = await this.firmarAcceso(usuario, sesion.id, claims);
    return {
      accessToken,
      refreshToken: refreshPlano,
      tokenType: 'Bearer',
      expiresIn: Math.floor(this.ttlAccesoMs / 1000),
    };
  }

  /** Valida el refresh recibido, rota el token y emite un par nuevo. */
  async rotar(
    refreshPlano: string,
    ctx: ContextoPeticion,
    recargarDatos: (usuarioId: string) => Promise<DatosUsuarioToken>,
  ): Promise<ParDeTokens> {
    const hash = this.hashRefresh(refreshPlano);
    const registro = await this.refreshTokens.findOne({ where: { hashToken: hash } });
    if (!registro) {
      throw new UnauthorizedException('Refresh token invalido');
    }

    const sesion = await this.sesiones.findOne({
      where: { id: registro.sesionId },
    });

    // Reuso de un token ya revocado: se invalida toda la sesion.
    if (registro.revocadoEn) {
      if (sesion) {
        await this.revocarSesion(sesion.id);
      }
      throw new UnauthorizedException('Refresh token reutilizado; sesion revocada');
    }

    if (registro.expiraEn.getTime() < Date.now()) {
      throw new UnauthorizedException('Refresh token expirado');
    }

    if (
      !sesion ||
      sesion.revocadaEn ||
      sesion.expiraEn.getTime() < Date.now()
    ) {
      throw new UnauthorizedException('La sesion ya no es valida');
    }

    const nuevoRefresh = await this.crearRefresh(sesion.id);
    registro.revocadoEn = new Date();
    await this.refreshTokens.save(registro);

    sesion.ultimaActividadEn = new Date();
    if (ctx.userAgent) sesion.userAgent = ctx.userAgent;
    if (ctx.ip) sesion.ip = ctx.ip;
    await this.sesiones.save(sesion);

    const datos = await recargarDatos(sesion.usuarioId);
    const accessToken = await this.firmarAcceso(
      { id: sesion.usuarioId, email: datos.email },
      sesion.id,
      { roles: datos.roles, permisos: datos.permisos },
    );

    return {
      accessToken,
      refreshToken: nuevoRefresh,
      tokenType: 'Bearer',
      expiresIn: Math.floor(this.ttlAccesoMs / 1000),
    };
  }

  /** Revoca la sesion y todos sus refresh tokens vigentes. */
  async revocarSesion(sesionId: string): Promise<void> {
    const ahora = new Date();
    await this.sesiones.update(
      { id: sesionId, revocadaEn: IsNull() },
      { revocadaEn: ahora },
    );
    await this.refreshTokens.update(
      { sesionId, revocadoEn: IsNull() },
      { revocadoEn: ahora },
    );
  }

  private async crearRefresh(sesionId: string): Promise<string> {
    const valorPlano = randomBytes(48).toString('base64url');
    await this.refreshTokens.save(
      this.refreshTokens.create({
        sesionId,
        hashToken: this.hashRefresh(valorPlano),
        expiraEn: new Date(Date.now() + this.ttlRefreshMs),
      }),
    );
    return valorPlano;
  }

  private firmarAcceso(
    usuario: { id: string; email: string },
    sesionId: string,
    claims: ClaimsUsuario,
  ): Promise<string> {
    const payload: PayloadJwt = {
      sub: usuario.id,
      email: usuario.email,
      sid: sesionId,
      roles: claims.roles,
      permisos: claims.permisos,
    };
    return this.jwt.signAsync(payload);
  }
}
