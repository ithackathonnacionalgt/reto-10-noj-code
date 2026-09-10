import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { DataSource, QueryFailedError, Repository } from 'typeorm';
import {
  PerfilCiudadano,
  Rol,
  Usuario,
  UsuarioRol,
} from '../../database/entities/schema.js';
import { EstadoUsuario } from '../../database/entities/enums.js';
import type { UsuarioAutenticado } from '../../common/interfaces/usuario-autenticado.interface.js';
import { ROLES } from './auth.constants.js';
import type { LoginDto } from './dto/login.dto.js';
import type { RegistroDto } from './dto/registro.dto.js';
import { PasswordService } from './servicios/password.service.js';
import {
  TokenService,
  type ClaimsUsuario,
  type ContextoPeticion,
  type DatosUsuarioToken,
  type ParDeTokens,
} from './servicios/token.service.js';

const CODIGO_UNIQUE_VIOLATION = '23505';

@Injectable()
export class AuthService {
  constructor(
    @InjectDataSource() private readonly dataSource: DataSource,
    @InjectRepository(Usuario)
    private readonly usuarios: Repository<Usuario>,
    @InjectRepository(UsuarioRol)
    private readonly usuarioRoles: Repository<UsuarioRol>,
    @InjectRepository(Rol)
    private readonly roles: Repository<Rol>,
    private readonly passwords: PasswordService,
    private readonly tokens: TokenService,
  ) {}

  /** Registro de una cuenta ciudadana (CLAUDE.md 36). */
  async registrar(dto: RegistroDto, ctx: ContextoPeticion): Promise<ParDeTokens> {
    const rolCiudadano = await this.roles.findOne({
      where: { clave: ROLES.CIUDADANO },
    });
    if (!rolCiudadano) {
      throw new NotFoundException(
        'Falta el rol base "ciudadano". Ejecuta el seed.',
      );
    }

    const hash = await this.passwords.hash(dto.password);

    let usuarioId: string;
    try {
      usuarioId = await this.dataSource.transaction(async (manager) => {
        const usuario = await manager.getRepository(Usuario).save(
          manager.getRepository(Usuario).create({
            email: dto.email.toLowerCase().trim(),
            hashPassword: hash,
            nombres: dto.nombres.trim(),
            apellidos: dto.apellidos.trim(),
            telefono: dto.telefono?.trim() ?? null,
            estado: EstadoUsuario.ACTIVO,
          }),
        );

        await manager.getRepository(UsuarioRol).save(
          manager.getRepository(UsuarioRol).create({
            usuarioId: usuario.id,
            rolId: rolCiudadano.id,
            institucionId: null,
          }),
        );

        await manager.getRepository(PerfilCiudadano).save(
          manager.getRepository(PerfilCiudadano).create({
            usuarioId: usuario.id,
            dpi: dto.dpi ?? null,
            nombres: dto.nombres.trim(),
            apellidos: dto.apellidos.trim(),
            telefono: dto.telefono?.trim() ?? null,
          }),
        );

        return usuario.id;
      });
    } catch (error) {
      if (
        error instanceof QueryFailedError &&
        (error.driverError as { code?: string })?.code ===
          CODIGO_UNIQUE_VIOLATION
      ) {
        throw new ConflictException(
          'Ya existe una cuenta con ese correo o DPI',
        );
      }
      throw error;
    }

    const claims = await this.cargarClaims(usuarioId);
    return this.tokens.generarPar(
      { id: usuarioId, email: dto.email.toLowerCase().trim() },
      claims,
      ctx,
    );
  }

  /** Inicio de sesion con correo y contrasena. */
  async login(dto: LoginDto, ctx: ContextoPeticion): Promise<ParDeTokens> {
    const usuario = await this.usuarios.findOne({
      where: { email: dto.email.toLowerCase().trim() },
    });
    const passwordOk =
      usuario &&
      (await this.passwords.verificar(usuario.hashPassword, dto.password));

    if (!usuario || !passwordOk) {
      throw new UnauthorizedException('Credenciales invalidas');
    }
    if (usuario.estado === EstadoUsuario.BLOQUEADO) {
      throw new ForbiddenException('La cuenta esta bloqueada');
    }
    if (usuario.estado === EstadoUsuario.INACTIVO) {
      throw new ForbiddenException('La cuenta esta inactiva');
    }

    usuario.ultimoAccesoEn = new Date();
    await this.usuarios.save(usuario);

    const claims = await this.cargarClaims(usuario.id);
    return this.tokens.generarPar(
      { id: usuario.id, email: usuario.email },
      claims,
      ctx,
    );
  }

  /** Rota el refresh token y emite un par nuevo (CLAUDE.md 19). */
  refrescar(
    refreshToken: string,
    ctx: ContextoPeticion,
  ): Promise<ParDeTokens> {
    return this.tokens.rotar(refreshToken, ctx, (usuarioId) =>
      this.datosUsuarioToken(usuarioId),
    );
  }

  /** Cierra la sesion actual. */
  async logout(sesionId: string): Promise<void> {
    await this.tokens.revocarSesion(sesionId);
  }

  /** Datos del usuario autenticado para GET /auth/perfil. */
  async perfil(usuario: UsuarioAutenticado) {
    const registro = await this.usuarios.findOne({
      where: { id: usuario.id },
      relations: { perfilCiudadano: true },
    });
    if (!registro) {
      throw new NotFoundException('Usuario no encontrado');
    }
    return {
      id: registro.id,
      email: registro.email,
      nombres: registro.nombres,
      apellidos: registro.apellidos,
      telefono: registro.telefono,
      estado: registro.estado,
      roles: usuario.roles,
      permisos: usuario.permisos,
      perfilCiudadano: registro.perfilCiudadano
        ? {
            dpi: registro.perfilCiudadano.dpi,
            departamentoId: registro.perfilCiudadano.departamentoId,
            municipioId: registro.perfilCiudadano.municipioId,
          }
        : null,
    };
  }

  /** Roles y permisos efectivos de un usuario. */
  private async cargarClaims(usuarioId: string): Promise<ClaimsUsuario> {
    const asignaciones = await this.usuarioRoles.find({
      where: { usuarioId },
      relations: { rol: { permisos: { permiso: true } } },
    });
    const roles = [...new Set(asignaciones.map((a) => a.rol.clave))];
    const permisos = [
      ...new Set(
        asignaciones.flatMap((a) =>
          (a.rol.permisos ?? []).map((rp) => rp.permiso.clave),
        ),
      ),
    ];
    return { roles, permisos };
  }

  private async datosUsuarioToken(
    usuarioId: string,
  ): Promise<DatosUsuarioToken> {
    const usuario = await this.usuarios.findOne({ where: { id: usuarioId } });
    if (!usuario) {
      throw new UnauthorizedException('El usuario ya no existe');
    }
    if (usuario.estado !== EstadoUsuario.ACTIVO) {
      throw new ForbiddenException('La cuenta no esta activa');
    }
    const claims = await this.cargarClaims(usuarioId);
    return { email: usuario.email, ...claims };
  }
}
