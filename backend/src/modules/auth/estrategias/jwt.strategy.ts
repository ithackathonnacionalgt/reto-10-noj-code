import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { InjectRepository } from '@nestjs/typeorm';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { Repository } from 'typeorm';
import { Sesion } from '../../../database/entities/schema.js';
import type {
  PayloadJwt,
  UsuarioAutenticado,
} from '../../../common/interfaces/usuario-autenticado.interface.js';
import { ESTRATEGIA_JWT } from '../auth.constants.js';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, ESTRATEGIA_JWT) {
  constructor(
    config: ConfigService,
    @InjectRepository(Sesion)
    private readonly sesiones: Repository<Sesion>,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: config.get<string>('JWT_SECRET') ?? 'cambia-este-secreto',
    });
  }

  /** Passport ya verifico firma y expiracion; aqui validamos la sesion. */
  async validate(payload: PayloadJwt): Promise<UsuarioAutenticado> {
    const sesion = await this.sesiones.findOne({ where: { id: payload.sid } });
    if (!sesion || sesion.revocadaEn || sesion.expiraEn.getTime() < Date.now()) {
      throw new UnauthorizedException('Sesion revocada o expirada');
    }
    return {
      id: payload.sub,
      email: payload.email,
      sesionId: payload.sid,
      roles: payload.roles ?? [],
      permisos: payload.permisos ?? [],
    };
  }
}
