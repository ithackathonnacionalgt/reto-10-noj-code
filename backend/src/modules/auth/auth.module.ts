import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { TypeOrmModule } from '@nestjs/typeorm';
import { duracionAMs } from '../../common/utils/duracion.js';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard.js';
import { PermisosGuard } from '../../common/guards/permisos.guard.js';
import {
  PerfilCiudadano,
  RefreshToken,
  Rol,
  Sesion,
  Usuario,
  UsuarioRol,
} from '../../database/entities/schema.js';
import { AuthController } from './auth.controller.js';
import { AuthService } from './auth.service.js';
import { JwtStrategy } from './estrategias/jwt.strategy.js';
import { PasswordService } from './servicios/password.service.js';
import { TokenService } from './servicios/token.service.js';

@Module({
  imports: [
    PassportModule,
    TypeOrmModule.forFeature([
      Usuario,
      UsuarioRol,
      Rol,
      PerfilCiudadano,
      Sesion,
      RefreshToken,
    ]),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.get<string>('JWT_SECRET') ?? 'cambia-este-secreto',
        signOptions: {
          expiresIn: Math.floor(
            duracionAMs(config.get<string>('JWT_ACCESS_EXPIRES_IN') ?? '15m') /
              1000,
          ),
        },
      }),
    }),
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    PasswordService,
    TokenService,
    JwtStrategy,
    // Guards globales: primero autentica, luego autoriza.
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_GUARD, useClass: PermisosGuard },
  ],
  exports: [AuthService],
})
export class AuthModule {}
